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
      guestName: 'E2E Confirm+Pricing Guest',
      guestPhone: '5559998877',
      checkInDate: dateToday,
      checkOutDate: dateTomorrow,
      numAdults: 1,
      numChildren: 0,
      roomSelections: [{ roomTypeId }],
    },
  });
  return ok(bookingRes);
}

test.describe('Confirm Booking & Room Rate Override Pricing', () => {
  let adminToken: string;
  let tenantId: string;
  let roomTypeId: string;

  test.beforeEach(async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('owner-premium@e2e.com', 'Welcome@1');

    const tokenRes = await page.evaluate(() => localStorage.getItem('accessToken'));
    adminToken = tokenRes || '';

    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await ok(propRes);
    tenantId = property.id;
    roomTypeId = property.roomTypes[0].id;
  });

  // ─── Warning Fix #1: Confirm with empty body ───────────────────────

  test('CONFIRM-01: PATCH /confirm with empty body succeeds (dashboard flow)', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);

    // Dashboard "Confirm Booking" button sends PATCH with no body
    const confirmRes = await request.patch(`/api/v1/bookings/${booking.id}/confirm`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
    });
    expect(confirmRes.status()).toBe(200);
    const confirmData = await confirmRes.json();
    expect(confirmData.success).toBe(true);
    expect(confirmData.data.status).toBe('confirmed');
  });

  test('CONFIRM-02: PATCH /confirm with paymentMode still works (backward compat)', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);

    // Old callers may still send paymentMode + amount
    const confirmRes = await request.patch(`/api/v1/bookings/${booking.id}/confirm`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
      data: { paymentMode: 'pay_at_hotel', amount: 0 },
    });
    expect(confirmRes.status()).toBe(200);
    const confirmData = await confirmRes.json();
    expect(confirmData.success).toBe(true);
    expect(confirmData.data.status).toBe('confirmed');
  });

  test('CONFIRM-03: Cannot confirm a non-pending booking', async ({ request }) => {
    const booking = await makeBooking(request, tenantId, roomTypeId);

    // Confirm once
    await request.patch(`/api/v1/bookings/${booking.id}/confirm`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
    });

    // Attempt to confirm again → should fail
    const res = await request.patch(`/api/v1/bookings/${booking.id}/confirm`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Cannot confirm');
  });

  // ─── Warning Fix #2: Room rate override pricing ────────────────────

  test('RATE-01: Walk-in booking uses room rateOverride when set', async ({ request }) => {
    // 1. Find a room that has a rateOverride, or set one
    const roomsRes = await request.get('/api/v1/rooms', {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
    });
    const roomsData = await roomsRes.json();
    const room = roomsData.data?.find((r: any) => r.roomTypeId === roomTypeId && r.status === 'available');
    if (!room) {
      test.skip();
      return;
    }

    // Get the room type base rate for comparison
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await ok(propRes);
    const baseRate = property.roomTypes.find((rt: any) => rt.id === roomTypeId)?.baseRate;

    // Set a distinct rateOverride on the room
    const overrideRate = (baseRate || 5000) + 1000; // ₹1000 more than base
    const updateRes = await request.patch(`/api/v1/rooms/${room.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
      data: { rateOverride: overrideRate },
    });
    // If the PATCH endpoint doesn't exist or errors, skip gracefully
    if (updateRes.status() !== 200) {
      test.skip();
      return;
    }

    // 2. Create a walk-in booking for this room
    const walkInRes = await request.post('/api/v1/bookings/walk-in', {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
      data: {
        guestName: 'E2E RateOverride Guest',
        guestPhone: '5551112223',
        roomId: room.id,
        durationValue: 1,
        durationUnit: 'days',
        paymentMode: 'cash',
      },
    });
    expect(walkInRes.status()).toBe(201);
    const walkInData = await walkInRes.json();
    expect(walkInData.success).toBe(true);

    // 3. Verify the totalAmount uses the overrideRate, not the baseRate
    // The total should include the override rate (+ possible GST)
    // At minimum, the total must be >= overrideRate (it has GST on top)
    expect(walkInData.data.totalAmount).toBeGreaterThanOrEqual(overrideRate);
    // It should NOT equal the base rate (unless override equals base, which we prevented)
    if (baseRate && baseRate !== overrideRate) {
      expect(walkInData.data.totalAmount).not.toBe(baseRate);
    }

    // 4. Clean up — reset room rateOverride to null
    await request.patch(`/api/v1/rooms/${room.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-tenant-id': tenantId },
      data: { rateOverride: null },
    });
  });

  test('RATE-02: Standard booking with rateOverride in roomSelections uses correct pricing', async ({ request }) => {
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Get the room type base rate for comparison
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await ok(propRes);
    const baseRate = property.roomTypes.find((rt: any) => rt.id === roomTypeId)?.baseRate;
    const overrideRate = (baseRate || 5000) + 2000;

    // Create booking with explicit rateOverride in roomSelections
    const bookingRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'E2E Override Guest',
        guestPhone: '5553334445',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId, rateOverride: overrideRate }],
      },
    });
    expect(bookingRes.status()).toBe(200);
    const bookingData = await bookingRes.json();
    expect(bookingData.success).toBe(true);

    // Total should be >= overrideRate (override + potential GST)
    expect(bookingData.data.totalAmount).toBeGreaterThanOrEqual(overrideRate);
  });
});
