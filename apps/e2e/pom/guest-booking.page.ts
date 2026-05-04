import { Page, Locator, expect } from '@playwright/test';

export class GuestBookingPage {
  readonly page: Page;
  
  // Checkout Page - Step 1: Search
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly searchAvailabilityBtn: Locator;
  readonly roomTypeSelect: Locator;

  // Checkout Page - Step 2: Guest Details
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly stateSelect: Locator;
  readonly confirmReservationBtn: Locator;

  // Checkout Page - Step 3: Success
  readonly bookingConfirmationHeading: Locator;

  // "Proceed to Guest Details" button (in order summary sidebar)
  readonly proceedToGuestDetailsBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1 — on /book page directly
    this.checkInInput = page.locator('input[type="date"]').first();
    this.checkOutInput = page.locator('input[type="date"]').nth(1);
    this.roomTypeSelect = page.locator('select').last();
    this.searchAvailabilityBtn = page.getByRole('button', { name: 'Check Availability' });
    this.proceedToGuestDetailsBtn = page.getByRole('button', { name: 'Proceed to Guest Details' });

    // Step 2
    this.fullNameInput = page.locator('input[type="text"]').first();
    this.emailInput = page.locator('input[type="email"]');
    this.phoneInput = page.locator('input[type="tel"]');
    this.stateSelect = page.locator('select').filter({ hasText: 'Select your state' });
    this.confirmReservationBtn = page.getByRole('button', { name: /Confirm Reservation|Reserve/ });

    // Step 3
    this.bookingConfirmationHeading = page.getByText(/Booking Confirmed!|Reservation Confirmed!/);
  }

  /** Navigate directly to the /book page for a given property slug */
  async gotoBookPage(slug: string, checkIn: string, checkOut: string, guests: string = '2') {
    const params = new URLSearchParams({ checkIn, checkOut, guests, rooms: '1' });
    await this.page.goto(`http://localhost:3100/en/${slug}/book?${params.toString()}`, { timeout: 90000 });
  }

  /** Legacy: navigate to property landing and use the widget (kept for backwards compat) */
  async gotoPublicProperty(slug: string) {
    await this.page.goto(`http://localhost:3100/en/${slug}`, { timeout: 90000 });
  }

  /** Navigate from the property landing widget to the /book page */
  async fillPublicWidgetAndSearch(checkIn: string, checkOut: string, guests: string = '2') {
    // The modern widget doesn't have <select> for guests.
    // Click "Check Availability" button or "Book Now" link to navigate to /book
    const bookNowLink = this.page.getByRole('link', { name: 'Book Now' }).first();
    await expect(bookNowLink).toBeVisible({ timeout: 15000 });
    await bookNowLink.click();
    await this.page.waitForURL(/.*\/book.*/, { timeout: 15000 });
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
    await expect(this.proceedToGuestDetailsBtn).toBeVisible({ timeout: 10000 });
    await this.proceedToGuestDetailsBtn.click();
  }

  async fillGuestDetailsAndConfirm(name: string, email: string, phone: string, state: string) {
    await expect(this.fullNameInput).toBeVisible({ timeout: 10000 });
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
    await expect(this.bookingConfirmationHeading).toBeVisible({ timeout: 15000 });
  }

  /** Set dates on the /book page */
  async setDates(checkIn: string, checkOut: string) {
    await this.checkInInput.fill(checkIn);
    await this.checkOutInput.fill(checkOut);
  }

  /** Click the "Book Now" link from the property landing to navigate to /book */
  async clickBookNow() {
    const bookNowLink = this.page.getByRole('link', { name: 'Book Now' }).first();
    await expect(bookNowLink).toBeVisible({ timeout: 15000 });
    await bookNowLink.click();
    await this.page.waitForURL(/.*\/book.*/, { timeout: 15000 });
  }
}

