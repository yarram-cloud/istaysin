import { Page, Locator, expect } from '@playwright/test';

export class GuestBookingPage {
  readonly page: Page;
  
  // Public Landing / Widget
  readonly publicWidgetCheckIn: Locator;
  readonly publicWidgetCheckOut: Locator;
  readonly publicWidgetGuests: Locator;
  readonly publicWidgetSearchBtn: Locator;

  // Checkout Page - Step 1: Search
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly searchAvailabilityBtn: Locator;
  readonly roomTypeSelect: Locator;
  readonly proceedToGuestDetailsBtn: Locator;

  // Checkout Page - Step 2: Guest Details
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly stateSelect: Locator;
  readonly confirmReservationBtn: Locator;

  // Checkout Page - Step 3: Success
  readonly bookingConfirmationHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Public Widget
    this.publicWidgetCheckIn = page.locator('input[type="date"]').first();
    this.publicWidgetCheckOut = page.locator('input[type="date"]').nth(1);
    this.publicWidgetGuests = page.locator('select').first();
    this.publicWidgetSearchBtn = page.getByRole('button', { name: 'Check Availability', exact: false });

    // Step 1
    this.checkInInput = page.locator('input[type="date"]').first(); // On /book
    this.checkOutInput = page.locator('input[type="date"]').nth(1);
    this.roomTypeSelect = page.locator('select').last();
    this.searchAvailabilityBtn = page.getByRole('button', { name: 'Check Availability' });
    this.proceedToGuestDetailsBtn = page.getByRole('button', { name: 'Proceed to Guest Details' });

    // Step 2
    this.fullNameInput = page.locator('input[type="text"]').first();
    this.emailInput = page.locator('input[type="email"]');
    this.phoneInput = page.locator('input[type="tel"]');
    this.stateSelect = page.locator('select').filter({ hasText: 'Select State' });
    this.confirmReservationBtn = page.getByRole('button', { name: 'Confirm Reservation' });

    // Step 3
    this.bookingConfirmationHeading = page.getByText('You\'re All Set!');
  }

  async gotoPublicProperty(slug: string) {
    await this.page.goto(`http://localhost:3100/en/${slug}`, { timeout: 90000 });
  }

  async fillPublicWidgetAndSearch(checkIn: string, checkOut: string, guests: string = '2') {
    await expect(this.publicWidgetCheckIn).toBeVisible();
    await this.publicWidgetCheckIn.fill(checkIn);
    await this.publicWidgetCheckOut.fill(checkOut);
    await this.publicWidgetGuests.selectOption(guests);
    await this.publicWidgetSearchBtn.click();
    await this.page.waitForURL(/.*\/book\?.*/);
  }

  async checkAvailability() {
    await expect(this.searchAvailabilityBtn).toBeVisible();
    // Wait for API response
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/v1/public/check-availability') && response.status() === 200
    );
    await this.searchAvailabilityBtn.click();
    await responsePromise;
  }

  async proceedToGuestDetails() {
    await expect(this.proceedToGuestDetailsBtn).toBeVisible();
    await this.proceedToGuestDetailsBtn.click();
  }

  async fillGuestDetailsAndConfirm(name: string, email: string, phone: string, state: string) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
    await this.stateSelect.selectOption(state);
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/v1/public/bookings')
    );
    await this.confirmReservationBtn.click();
    const response = await responsePromise;
    if (response.status() !== 200) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Booking API Failed with status ${response.status()}: ${JSON.stringify(errorBody)}`);
    }
    expect(response.status()).toBe(200);
  }

  async assertConfirmationSuccess() {
    await expect(this.bookingConfirmationHeading).toBeVisible();
  }
}
