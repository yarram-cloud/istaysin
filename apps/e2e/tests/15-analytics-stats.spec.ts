import { test, expect } from '@playwright/test';

test.describe('Dashboard Analytics Re-calculation Workflows', () => {
  let adminToken: string;
  let tenantId: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate Admin
    const adminRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    adminToken = (await adminRes.json()).data.accessToken;

    // Fetch Property metrics
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;

    // Context switch
    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Booking creations actively inflate Daily Revenue and Occupancy aggregations', async ({ page, request }) => {
    // 1. Fetch initial statistics via legacy /revenue endpoint
    const initStatsRes = await request.get('/api/v1/analytics/revenue', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const initStats = await initStatsRes.json();
    const baselineActiveBookings = initStats.data.totalBookings;

    // 2. Generate a fresh mock Booking for today via public widget!
    const propMetaRes = await request.get(`/api/v1/public/properties/premium-resort-pro`);
    const propMeta = await propMetaRes.json();
    const roomTypeId = propMeta.data.roomTypes[0].id;
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'Analytics Tester',
        guestEmail: 'analytics.test@e2e.com',
        guestPhone: '5552221111',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId }]
      }
    });

    // 3. Refetch via legacy endpoint — Total Bookings MUST increase
    const updatedStatsRes = await request.get('/api/v1/analytics/revenue', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const updatedStats = await updatedStatsRes.json();
    expect(updatedStats.data.totalBookings).toBeGreaterThanOrEqual(baselineActiveBookings + 1);

    // 4. Smoke test UI — check for cards that exist in the new analytics dashboard
    await page.goto('http://localhost:3100/dashboard?tenant=premium-resort-pro');
    // 'Room Revenue' is the correct heading (was 'Total Revenue' before rebuild)
    await expect(page.getByText('Room Revenue')).toBeVisible({ timeout: 8000 });
    // 'Total Bookings' is the correct heading (was 'Active Bookings' before rebuild)
    await expect(page.getByText('Total Bookings')).toBeVisible({ timeout: 8000 });
  });

  test('ANA-V2-01: overview-v2 endpoint returns expected data shape', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request.get(`/api/v1/analytics/overview-v2?from=${today}&to=${today}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify data shape
    expect(body.data).toHaveProperty('occupancy');
    expect(body.data.occupancy).toHaveProperty('current');
    expect(body.data.occupancy).toHaveProperty('total');
    expect(body.data.occupancy).toHaveProperty('percent');

    expect(body.data).toHaveProperty('revenue');
    expect(body.data.revenue).toHaveProperty('period');
    expect(body.data.revenue).toHaveProperty('today');

    expect(body.data).toHaveProperty('kpi');
    expect(body.data.kpi).toHaveProperty('adr');
    expect(body.data.kpi).toHaveProperty('revpar');
    expect(body.data.kpi).toHaveProperty('avgLengthOfStay');
    expect(body.data.kpi).toHaveProperty('noShowRate');
    expect(body.data.kpi).toHaveProperty('cancellationRate');
    expect(body.data.kpi).toHaveProperty('repeatGuestPercent');

    expect(body.data).toHaveProperty('today');
    expect(body.data.today).toHaveProperty('arrivalsExpected');
    expect(body.data.today).toHaveProperty('departuresExpected');
    expect(body.data.today).toHaveProperty('overdueCheckouts');
    expect(body.data.today).toHaveProperty('pendingConfirmation');

    expect(body.data).toHaveProperty('topRoomTypes');
    expect(Array.isArray(body.data.topRoomTypes)).toBe(true);

    expect(body.data).toHaveProperty('bookingSources');
    expect(body.data).toHaveProperty('guestCount');
  });

  test('ANA-V2-02: overview-v2 returns 401 without auth token', async ({ request }) => {
    const res = await request.get('/api/v1/analytics/overview-v2');
    expect(res.status()).toBe(401);
  });

  test('ANA-V2-03: overview-v2 returns 400 for invalid date params', async ({ request }) => {
    const res = await request.get('/api/v1/analytics/overview-v2?from=not-a-date&to=2026-04-30', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ANA-V2-04: analytics dashboard shows Today At-a-Glance panel', async ({ page }) => {
    await page.goto('http://localhost:3100/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Today At-a-Glance')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Arrivals Expected')).toBeVisible();
    await expect(page.getByText('Departures Due')).toBeVisible();
    await expect(page.getByText('Overdue Check-outs')).toBeVisible();
  });
});
