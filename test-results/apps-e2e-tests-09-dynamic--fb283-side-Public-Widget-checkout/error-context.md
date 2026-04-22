# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\09-dynamic-pricing.spec.ts >> Dynamic Pricing Automation Workflow >> Pricing Rule dictates +50% hike rendering correctly inside Public Widget checkout
- Location: apps\e2e\tests\09-dynamic-pricing.spec.ts:34:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GuestBookingPage } from '../pom/guest-booking.page';
  3  | 
  4  | test.describe('Dynamic Pricing Automation Workflow', () => {
  5  |   let guestBookingPage: GuestBookingPage;
  6  |   let adminToken: string;
  7  |   let tenantId: string;
  8  |   let roomTypeId: string;
  9  |   let baseRate: number;
  10 | 
  11 |   test.beforeEach(async ({ page, request }) => {
  12 |     guestBookingPage = new GuestBookingPage(page);
  13 | 
  14 |     // 1. Authenticate as Admin to inject UI Rules
> 15 |     const loginRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  16 |       data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
  17 |     });
  18 |     const loginData = await loginRes.json();
  19 |     adminToken = loginData.data.accessToken;
  20 |     
  21 |     // Fetch Property metadata 
  22 |     const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  23 |     const property = await propRes.json();
  24 |     tenantId = property.data.id;
  25 |     roomTypeId = property.data.roomTypes[0].id;
  26 |     baseRate = property.data.roomTypes[0].baseRate; // Let's say 4000
  27 |     
  28 |     await request.post('/api/v1/tenants/switch', {
  29 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  30 |       data: { tenantId }
  31 |     });
  32 |   });
  33 | 
  34 |   test('Pricing Rule dictates +50% hike rendering correctly inside Public Widget checkout', async ({ page, request }) => {
  35 |     // 1. Create a huge Flat Rate hike (e.g. + 5000 INR) applying generally across all days 
  36 |     // to easily assert via Widget 
  37 |     await request.post('/api/v1/pricing', {
  38 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  39 |       data: {
  40 |         name: 'E2E Mega Event Hike',
  41 |         adjustmentType: 'flat_increase',
  42 |         adjustmentValue: 5000, 
  43 |         daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All Days
  44 |         roomTypeId: roomTypeId,
  45 |         priority: 100, // Top priority override
  46 |         isActive: true
  47 |       }
  48 |     });
  49 | 
  50 |     // 2. Load the Consumer Booking UI 
  51 |     await guestBookingPage.gotoPublicProperty('premium-resort-pro');
  52 | 
  53 |     // 3. Set standard defaults tomorrow and day after
  54 |     const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  55 |     const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  56 |     await guestBookingPage.setDates(tomorrow, dayAfter);
  57 | 
  58 |     // 4. Click Book Now widget to load /book
  59 |     await guestBookingPage.clickBookNow();
  60 | 
  61 |     // 5. Select the exact Room type
  62 |     // Since pricing returned should trigger the price to be baseRate + 5000
  63 |     const expectedRate = baseRate + 5000;
  64 |     
  65 |     // Check if the checkout UI rendered the inflated price
  66 |     const displayedPrice = await page.locator('.room-card-price').first().innerText();
  67 |     // E.g. "₹9000 / night"
  68 |     expect(displayedPrice.replace(/[^0-9]/g, '')).toContain(expectedRate.toString());
  69 | 
  70 |     // Clean up Pricing Rule to avoid poisoning future tests
  71 |     const rulesRes = await request.get('/api/v1/pricing', {
  72 |          headers: { 'Authorization': `Bearer ${adminToken}` }
  73 |     });
  74 |     const rules = await rulesRes.json();
  75 |     const targetRule = rules.data.find((r: any) => r.name === 'E2E Mega Event Hike');
  76 |     if (targetRule) {
  77 |       await request.delete(`/api/v1/pricing/${targetRule.id}`, {
  78 |          headers: { 'Authorization': `Bearer ${adminToken}` }
  79 |       });
  80 |     }
  81 |   });
  82 | });
  83 | 
```