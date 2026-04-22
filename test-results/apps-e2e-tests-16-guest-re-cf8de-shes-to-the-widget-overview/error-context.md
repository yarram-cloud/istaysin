# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\16-guest-reviews.spec.ts >> Public Guest Review Injection >> Guest can review booking and it auto-publishes to the widget overview
- Location: apps\e2e\tests\16-guest-reviews.spec.ts:20:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Public Guest Review Injection', () => {
  4  |   let tenantId: string;
  5  |   let adminToken: string;
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
  18 |   });
  19 | 
  20 |   test('Guest can review booking and it auto-publishes to the widget overview', async ({ request, page }) => {
  21 |     // 1. Generate a target booking to review
  22 |     // A booking must explicitly match the email!
  23 |     const roomTypeId = (await (await request.get(`/api/v1/public/properties/premium-resort-pro`)).json()).data.roomTypes[0].id;
  24 |     const dateToday = new Date().toISOString().split('T')[0];
  25 |     const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  26 | 
  27 |     // Seed booking
  28 |     const bkgRes = await request.post('/api/v1/public/bookings', {
  29 |       data: {
  30 |         tenantId,
  31 |         guestName: 'Review Tester',
  32 |         guestEmail: 'review@e2e.rocks',
  33 |         guestPhone: '5552229999',
  34 |         checkInDate: dateToday,
  35 |         checkOutDate: dateTomorrow,
  36 |         numAdults: 1,
  37 |         numChildren: 0,
  38 |         roomSelections: [{ roomTypeId }]
  39 |       }
  40 |     });
  41 | 
  42 |     const bookingData = await bkgRes.json();
  43 |     const bookingNumber = bookingData.data.bookingNumber;
  44 | 
  45 |     // 2. Mock the Public Guest publishing a solid 5-star Review
  46 |     const reviewPayload = {
  47 |       bookingNumber,
  48 |       email: 'review@e2e.rocks', // MUST explicitly match
  49 |       rating: 5,
  50 |       text: 'Absolutely astonishing E2E functionality. Clean beds, fast APIs.'
  51 |     };
  52 | 
  53 |     const reviewRes = await request.post('/api/v1/public/reviews', {
  54 |       data: reviewPayload
  55 |     });
  56 |     
  57 |     const reviewResponseData = await reviewRes.json();
  58 |     expect(reviewResponseData.success).toBeTruthy();
  59 |     expect(reviewResponseData.data.rating).toBe(5);
  60 | 
  61 |     // 3. Prevent duplicate scraping natively
  62 |     const dupRes = await request.post('/api/v1/public/reviews', {
  63 |       data: reviewPayload
  64 |     });
  65 |     expect(dupRes.status()).toBe(400); // Bad Request (Already submitted)
  66 | 
  67 |     // 4. Validate that the single property payload now pulls this review natively
  68 |     const propTest = await request.get('/api/v1/public/properties/premium-resort-pro');
  69 |     const propDetails = await propTest.json();
  70 | 
  71 |     // The review should be aggregated in `propDetails.data.reviews`
  72 |     const importedReviews = propDetails.data.reviews;
  73 |     const foundReview = importedReviews.find((r: any) => r.text.includes('astonishing E2E functionality'));
  74 |     
  75 |     expect(foundReview).toBeDefined();
  76 |     expect(foundReview.rating).toBe(5);
  77 |   });
  78 | });
  79 | 
```