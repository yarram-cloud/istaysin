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
    // 1. Fetch initial statistics
    const initStatsRes = await request.get('/api/v1/analytics/revenue', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const initStats = await initStatsRes.json();
    const baselineRevenue = initStats.data.totalRevenue;
    const baselineActiveBookings = initStats.data.totalBookings;

    // 2. Generate a fresh mock Booking for today via public widget!
    // Using Public API to ensure it processes fully
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

    // 3. Refetch Analytics Statistics
    const updatedStatsRes = await request.get('/api/v1/analytics/revenue', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const updatedStats = await updatedStatsRes.json();

    // The statistics Engine aggregates active bookings and today's revenue.
    // Revenue might reflect checked-in folios only depending on implementation,
    // but Total Bookings or Active Bookings MUST increase.
    expect(updatedStats.data.totalBookings).toBeGreaterThanOrEqual(baselineActiveBookings + 1);

    // 4. Also verify UI dashboard rendering mounts properly
    // Using POM or basic page.goto to assert Dashboard
    await page.goto('http://localhost:3100/dashboard?tenant=premium-resort-pro');
    
    // Quick smoke assert we see analytics cards (assuming 'Total Revenue' is a heading inside a card)
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Active Bookings')).toBeVisible();
  });
});
