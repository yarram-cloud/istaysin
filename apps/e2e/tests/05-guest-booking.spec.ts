import { test, expect } from '@playwright/test';
import { GuestBookingPage } from '../pom/guest-booking.page';

test.describe('Public Guest Booking Flow', () => {
  let bookingPage: GuestBookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new GuestBookingPage(page);
  });

  test('Guest can search availability and confirm a reservation', async ({ page }) => {
    const propertySlug = 'premium-resort-pro';

    // Set dates to tomorrow and day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const checkIn = tomorrow.toISOString().split('T')[0];
    const checkOut = dayAfter.toISOString().split('T')[0];

    // 1. Navigate directly to the /book page with date params
    await bookingPage.gotoBookPage(propertySlug, checkIn, checkOut);

    // 2. Check Availability - click button and wait for API response
    await bookingPage.checkAvailability();

    // 3. Wait for the pricing summary to render in the sidebar
    //    The "Proceed to Guest Details" button only appears after pricing data loads
    await bookingPage.proceedToGuestDetails();

    // 4. Fill Guest Details & Confirm
    const randomPhone = String(9000000000 + Math.floor(Math.random() * 999999999));
    await bookingPage.fillGuestDetailsAndConfirm(
      'Test Guest',
      `test-${Date.now()}@example.com`,
      randomPhone,
      'Maharashtra'
    );

    // 5. Assert Success
    await bookingPage.assertConfirmationSuccess();
  });
});
