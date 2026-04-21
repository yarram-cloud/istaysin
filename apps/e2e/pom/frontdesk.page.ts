import { Page, Locator, expect } from '@playwright/test';

export class FrontdeskPage {
  readonly page: Page;

  // Bookings Datatable
  readonly bookingsTab: Locator;
  readonly searchBookingInput: Locator;

  // Check-In Modal 
  readonly fastTrackCheckInBtn: Locator;
  readonly checkInModal: Locator;
  readonly roomAssignmentInput: Locator;
  readonly checkInContinueBtn: Locator;
  readonly idProofTypeSelect: Locator;
  readonly idProofNumberInput: Locator;
  readonly arrivingFromInput: Locator;
  readonly goingToInput: Locator;
  readonly purposeOfVisitSelect: Locator;
  readonly completeCheckInBtn: Locator;

  // Check-Out Modal
  readonly checkoutBtn: Locator;
  readonly checkOutModal: Locator;
  readonly balanceDueInput: Locator;
  readonly paymentCardRadio: Locator;
  readonly completeCheckOutBtn: Locator;
  readonly checkoutSuccessHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Datatable
    this.bookingsTab = page.getByRole('link', { name: 'Bookings' }).first();
    this.searchBookingInput = page.getByPlaceholder('Search bookings...');

    // Modals Base
    this.checkInModal = page.locator('.fixed.inset-0', { hasText: 'Fast-Track Check-In' });
    this.checkOutModal = page.locator('.fixed.inset-0', { hasText: 'Complete Check-Out' });

    // Check-in Step Buttons
    this.fastTrackCheckInBtn = page.getByRole('button', { name: 'Fast-Track Check-In' });
    this.checkInContinueBtn = page.getByRole('button', { name: 'Continue' });
    this.completeCheckInBtn = page.getByRole('button', { name: 'Complete Check-In' });

    // Check-in Inputs
    this.roomAssignmentInput = this.checkInModal.getByPlaceholder('Room ID/Number');
    this.idProofTypeSelect = this.checkInModal.locator('select').first();
    this.idProofNumberInput = this.checkInModal.locator('input[type="text"]').nth(2); // After Full Name and Nationality
    this.arrivingFromInput = this.checkInModal.getByPlaceholder('City/Country').first();
    this.goingToInput = this.checkInModal.getByPlaceholder('City/Country').nth(1);
    this.purposeOfVisitSelect = this.checkInModal.locator('select').last();

    // Check-out Inputs
    this.checkoutBtn = page.getByRole('button', { name: 'Check-out' });
    this.balanceDueInput = page.locator('input[type="number"]');
    this.paymentCardRadio = page.getByText('card', { exact: true });
    this.completeCheckOutBtn = page.getByRole('button', { name: 'Complete Check-out' });
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
  async performCheckIn(roomNumber: string, idProof: string, arrivingFrom: string, goingTo: string) {
    await this.fastTrackCheckInBtn.click();
    await expect(this.checkInModal).toBeVisible();

    // Step 1: Assign Room
    await this.roomAssignmentInput.fill(roomNumber);
    await this.checkInContinueBtn.click();

    // Step 2: Form-B Details
    // Select Aadhaar
    await this.idProofTypeSelect.selectOption('aadhaar');
    await this.idProofNumberInput.fill(idProof);
    await this.arrivingFromInput.fill(arrivingFrom);
    await this.goingToInput.fill(goingTo);
    await this.checkInContinueBtn.click();

    // Step 3: Confirm
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/v1/check-in-out') && response.status() === 200
    );
    await this.completeCheckInBtn.click();
    await responsePromise;
    await expect(this.checkInModal).not.toBeVisible();
  }

  // --- Check-Out Flow ---
  async performCheckOut(balance: number) {
    await this.checkoutBtn.click();
    await expect(this.checkOutModal).toBeVisible();

    await this.balanceDueInput.fill(balance.toString());
    await this.paymentCardRadio.click();

    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/v1/check-in-out') && response.status() === 200
    );
    await this.completeCheckOutBtn.click();
    await responsePromise;

    await expect(this.checkOutModal).not.toBeVisible();
  }
}
