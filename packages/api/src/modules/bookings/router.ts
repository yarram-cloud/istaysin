import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { bookingSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';
import { sendBookingConfirmation } from '../../services/email';

export const bookingsRouter = Router();

bookingsRouter.use(authenticate, resolveTenant, requireTenant);

// Generate unique booking number
function generateBookingNumber(): string {
  const prefix = 'IS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Clamp pagination values for safety
function clampPagination(page: string | undefined, limit: string | undefined) {
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  return { page: p, limit: l };
}

// POST /bookings
bookingsRouter.post('/', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;

    const result = await withTenant(req.tenantId!, async () => {
      const bookingNumber = generateBookingNumber();

      // Calculate nights
      const nights = Math.ceil(
        (new Date(data.checkOutDate).getTime() - new Date(data.checkInDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (nights <= 0) {
        return { error: 'Check-out must be after check-in', status: 400 };
      }

      // Calculate total from room selections
      let totalAmount = 0;
      const bookingRoomsData = [];

      for (const sel of data.roomSelections) {
        const roomType = await prisma.roomType.findUnique({ where: { id: sel.roomTypeId } });
        if (!roomType) {
          return { error: `Room type ${sel.roomTypeId} not found`, status: 400 };
        }
        const ratePerNight = roomType.baseRate;
        const extraBedCharge = sel.extraBeds * roomType.extraBedCharge;
        totalAmount += (ratePerNight + extraBedCharge) * nights;
        bookingRoomsData.push({
          tenantId: req.tenantId!,
          roomId: sel.roomId || null,
          roomTypeId: sel.roomTypeId,
          ratePerNight,
          extraBeds: sel.extraBeds,
          extraBedCharge,
        });
      }

      const advancePaid = data.advanceAmount || 0;
      const booking = await prisma.booking.create({
        data: {
          tenantId: req.tenantId!,
          bookingNumber,
          guestProfileId: data.guestProfileId || null,
          guestName: data.guestName,
          guestEmail: data.guestEmail?.toLowerCase() || null,
          guestPhone: data.guestPhone,
          source: data.source,
          checkInDate: new Date(data.checkInDate),
          checkOutDate: new Date(data.checkOutDate),
          numAdults: data.numAdults,
          numChildren: data.numChildren,
          numRooms: data.roomSelections.length,
          status: data.source === 'walkin' ? 'confirmed' : 'pending_confirmation',
          totalAmount,
          advancePaid,
          balanceDue: totalAmount - advancePaid,
          specialRequests: data.specialRequests || null,
          createdBy: req.userId,
          bookingRooms: { create: bookingRoomsData },
        },
        include: { bookingRooms: true },
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'booking', booking.id, { bookingNumber, totalAmount }, req.ip || undefined);

      // Send confirmation email (async, don't await)
      if (data.guestEmail) {
        const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! }, select: { name: true } });
        sendBookingConfirmation(data.guestEmail, {
          bookingNumber,
          guestName: data.guestName,
          propertyName: tenant?.name || 'Property',
          checkIn: data.checkInDate,
          checkOut: data.checkOutDate,
          totalAmount,
        }).catch(console.error);
      }

      return { data: booking };
    });

    if ('error' in result) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true, data: result.data, message: 'Booking created successfully' });
  } catch (err) {
    console.error('[BOOKING CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// GET /bookings
bookingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const { page, limit } = clampPagination(req.query.page as string, req.query.limit as string);

    await withTenant(req.tenantId!, async () => {
      const where: any = { tenantId: req.tenantId! };
      if (status) where.status = status;
      if (startDate) where.checkInDate = { ...(where.checkInDate || {}), gte: new Date(startDate as string) };
      if (endDate) where.checkOutDate = { ...(where.checkOutDate || {}), lte: new Date(endDate as string) };

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            bookingRooms: {
              include: { room: { select: { roomNumber: true } }, roomType: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        success: true,
        data: bookings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    });
  } catch (err) {
    console.error('[BOOKING LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id
bookingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
          bookingRooms: {
            include: {
              room: { select: { id: true, roomNumber: true, floor: { select: { name: true } } } },
              roomType: { select: { id: true, name: true } },
            },
          },
          bookingGuests: true,
          folioCharges: { orderBy: { chargeDate: 'asc' } },
          guestPayments: { orderBy: { createdAt: 'desc' } },
          invoices: true,
        },
      });

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      res.json({ success: true, data: booking });
    });
  } catch (err) {
    console.error('[BOOKING GET ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// PATCH /bookings/:id/confirm
bookingsRouter.patch('/:id/confirm', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const result = await withTenant(req.tenantId!, async () => {
      // Verify booking exists and is in confirmable state
      const existing = await prisma.booking.findUnique({ where: { id: req.params.id }, select: { status: true } });
      if (!existing) return { error: 'Booking not found', status: 404 };
      if (existing.status !== 'pending_confirmation') {
        return { error: `Cannot confirm booking with status: ${existing.status}`, status: 400 };
      }

      const booking = await prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'confirmed' },
      });
      await logAudit(req.tenantId!, req.userId, 'CONFIRM', 'booking', booking.id, {}, req.ip || undefined);
      return { data: booking };
    });

    if ('error' in result) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to confirm booking' });
  }
});

// POST /bookings/:id/cancel
bookingsRouter.post('/:id/cancel', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const result = await withTenant(req.tenantId!, async () => {
      // Verify booking exists and is cancellable
      const existing = await prisma.booking.findUnique({ where: { id: req.params.id }, select: { status: true } });
      if (!existing) return { error: 'Booking not found', status: 404 };
      if (['checked_out', 'cancelled'].includes(existing.status)) {
        return { error: `Cannot cancel booking with status: ${existing.status}`, status: 400 };
      }

      const booking = await prisma.booking.update({
        where: { id: req.params.id },
        data: {
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by staff',
          cancelledAt: new Date(),
        },
      });

      // Release rooms
      const bookingRooms = await prisma.bookingRoom.findMany({ where: { bookingId: booking.id } });
      for (const br of bookingRooms) {
        if (br.roomId) {
          await prisma.room.update({ where: { id: br.roomId }, data: { status: 'available' } });
        }
      }

      await logAudit(req.tenantId!, req.userId, 'CANCEL', 'booking', booking.id, { reason }, req.ip || undefined);
      return { data: booking };
    });

    if ('error' in result) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.data, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});
