import { test } from '@playwright/test';
import { GuestBookingPage } from '../pom/guest-booking.page';

test.describe('Public Guest Booking Flow', () => {
  let bookingPage: GuestBookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new GuestBookingPage(page);
  });

  test('Guest can search availability and confirm a reservation', async () => {
    const propertySlug = 'premium-resort-pro';

    // 1. Visit Property Landing Page & Use Widget
    await bookingPage.gotoPublicProperty(propertySlug);
    
    // Set dates to tomorrow and day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    await bookingPage.fillPublicWidgetAndSearch(
      tomorrow.toISOString().split('T')[0],
      dayAfter.toISOString().split('T')[0],
      '2'
    );

    // 2. Check Availability
    await bookingPage.checkAvailability();

    // 3. Select Room & Proceed
    await bookingPage.roomTypeSelect.selectOption({ index: 0 }); // Pick first available room
    await bookingPage.proceedToGuestDetails();

    // 4. Fill Guest Details & Confirm
    await bookingPage.fillGuestDetailsAndConfirm(
      'Test Guest',
      'test@example.com',
      '9876543210',
      'Maharashtra'
    );

    // 5. Assert Success
    await bookingPage.assertConfirmationSuccess();
  });
});
