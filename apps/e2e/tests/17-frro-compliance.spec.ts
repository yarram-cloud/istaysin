import { test, expect } from '@playwright/test';

test.describe('Form-C & FRRO Export Compliance', () => {
  let adminToken: string;
  let tenantId: string;
  let bookingId: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate Admin
    const adminRes = await request.post('/api/v1/auth/login', {
      data: { email: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    adminToken = (await adminRes.json()).data.accessToken;

    // Fetch Property metrics
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    tenantId = property.data.id;
    
    // Switch tenant context
    await request.post('/api/v1/tenants/switch', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: { tenantId }
    });
  });

  test('Generates Foreign National C-Form export natively', async ({ request }) => {
    const roomTypeId = (await (await request.get(`/api/v1/public/properties/premium-resort-pro`)).json()).data.roomTypes[0].id;
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // 1. Create a Booking
    const bkgRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId,
        guestName: 'John Doe',
        guestEmail: 'john.foreign@frro.com',
        guestPhone: '5552227777',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 1,
        numChildren: 0,
        roomSelections: [{ roomTypeId }]
      }
    });
    const booking = await bkgRes.json();
    bookingId = booking.data.id;

    // 2. FrontDesk updates the BookingGuest logic to show them as a Foreign National (USA)
    // Finding the auto-generated BookingGuest from the booking creation.
    const bookingDetails = await request.get(`/api/v1/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const detailsData = await bookingDetails.json();
    console.log(JSON.stringify(detailsData, null, 2)); const bookingGuestId = detailsData.data.bookingGuests[0]?.id;

    // Add guest as a foreign national
    const guestPost = await request.post(`/api/v1/bookings/${bookingId}/guests`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        fullName: 'John Doe',
        nationality: 'American',
        idProofNumber: 'US-PASS-998877',
        visaNumber: 'V-112233',
        visaExpiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        purposeOfVisit: 'Tourism',
        arrivingFrom: 'New York',
        goingTo: 'Tokyo'
      }
    });
    console.log("POST GUEST STATUS:", guestPost.status(), await guestPost.json());

    // 3. Fetch the FRRO Compliance Export
    const frroRes = await request.get('/api/v1/compliance/c-form/export?hours=24', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    expect(frroRes.status()).toBe(200);
    const frroData = await frroRes.json();
    
    // Assert 
    expect(frroData.success).toBeTruthy();
    expect(Array.isArray(frroData.data)).toBe(true);

    // Verify our American guest is caught by the 24 hour net
    const caughtGuest = frroData.data.find((g: any) => g.PassportNumber === 'US-PASS-998877');
    expect(caughtGuest).toBeDefined();
    expect(caughtGuest.Nationality).toBe('American');
    expect(caughtGuest.VisaNumber).toBe('V-112233');
    expect(caughtGuest.PurposeOfVisit).toBe('Tourism');

    // NOTE: If we made an Indian guest, they would NOT be in this export.
    // Cleanup is omitted for simplicity as tenant isolation handles safety.
  });
});
