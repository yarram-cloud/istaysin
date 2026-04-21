import { prisma, withTenant } from '../config/database';
import axios from 'axios';

/**
 * Pushes standard JSON updates to connected OTA Channels (MakeMyTrip, Agoda, etc).
 */
export async function pushInventoryUpdate(tenantId: string, roomTypeId: string, date: string, availableCount: number, price?: number) {
  try {
    const mappings = await prisma.channelRoomMapping.findMany({
      where: {
        roomTypeId,
        connection: {
          tenantId,
          isActive: true
        }
      },
      include: { connection: true }
    });

    if (mappings.length === 0) return;

    for (const mapping of mappings) {
      const channel = mapping.connection.channel;
      const hotelId = mapping.connection.hotelId;
      const endpoint = (mapping.connection as any).webhookUrl as string | null;

      // Construct Standardized JSON Payload for the OTA Worker
      const payload = {
        hotelId: hotelId,
        updateType: "inventory_sync",
        timestamp: new Date().toISOString(),
        availability: [
          {
            roomId: mapping.channelRoomId,
            date: date,
            allotment: availableCount,
            rate: price || undefined
          }
        ]
      };

      console.log(`[OTA SYNC -> ${channel.toUpperCase()}] Dispatching JSON to ${endpoint || 'MOCK_URL'}`);
      console.log(JSON.stringify(payload, null, 2));
      
      if (endpoint && endpoint.startsWith('http')) {
        try {
          await axios.post(endpoint, payload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mapping.connection.apiKey}`
            },
            timeout: 5000
          });
        } catch (httpErr: any) {
          console.error(`[OTA SYNC ERROR -> ${channel}] HTTP request failed: ${httpErr.message}`);
        }
      } else {
        // Mocking a successful network request if no active endpoint is present
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (err) {
    console.error('[OTA SYNC FATAL ERROR]', err);
  }
}

/**
 * Parses generic inbound OTA JSON Webhooks, explicitly mapping it to local bookings.
 */
export async function mockIncomingBookingPayload(channel: string, payload: any) {
  console.log(`[OTA WEBHOOK INGESTION -> ${channel.toUpperCase()}] Processing JSON:`);
  console.log(JSON.stringify(payload, null, 2));

  try {
    // 1. Identify Connection via OTA Hotel ID
    const otaHotelId = payload.hotelId;
    const otaRoomId = payload.roomId;
    
    if (!otaHotelId || !otaRoomId) {
      console.error('[OTA WEBHOOK ERROR] Missing hotelId or roomId in payload');
      return false;
    }

    const mapping = await prisma.channelRoomMapping.findFirst({
      where: {
        channelRoomId: otaRoomId,
        connection: {
          hotelId: otaHotelId,
          channel: channel,
          isActive: true
        }
      },
      include: { connection: true }
    });

    if (!mapping) {
      console.error(`[OTA WEBHOOK ERROR] Unknown channelRoomId ${otaRoomId} for hotel ${otaHotelId}`);
      return false;
    }

    const tenantId = mapping.connection.tenantId;

    // 2. Draft Database Booking
    await withTenant(tenantId, async () => {
      const checkInDate = new Date(payload.checkInDate || Date.now());
      const checkOutDate = new Date(payload.checkOutDate || Date.now() + 86400000);
      const totalAmount = parseFloat(payload.totalAmount) || 0;
      
      const newBooking = await prisma.booking.create({
        data: {
          tenantId,
          bookingNumber: `OTA-${Date.now().toString(36).toUpperCase().substring(2)}-${require('crypto').randomInt(100000, 999999)}`,
          guestName: payload.guestName || 'OTA Guest',
          guestEmail: payload.guestEmail || '',
          guestPhone: payload.guestPhone || '',
          source: channel,
          checkInDate,
          checkOutDate,
          numAdults: parseInt(payload.numAdults) || 2,
          numRooms: 1,
          status: 'confirmed', // Auto-confirm OTA bookings ideally
          totalAmount: totalAmount,
          advancePaid: payload.isPrepaid ? totalAmount : 0,
          balanceDue: payload.isPrepaid ? 0 : totalAmount,
          bookingRooms: {
            create: [
              {
                tenantId,
                roomTypeId: mapping.roomTypeId,
                ratePerNight: totalAmount,
                // We leave roomId blank as the front desk usually assigns physical rooms closer to check-in
              }
            ]
          }
        }
      });
      console.log(`[OTA WEBHOOK SUCCESS] Auto-generated booking ${newBooking.bookingNumber} for ${payload.guestName}`);
    });

    return true;
  } catch (err: any) {
    console.error(`[OTA WEBHOOK FATAL] Could not process JSON reservation: ${err.message}`);
    return false;
  }
}
