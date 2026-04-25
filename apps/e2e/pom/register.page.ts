import { Page, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/register');
  }

  async fillPropertyDetails(data: {
    name: string;
    type?: string;
    contactPhone: string;
    contactEmail?: string;
    address?: string;
    city: string;
    state: string;
    pincode: string;
  }) {
    await this.page.locator('input#propertyName').fill(data.name);
    if (data.type) await this.page.locator('select#propertyType').selectOption(data.type);
    await this.page.locator('input#contactPhone').fill(data.contactPhone);
    if (data.contactEmail) await this.page.locator('input#contactEmail').fill(data.contactEmail);
    // Address auto-fills from map; allow manual override for tests
    const addressInput = this.page.locator('input#address');
    await addressInput.fill(data.address ?? `${data.city}, ${data.state}`);
    await this.page.locator('input#city').fill(data.city);
    await this.page.locator('input#state').fill(data.state);
    await this.page.locator('input#pincode').fill(data.pincode);
  }

  /**
   * Sets up route interception for the OTP endpoint, fills the phone field,
   * clicks Send OTP, and waits for the devCode from the response.
   * Returns the captured OTP code.
   */
  async sendOtpAndCapture(phone: string): Promise<string> {
    let resolveOtp!: (otp: string) => void;
    const otpPromise = new Promise<string>((res) => { resolveOtp = res; });

    await this.page.route('**/auth/send-whatsapp-otp', async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      if (body.devCode) resolveOtp(body.devCode);
      await route.fulfill({ response });
    });

    await this.page.locator('input#ownerPhone').fill(phone);
    await this.page.getByRole('button', { name: /Send OTP/i }).click();

    return otpPromise;
  }

  async fillOwnerDetails(data: {
    fullName: string;
    phone: string;
    password: string;
    email?: string;
  }): Promise<string> {
    await this.page.locator('input#ownerName').fill(data.fullName);
    if (data.email) await this.page.locator('input#ownerEmail').fill(data.email);
    await this.page.locator('input#ownerPassword').fill(data.password);
    await this.page.locator('input#ownerConfirmPassword').fill(data.password);

    const otp = await this.sendOtpAndCapture(data.phone);
    await this.page.locator('input#otpCode').fill(otp);
    return otp;
  }

  async submitForm() {
    await this.page.getByRole('button', { name: 'Register Property' }).click();
  }

  async register(property: {
    name: string;
    type?: string;
    contactPhone: string;
    city: string;
    state: string;
    pincode: string;
  }, owner: {
    fullName: string;
    phone: string;
    password: string;
  }) {
    await this.goto();
    await this.fillPropertyDetails(property);
    await this.fillOwnerDetails(owner);
    await this.submitForm();
    await expect(this.page).toHaveURL(/.*\/pending-approval/, { timeout: 20000 });
  }
}
