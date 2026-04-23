import { test, expect } from '@playwright/test';
import { LoginPage } from '../pom/login.page';
import { FrontdeskPage } from '../pom/frontdesk.page';

test.describe('Front Desk Operations', () => {
  let loginPage: LoginPage;
  let frontdeskPage: FrontdeskPage;
  let testBookingId: string;
  let testBookingNumber: string;

  test.beforeEach(async ({ page, request }) => {
    loginPage = new LoginPage(page);
    frontdeskPage = new FrontdeskPage(page);

    // Context: Use 'premium-resort-pro' configured in global-setup
    // Login as Admin
    await loginPage.goto();
    await loginPage.login('desk-premium@e2e.com', 'Welcome@1');

    // Mock a confirmed booking programmatically to test checkin/checkout flow
    // We assume 'premium-resort-pro' has at least 1 room type from setup
    
    // Fetch property to get roomType
    const propRes = await request.get('/api/v1/public/properties/premium-resort-pro');
    const property = await propRes.json();
    const roomTypeId = property.data.roomTypes[0].id;

    // Create a Booking
    const dateToday = new Date().toISOString().split('T')[0];
    const dateTomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    
    const bookingRes = await request.post('/api/v1/public/bookings', {
      data: {
        tenantId: property.data.id,
        guestName: 'E2E Frontdesk Guest',
        guestPhone: '5551234567',
        checkInDate: dateToday,
        checkOutDate: dateTomorrow,
        numAdults: 2,
        numChildren: 0,
        roomSelections: [
          { roomTypeId }
        ]
      }
    });

    const bookingData = await bookingRes.json();
    testBookingId = bookingData.data.id;
    testBookingNumber = bookingData.data.bookingNumber;

    // Room assignment and status confirmation will happen in the UI later
  });

  test('Fast-Track Form-B Check-in and Checkout settlement', async () => {
    // 1. Traverse to Bookings Dashboard
    await frontdeskPage.gotoBookings('premium-resort-pro');

    // 2. Open our programmatic booking
    await frontdeskPage.openBookingDetails(testBookingNumber);
    await frontdeskPage.completeConfirmation();
    
    // 2.5 Re-open the booking details (as confirming clears the active selection sheet)
    await frontdeskPage.openBookingDetails(testBookingNumber);

    // 3. Perform Check-In
    await frontdeskPage.performCheckIn(
      '123412341234', // Aadhaar Num
      'Mumbai, India', // Arriving From
      'Delhi, India'   // Going To
    );

    // Verify UI Status updated to 'Checked In' in the datatable
    await expect(frontdeskPage.page.locator('tr', { hasText: testBookingNumber }).locator('td', { hasText: 'Checked In' })).toBeVisible();

    // Re-open booking details for checkout as check-in might close the slide-over
    await frontdeskPage.openBookingDetails(testBookingNumber);

    // 4. Perform Check-Out and settle folios
    await frontdeskPage.performCheckOut(500); // Random settlement balance amount

    // Verify Final Status Transition in Datatable
    await expect(frontdeskPage.page.locator('tr', { hasText: testBookingNumber }).locator('td', { hasText: 'Checked Out' })).toBeVisible();
  });

  test('Security: Prevents Mass Assignment on Guest Update', async ({ request }) => {
    // 1. Create a guest on the booking
    const addGuestRes = await request.post(`/api/v1/bookings/${testBookingId}/guests`, {
      data: {
        fullName: 'Test Guest',
        nationality: 'Indian',
      }
    });
    const addGuestData = await addGuestRes.json();
    const guestId = addGuestData.data.id;

    // 2. Attempt a malicious update targeting protected DB fields
    const maliciousTenantId = 'hacker-tenant-999';
    const maliciousBookingId = 'hacker-booking-888';
    
    const updateRes = await request.put(`/api/v1/bookings/${testBookingId}/guests/${guestId}`, {
      data: {
        fullName: 'Secured Guest',
        tenantId: maliciousTenantId,
        bookingId: maliciousBookingId,
        cFormSubmitted: true,
      }
    });

    const updateData = await updateRes.json();
    
    // Zod .safeParse() implicitly strips extra schema fields when passing to Prisma
    expect(updateData.success).toBe(true);

    // Verify protected fields were completely ignored by reading the response object
    // (Pertaining to Prisma returning the updated record from the DB)
    expect(updateData.data.tenantId).not.toBe(maliciousTenantId);
    expect(updateData.data.bookingId).not.toBe(maliciousBookingId);
    expect(updateData.data.cFormSubmitted).toBe(false); // cFormSubmitted was not in our Zod schema
    
    // Ensure the legitimate field WAS updated
    expect(updateData.data.fullName).toBe('Secured Guest');
  });
});
