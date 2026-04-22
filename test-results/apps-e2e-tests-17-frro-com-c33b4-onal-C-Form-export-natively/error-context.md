# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\17-frro-compliance.spec.ts >> Form-C & FRRO Export Compliance >> Generates Foreign National C-Form export natively
- Location: apps\e2e\tests\17-frro-compliance.spec.ts:27:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Form-C & FRRO Export Compliance', () => {
  4  |   let adminToken: string;
  5  |   let tenantId: string;
  6  |   let bookingId: string;
  7  | 
  8  |   test.beforeEach(async ({ request }) => {
  9  |     // Authenticate Admin
> 10 |     const adminRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  11 |       data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
  12 |     });
  13 |     adminToken = (await adminRes.json()).data.accessToken;
  14 | 
  15 |     // Fetch Property metrics
  16 |     const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
  17 |     const property = await propRes.json();
  18 |     tenantId = property.data.id;
  19 |     
  20 |     // Switch tenant context
  21 |     await request.post('/api/v1/tenants/switch', {
  22 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  23 |       data: { tenantId }
  24 |     });
  25 |   });
  26 | 
  27 |   test('Generates Foreign National C-Form export natively', async ({ request }) => {
  28 |     const roomTypeId = (await (await request.get(`/api/v1/public/properties/premium-resort-pro`)).json()).data.roomTypes[0].id;
  29 |     const dateToday = new Date().toISOString().split('T')[0];
  30 |     const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  31 | 
  32 |     // 1. Create a Booking
  33 |     const bkgRes = await request.post('/api/v1/public/bookings', {
  34 |       data: {
  35 |         tenantId,
  36 |         guestName: 'John Doe',
  37 |         guestEmail: 'john.foreign@frro.com',
  38 |         guestPhone: '5552227777',
  39 |         checkInDate: dateToday,
  40 |         checkOutDate: dateTomorrow,
  41 |         numAdults: 1,
  42 |         numChildren: 0,
  43 |         roomSelections: [{ roomTypeId }]
  44 |       }
  45 |     });
  46 |     const booking = await bkgRes.json();
  47 |     bookingId = booking.data.id;
  48 | 
  49 |     // 2. FrontDesk updates the BookingGuest logic to show them as a Foreign National (USA)
  50 |     // Finding the auto-generated BookingGuest from the booking creation.
  51 |     const bookingDetails = await request.get(`/api/v1/bookings/${bookingId}`, {
  52 |       headers: { 'Authorization': `Bearer ${adminToken}` }
  53 |     });
  54 |     const detailsData = await bookingDetails.json();
  55 |     console.log(JSON.stringify(detailsData, null, 2)); const bookingGuestId = detailsData.data.bookingGuests[0]?.id;
  56 | 
  57 |     // Add guest as a foreign national
  58 |     const guestPost = await request.post(`/api/v1/bookings/${bookingId}/guests`, {
  59 |       headers: { 'Authorization': `Bearer ${adminToken}` },
  60 |       data: {
  61 |         fullName: 'John Doe',
  62 |         nationality: 'American',
  63 |         idProofNumber: 'US-PASS-998877',
  64 |         visaNumber: 'V-112233',
  65 |         visaExpiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
  66 |         purposeOfVisit: 'Tourism',
  67 |         arrivingFrom: 'New York',
  68 |         goingTo: 'Tokyo'
  69 |       }
  70 |     });
  71 |     console.log("POST GUEST STATUS:", guestPost.status(), await guestPost.json());
  72 | 
  73 |     // 3. Fetch the FRRO Compliance Export
  74 |     const frroRes = await request.get('/api/v1/compliance/c-form/export?hours=24', {
  75 |       headers: { 'Authorization': `Bearer ${adminToken}` }
  76 |     });
  77 |     
  78 |     expect(frroRes.status()).toBe(200);
  79 |     const frroData = await frroRes.json();
  80 |     
  81 |     // Assert 
  82 |     expect(frroData.success).toBeTruthy();
  83 |     expect(Array.isArray(frroData.data)).toBe(true);
  84 | 
  85 |     // Verify our American guest is caught by the 24 hour net
  86 |     const caughtGuest = frroData.data.find((g: any) => g.PassportNumber === 'US-PASS-998877');
  87 |     expect(caughtGuest).toBeDefined();
  88 |     expect(caughtGuest.Nationality).toBe('American');
  89 |     expect(caughtGuest.VisaNumber).toBe('V-112233');
  90 |     expect(caughtGuest.PurposeOfVisit).toBe('Tourism');
  91 | 
  92 |     // NOTE: If we made an Indian guest, they would NOT be in this export.
  93 |     // Cleanup is omitted for simplicity as tenant isolation handles safety.
  94 |   });
  95 | });
  96 | 
```