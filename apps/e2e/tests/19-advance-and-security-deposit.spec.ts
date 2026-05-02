import { test, expect, APIRequestContext } from '@playwright/test';
import { LoginPage } from '../pom/login.page';

// Helper — extract success body and assert success: true
async function ok(res: any) {
  const body = await res.json();
  expect(body.success).toBe(true);
  return body.data;
}

async function makeBooking(request: APIRequestContext, tenantId: string, roomTypeId: string) {
  const dateToday = new Date().toISOString().split('T')[0];
  const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const bookingRes = await request.post('/api/v1/public/bookings', {
    data: {
      tenantId,
      guestName: 'E2E Advance/Deposit Guest',
      guestPhone: '5559876543',
      checkInDate: dateToday,
      checkOutDate: dateTomorrow,
      numAdults: 1,
      numChildren: 0,
      roomSelections: [{ roomTypeId }],
    },
  });
  return ok(bookingRes);
}

test.describe('Advance + Security Deposit at Check-In', () => {
  let tenantId: string;
  let roomTypeId: string;

  test.beforeEach(async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('desk-premium@e2e.com', 'Welcome@1');

    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await ok(propRes);
    tenantId = property.id;
    roomTypeId = property.roomTypes[0].id;
  });

  test('records advance and deposit per room and creates GuestPayment entries', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);

    // Confirm
    await request.post(`/api/v1/bookings/${booking.id}/confirm`, {
      data: { paymentMode: 'pay_at_hotel', amount: 0 },
    });

    const bookingRoomId = booking.bookingRooms[0].id;

    // Check-in with advance ₹2000 + deposit ₹1500 (cash)
    const ciRes = await request.post(`/api/v1/check-in-out/${booking.id}/check-in`, {
      data: {
        guestDetails: [{
          fullName: 'E2E Advance/Deposit Guest',
          idProofType: 'aadhaar',
          idProofNumber: '999988887777',
          nationality: 'Indian',
        }],
        payments: [{
          bookingRoomId,
          advanceAmount: 2000,
          securityDeposit: 1500,
          paymentMethod: 'cash',
        }],
      },
    });
    expect(ciRes.status()).toBe(200);

    // Verify booking + bookingRoom state via GET
    const bRes = await request.get(`/api/v1/bookings/${booking.id}`);
    const bData = await ok(bRes);
    expect(bData.status).toBe('checked_in');
    expect(bData.advancePaid).toBeGreaterThanOrEqual(2000);
    const br = bData.bookingRooms.find((x: any) => x.id === bookingRoomId);
    expect(br.advanceAmount).toBe(2000);
    expect(br.securityDeposit).toBe(1500);
    expect(br.securityDepositStatus).toBe('held');

    // GuestPayment records — should be at least one advance + one security_deposit
    const advancePayment = bData.guestPayments.find((p: any) => p.category === 'advance');
    const depositPayment = bData.guestPayments.find((p: any) => p.category === 'security_deposit');
    expect(advancePayment.amount).toBe(2000);
    expect(advancePayment.method).toBe('cash');
    expect(depositPayment.amount).toBe(1500);
  });

  test('rooms endpoint exposes advance and deposit on the active occupancy', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);
    await request.post(`/api/v1/bookings/${booking.id}/confirm`, { data: { paymentMode: 'pay_at_hotel', amount: 0 } });

    // Need a room assigned for the active-occupancy lookup
    const availRes = await request.get(`/api/v1/rooms/availability?checkIn=${booking.checkInDate.slice(0,10)}&checkOut=${booking.checkOutDate.slice(0,10)}&roomTypeId=${roomTypeId}`);
    const avail = await ok(availRes);
    const roomId = avail[0].id;

    const bookingRoomId = booking.bookingRooms[0].id;

    await request.post(`/api/v1/check-in-out/${booking.id}/check-in`, {
      data: {
        roomAssignments: [{ bookingRoomId, roomId }],
        payments: [{ bookingRoomId, advanceAmount: 5000, securityDeposit: 3000, paymentMethod: 'upi' }],
      },
    });

    const roomsRes = await request.get('/api/v1/rooms');
    const rooms = await ok(roomsRes);
    const occupied = rooms.find((r: any) => r.id === roomId);
    expect(occupied.currentOccupancy).not.toBeNull();
    expect(occupied.currentOccupancy.advanceAmount).toBe(5000);
    expect(occupied.currentOccupancy.securityDeposit).toBe(3000);
    expect(occupied.currentOccupancy.securityDepositStatus).toBe('held');
    expect(occupied.currentOccupancy.booking.bookingNumber).toBe(booking.bookingNumber);
  });

  test('checkout — full deposit refund records security_refund payment and updates status', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);
    await request.post(`/api/v1/bookings/${booking.id}/confirm`, { data: { paymentMode: 'pay_at_hotel', amount: 0 } });
    const bookingRoomId = booking.bookingRooms[0].id;

    await request.post(`/api/v1/check-in-out/${booking.id}/check-in`, {
      data: { payments: [{ bookingRoomId, advanceAmount: 0, securityDeposit: 2000, paymentMethod: 'cash' }] },
    });

    const coRes = await request.post(`/api/v1/check-in-out/${booking.id}/check-out`, {
      data: {
        paymentMethod: 'cash',
        settledAmount: 0,
        depositSettlements: [{ bookingRoomId, action: 'refund' }],
      },
    });
    expect(coRes.status()).toBe(200);

    const bRes = await request.get(`/api/v1/bookings/${booking.id}`);
    const bData = await ok(bRes);
    const br = bData.bookingRooms.find((x: any) => x.id === bookingRoomId);
    expect(br.securityDepositStatus).toBe('refunded');
    expect(br.securityDepositRefunded).toBe(2000);

    const refundEntry = bData.guestPayments.find((p: any) => p.category === 'security_refund');
    expect(refundEntry.amount).toBe(-2000);
  });

  test('checkout — partial refund clamps to held amount and records partial status', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);
    await request.post(`/api/v1/bookings/${booking.id}/confirm`, { data: { paymentMode: 'pay_at_hotel', amount: 0 } });
    const bookingRoomId = booking.bookingRooms[0].id;

    await request.post(`/api/v1/check-in-out/${booking.id}/check-in`, {
      data: { payments: [{ bookingRoomId, advanceAmount: 0, securityDeposit: 2500, paymentMethod: 'cash' }] },
    });

    await request.post(`/api/v1/check-in-out/${booking.id}/check-out`, {
      data: {
        paymentMethod: 'cash',
        settledAmount: 0,
        depositSettlements: [{
          bookingRoomId,
          action: 'partial',
          refundedAmount: 1000,
          notes: 'Towel damage — ₹1500 retained',
        }],
      },
    });

    const bData = await ok(await request.get(`/api/v1/bookings/${booking.id}`));
    const br = bData.bookingRooms.find((x: any) => x.id === bookingRoomId);
    expect(br.securityDepositStatus).toBe('partial');
    expect(br.securityDepositRefunded).toBe(1000);
    expect(br.securityDepositNotes).toContain('Towel damage');
  });

  test('checkout — forfeit records zero refund and reason notes', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);
    await request.post(`/api/v1/bookings/${booking.id}/confirm`, { data: { paymentMode: 'pay_at_hotel', amount: 0 } });
    const bookingRoomId = booking.bookingRooms[0].id;

    await request.post(`/api/v1/check-in-out/${booking.id}/check-in`, {
      data: { payments: [{ bookingRoomId, advanceAmount: 0, securityDeposit: 1200, paymentMethod: 'cash' }] },
    });

    await request.post(`/api/v1/check-in-out/${booking.id}/check-out`, {
      data: {
        paymentMethod: 'cash',
        settledAmount: 0,
        depositSettlements: [{ bookingRoomId, action: 'forfeit', notes: 'Broken AC remote' }],
      },
    });

    const bData = await ok(await request.get(`/api/v1/bookings/${booking.id}`));
    const br = bData.bookingRooms.find((x: any) => x.id === bookingRoomId);
    expect(br.securityDepositStatus).toBe('forfeited');
    expect(br.securityDepositRefunded).toBe(0);
    expect(br.securityDepositNotes).toBe('Broken AC remote');

    // No security_refund payment row should be created when nothing was refunded
    const refundEntry = bData.guestPayments.find((p: any) => p.category === 'security_refund');
    expect(refundEntry).toBeUndefined();
  });
});
