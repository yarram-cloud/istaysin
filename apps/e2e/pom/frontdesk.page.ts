import { Page, Locator, expect } from '@playwright/test';

export class FrontdeskPage {
  readonly page: Page;

  // Bookings Datatable
  readonly bookingsTab: Locator;
  readonly searchBookingInput: Locator;

  // Check-In (now inline)
  readonly checkInContainer: Locator;
  readonly idProofTypeSelect: Locator;
  readonly idProofNumberInput: Locator;
  readonly arrivingFromInput: Locator;
  readonly goingToInput: Locator;
  readonly purposeOfVisitSelect: Locator;
  readonly completeCheckInBtn: Locator;

  // Check-Out (now inline)
  readonly checkOutContainer: Locator;
  readonly balanceDueInput: Locator;
  readonly paymentCardRadio: Locator;
  readonly completeCheckOutBtn: Locator;
  readonly checkoutSuccessHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Datatable
    this.bookingsTab = page.getByRole('link', { name: 'Bookings' }).first();
    this.searchBookingInput = page.getByPlaceholder('Search bookings...');

    // Inline Sections
    this.checkInContainer = page.locator('div', { hasText: 'Fast-Track Check-In' }).last();
    this.checkOutContainer = page.locator('div', { hasText: 'Complete Check-Out' }).last();

    // Check-in Step Buttons
    this.completeCheckInBtn = page.getByRole('button', { name: 'Complete Check-In' });

    // Check-in Inputs
    this.idProofTypeSelect = this.checkInContainer.locator('select').first();
    this.idProofNumberInput = this.checkInContainer.locator('input[placeholder="Enter number"]');
    this.arrivingFromInput = this.checkInContainer.getByPlaceholder('City / Country').first();
    this.goingToInput = this.checkInContainer.getByPlaceholder('City / Country').nth(1);
    this.purposeOfVisitSelect = this.checkInContainer.locator('select').last();

    // Check-out Inputs
    this.balanceDueInput = page.getByPlaceholder('Balance Due');
    this.paymentCardRadio = page.getByText('Card', { exact: true });
    this.completeCheckOutBtn = page.getByRole('button', { name: 'Check Out' });
    this.checkoutSuccessHeading = page.getByRole('heading', { name: 'Successfully Checked Out' });
  }

  async gotoBookings(slug: string) {
    await this.page.goto(`http://localhost:3100/dashboard/bookings?tenant=${slug}`);
  }

  async openBookingDetails(bookingNumber: string) {
    // We assume the first booking card handles it or we search it
    // If it's a datatable row:
    const row = this.page.locator('tr').filter({ hasText: bookingNumber }).first();
    await expect(row).toBeVisible();
    await row.click(); // Click the data table row to view details
  }

  async completeConfirmation() {
    const btn = this.page.getByRole('button', { name: 'Confirm Booking' });
    await expect(btn).toBeVisible();
    await btn.click();
    // Wait for the button to be swapped out / modal to close upon success
    await expect(btn).not.toBeVisible();
  }

  // --- Check-In Flow ---
  async performCheckIn(idProof: string, arrivingFrom: string, goingTo: string) {
    await expect(this.checkInContainer).toBeVisible();

    // The inline check-in removes the split "room assignment" and "form-B" steps, merging them.
    // However, the test expected room Assignment Input which no longer exists as a separate input inside CheckIn because
    // room assignment is done in the Room Cards section of the Booking Detail! 
    // BUT the prompt just asks to complete Check-In. We will just fill the form now.

    // Select Aadhaar
    await this.idProofTypeSelect.selectOption('aadhaar');
    await this.idProofNumberInput.fill(idProof);
    await this.arrivingFromInput.fill(arrivingFrom);
    await this.goingToInput.fill(goingTo);

    // Confirm
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/v1/check-in-out') && response.status() === 200
    );
    await this.completeCheckInBtn.click();
    await responsePromise;
  }

  // --- Check-Out Flow ---
  async performCheckOut(balance: number) {
    await expect(this.checkOutContainer).toBeVisible();

    await this.balanceDueInput.fill(balance.toString());
    await this.paymentCardRadio.click();

    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/v1/check-in-out') && response.status() === 200
    );
    await this.completeCheckOutBtn.click();
    await responsePromise;
  }
}
