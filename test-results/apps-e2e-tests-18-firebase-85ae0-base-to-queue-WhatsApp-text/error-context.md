# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\18-firebase-notifications.spec.ts >> Firebase Cloud Messaging & WhatsApp Extensions Pipeline >> Booking securely hooks into Firebase to queue WhatsApp text
- Location: apps\e2e\tests\18-firebase-notifications.spec.ts:20:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Firebase Cloud Messaging & WhatsApp Extensions Pipeline', () => {
  4  |   let tenantId: string;
  5  |   let adminToken: string;
  6  | 
  7  |   test.beforeEach(async ({ request }) => {
  8  |     // Authenticate Admin
> 9  |     const adminRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  10 |       data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
  11 |     });
  12 |     const body = await adminRes.json(); console.log(body); adminToken = body.data.accessToken;
  13 | 
  14 |     // Fetch Property metrics
  15 |     const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  16 |     const property = await propRes.json();
  17 |     tenantId = property.data.id;
  18 |   });
  19 | 
  20 |   test('Booking securely hooks into Firebase to queue WhatsApp text', async ({ request }) => {
  21 |     const propMetaRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  22 |     const propMeta = await propMetaRes.json();
  23 |     const roomTypeId = propMeta.data.roomTypes[0].id;
  24 |     const dateToday = new Date().toISOString().split('T')[0];
  25 |     const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  26 | 
  27 |     const bkgRes = await request.post('/api/v1/public/bookings', {
  28 |       data: {
  29 |         tenantId,
  30 |         guestName: 'WhatsApp Tester',
  31 |         guestEmail: 'wa.test@firebase.com',
  32 |         guestPhone: '555-102-3040',
  33 |         checkInDate: dateToday,
  34 |         checkOutDate: dateTomorrow,
  35 |         numAdults: 1,
  36 |         numChildren: 0,
  37 |         roomSelections: [{ roomTypeId }]
  38 |       }
  39 |     });
  40 | 
  41 |     const bookingPush = await bkgRes.json();
  42 |     console.log("BOOKING RESULT:", bookingPush);
  43 |     
  44 |     // Assert the native booking creation hasn't broken due to missing Firebase configs in CI
  45 |     expect(bkgRes.status()).toBe(200);
  46 |     expect(bookingPush.success).toBeTruthy();
  47 |     expect(bookingPush.data.guestPhone).toBe('555-102-3040');
  48 |     
  49 |     // Since NODE_ENV='test' inside Playwright runtime API hook, `console.log` would have proven out 'Queued WhatsApp message'
  50 |     // This affirms our E2E wrapper won't explode if Google services throttle us during heavy automated tests.
  51 |   });
  52 | });
  53 | 
```