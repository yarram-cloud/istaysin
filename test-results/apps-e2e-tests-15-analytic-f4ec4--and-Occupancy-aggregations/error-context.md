# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\15-analytics-stats.spec.ts >> Dashboard Analytics Re-calculation Workflows >> Booking creations actively inflate Daily Revenue and Occupancy aggregations
- Location: apps\e2e\tests\15-analytics-stats.spec.ts:26:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard Analytics Re-calculation Workflows', () => {
  4  |   let adminToken: string;
  5  |   let tenantId: string;
  6  | 
  7  |   test.beforeEach(async ({ request }) => {
  8  |     // Authenticate Admin
> 9  |     const adminRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  10 |       data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
  11 |     });
  12 |     adminToken = (await adminRes.json()).data.accessToken;
  13 | 
  14 |     // Fetch Property metrics
  15 |     const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  16 |     const property = await propRes.json();
  17 |     tenantId = property.data.id;
  18 | 
  19 |     // Context switch
  20 |     await request.post('/api/v1/tenants/switch', {
  21 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  22 |       data: { tenantId }
  23 |     });
  24 |   });
  25 | 
  26 |   test('Booking creations actively inflate Daily Revenue and Occupancy aggregations', async ({ page, request }) => {
  27 |     // 1. Fetch initial statistics
  28 |     const initStatsRes = await request.get('/api/v1/analytics/revenue', {
  29 |       headers: { 'Authorization': `Bearer ${adminToken}` }
  30 |     });
  31 |     const initStats = await initStatsRes.json();
  32 |     const baselineRevenue = initStats.data.totalRevenue;
  33 |     const baselineActiveBookings = initStats.data.totalBookings;
  34 | 
  35 |     // 2. Generate a fresh mock Booking for today via public widget!
  36 |     // Using Public API to ensure it processes fully
  37 |     const propMetaRes = await request.get(`/api/v1/public/properties/premium-resort-pro`);
  38 |     const propMeta = await propMetaRes.json();
  39 |     const roomTypeId = propMeta.data.roomTypes[0].id;
  40 |     const dateToday = new Date().toISOString().split('T')[0];
  41 |     const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  42 | 
  43 |     await request.post('/api/v1/public/bookings', {
  44 |       data: {
  45 |         tenantId,
  46 |         guestName: 'Analytics Tester',
  47 |         guestEmail: 'analytics.test@e2e.com',
  48 |         guestPhone: '5552221111',
  49 |         checkInDate: dateToday,
  50 |         checkOutDate: dateTomorrow,
  51 |         numAdults: 1,
  52 |         numChildren: 0,
  53 |         roomSelections: [{ roomTypeId }]
  54 |       }
  55 |     });
  56 | 
  57 |     // 3. Refetch Analytics Statistics
  58 |     const updatedStatsRes = await request.get('/api/v1/analytics/revenue', {
  59 |       headers: { 'Authorization': `Bearer ${adminToken}` }
  60 |     });
  61 |     const updatedStats = await updatedStatsRes.json();
  62 | 
  63 |     // The statistics Engine aggregates active bookings and today's revenue.
  64 |     // Revenue might reflect checked-in folios only depending on implementation,
  65 |     // but Total Bookings or Active Bookings MUST increase.
  66 |     expect(updatedStats.data.totalBookings).toBeGreaterThanOrEqual(baselineActiveBookings + 1);
  67 | 
  68 |     // 4. Also verify UI dashboard rendering mounts properly
  69 |     // Using POM or basic page.goto to assert Dashboard
  70 |     await page.goto('http://localhost:3100/dashboard?tenant=premium-resort-pro');
  71 |     
  72 |     // Quick smoke assert we see analytics cards (assuming 'Total Revenue' is a heading inside a card)
  73 |     await expect(page.getByText('Total Revenue')).toBeVisible();
  74 |     await expect(page.getByText('Active Bookings')).toBeVisible();
  75 |   });
  76 | });
  77 | 
```