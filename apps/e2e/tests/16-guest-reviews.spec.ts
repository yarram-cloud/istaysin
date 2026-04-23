import { test, expect } from '@playwright/test';

test.describe('Public Guest Review Injection', () => {
  let tenantId: string;
  let adminToken: string;

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
  });

  test('Guest can review booking and it auto-publishes to the widget overview', async ({ request, page }) => {
    // 1. Generate a target booking to review
    // A booking must explicitly match the email!
    const roomTypeId = (await (await request.get(`/api/v1/public/properties/premium-resort-pro`)).json()).data.roomTypes[0].id;
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Seed booking
    const bkgRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'Review Tester',
        guestEmail: 'review@e2e.rocks',
        guestPhone: '5552229999',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId }]
      }
    });

    const bookingData = await bkgRes.json();
    const bookingNumber = bookingData.data.bookingNumber;

    // 2. Mock the Public Guest publishing a solid 5-star Review
    const reviewPayload = {
      bookingNumber,
      email: 'review@e2e.rocks', // MUST explicitly match
      rating: 5,
      text: 'Absolutely astonishing E2E functionality. Clean beds, fast APIs.'
    };

    const reviewRes = await request.post('/api/v1/public/reviews', {
      data: reviewPayload
    });
    
    const reviewResponseData = await reviewRes.json();
    expect(reviewResponseData.success).toBeTruthy();
    expect(reviewResponseData.data.rating).toBe(5);

    // 3. Prevent duplicate scraping natively
    const dupRes = await request.post('/api/v1/public/reviews', {
      data: reviewPayload
    });
    expect(dupRes.status()).toBe(400); // Bad Request (Already submitted)

    // 4. Validate that the single property payload now pulls this review natively
    const propTest = await request.get('/api/v1/public/properties/premium-resort-pro');
    const propDetails = await propTest.json();

    // The review should be aggregated in `propDetails.data.reviews`
    const importedReviews = propDetails.data.reviews;
    const foundReview = importedReviews.find((r: any) => r.text.includes('astonishing E2E functionality'));
    
    expect(foundReview).toBeDefined();
    expect(foundReview.rating).toBe(5);
  });
});
