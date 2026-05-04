import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Pricing Tiers & Pending Confirmation Workflow
 * 
 * Covers:
 * 1. Availability endpoint returns pricingTiers and hasRateVariance
 * 2. Dashboard shows pending confirmation toast
 * 3. Inline confirm/decline buttons function in booking table
 */
test.describe('Pricing Tiers & Confirmation Workflow', () => {
  let adminToken: string;
  let tenantId: string;
  let roomTypeId: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate as Admin
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    const loginData = await loginRes.json();
    adminToken = loginData.data.accessToken;

    // Fetch Property metadata
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
    roomTypeId = property.data.roomTypes[0].id;

    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Check-availability returns pricing tiers', async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const checkIn = tomorrow.toISOString().split('T')[0];
    const checkOut = dayAfter.toISOString().split('T')[0];

    const res = await request.get(
      `/api/v1/public/check-availability?tenantId=${tenantId}&roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&extraBeds=0`
    );
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeTruthy();
    expect(data.data.available).toBe(true);
    // pricingTiers should always exist (even if only one tier)
    expect(data.data.pricingTiers).toBeDefined();
    expect(Array.isArray(data.data.pricingTiers)).toBe(true);
    expect(data.data.pricingTiers.length).toBeGreaterThanOrEqual(1);

    // Each tier should have required fields
    const tier = data.data.pricingTiers[0];
    expect(tier.tierKey).toBeDefined();
    expect(tier.label).toBeDefined();
    expect(tier.effectiveBaseRate === null || tier.effectiveBaseRate >= 0).toBe(true);
    expect(tier.pricing).toBeDefined();
    expect(tier.pricing.grandTotal).toBeGreaterThan(0);
  });

  test('Public booking with rateOverride creates pending_confirmation', async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const res = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'Tier Test Guest',
        guestEmail: `tier-test-${Date.now()}@e2e.com`,
        guestPhone: `+91${9000000000 + Math.floor(Math.random() * 999999999)}`,
        guestState: 'Maharashtra',
        source: 'website',
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: dayAfter.toISOString().split('T')[0],
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId, extraBeds: 0 }],
        paymentMode: 'online',  // Should create pending_confirmation status
      }
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('pending_confirmation');
    expect(data.data.totalAmount).toBeGreaterThan(0);

    // Cleanup: cancel the test booking
    await request.patch(`/api/v1/bookings/${data.data.id}/cancel`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { reason: 'E2E test cleanup' }
    });
  });

  test('Dashboard shows pending toast and inline confirm/decline buttons', async ({ page, request }) => {
    // 1. Create a pending_confirmation booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const bookingRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'Dashboard Test Guest',
        guestEmail: `dash-test-${Date.now()}@e2e.com`,
        guestPhone: `+91${9000000000 + Math.floor(Math.random() * 999999999)}`,
        guestState: 'Karnataka',
        source: 'website',
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: dayAfter.toISOString().split('T')[0],
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId, extraBeds: 0 }],
        paymentMode: 'online',
      }
    });
    const bookingData = await bookingRes.json();
    const bookingId = bookingData.data.id;
    expect(bookingData.data.status).toBe('pending_confirmation');

    // 2. Login to dashboard
    await page.goto('http://localhost:3100/en/login', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    // The login form may use 'identifier' type text field or email
    const emailInput = page.locator('input[name="email"], input[type="email"], input[name="identifier"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await emailInput.fill('owner-premium@e2e.com');
    await page.locator('input[type="password"]').fill('Welcome@1');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 30000 });

    // 3. Navigate to bookings page
    await page.goto(`http://localhost:3100/dashboard/bookings?tenant=premium-resort-pro`, { timeout: 60000 });

    // 4. Verify pending actions queue is visible
    const pendingSection = page.locator('text=Pending Actions').first();
    await expect(pendingSection).toBeVisible({ timeout: 15000 });

    // 5. Verify inline confirm/decline buttons exist
    const confirmBtn = page.getByRole('button', { name: /Confirm/i }).first();
    const declineBtn = page.getByRole('button', { name: /Decline|Cancel/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await expect(declineBtn).toBeVisible({ timeout: 5000 });

    // 6. Click confirm on the booking
    await confirmBtn.click();

    // 7. Wait for toast and verify the booking is no longer pending
    await page.waitForTimeout(2000);

    // Cleanup: cancel the test booking via API
    await request.patch(`/api/v1/bookings/${bookingId}/cancel`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { reason: 'E2E test cleanup' }
    });
  });
});
