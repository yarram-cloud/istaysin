import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;

  // Step 1: Plan
  readonly starterPlan: Locator;
  readonly basicPlan: Locator;
  
  // Step 2: Property
  readonly propertyNameInput: Locator;
  readonly propertyTypeSelect: Locator;
  readonly contactPhoneInput: Locator;
  readonly contactEmailInput: Locator;
  // Location Map stub interactions might be needed, but we'll fill defaults
  
  // Auto-filled overrides overrides
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly pincodeInput: Locator;

  // Step 3: Owner
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // Navigation
  readonly nextButton: Locator;
  readonly completeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1
    this.starterPlan = page.getByText('Starter', { exact: true });
    this.basicPlan = page.getByText('Basic', { exact: true });

    // Step 2
    this.propertyNameInput = page.locator('input#propertyName');
    this.propertyTypeSelect = page.locator('select#propertyType');
    this.contactPhoneInput = page.locator('input#contactPhone');
    this.contactEmailInput = page.locator('input#contactEmail');
    
    // Auto-filled/Edit
    this.cityInput = page.locator('input#city');
    this.stateInput = page.locator('input#state');
    this.pincodeInput = page.locator('input#pincode');

    // Step 3
    this.fullNameInput = page.locator('input#fullName');
    this.emailInput = page.locator('input#ownerEmail');
    this.phoneInput = page.locator('input#phone');
    this.passwordInput = page.locator('input#password');
    this.confirmPasswordInput = page.locator('input#confirmPassword');

    // Navigation
    this.nextButton = page.getByRole('button', { name: /Next Step/i });
    this.completeButton = page.getByRole('button', { name: /Complete Registration/i });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async selectPlan(plan: 'starter' | 'basic') {
    if (plan === 'starter') await this.starterPlan.click();
    if (plan === 'basic') await this.basicPlan.click();
    await this.nextButton.click();
  }

  async fillPropertyDetails(data: { name: string, type: string, phone: string, email?: string }) {
    await this.propertyNameInput.fill(data.name);
    await this.propertyTypeSelect.selectOption(data.type);
    await this.contactPhoneInput.fill(data.phone);
    if (data.email) await this.contactEmailInput.fill(data.email);
    
    // Fill required location fields that appear after MapPin or auto-filled
    // In e2e the MapPin might not auto-trigger the city/state properly if we don't mock it,
    // Actually the UI renders them if they exist. By default latitude/longitude is set, 
    // so let's just make sure they are filled. If they are hidden, we might need to trigger something.
    // The LocationMap component dynamically loads. We can just fill them if visible.
    if (await this.cityInput.isVisible()) await this.cityInput.fill('Mumbai');
    if (await this.stateInput.isVisible()) await this.stateInput.fill('Maharashtra');
    if (await this.pincodeInput.isVisible()) await this.pincodeInput.fill('400001');
  }

  async fillOwnerDetails(data: { name: string, email: string, phone: string, pass: string }) {
    await this.fullNameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.passwordInput.fill(data.pass);
    await this.confirmPasswordInput.fill(data.pass);
    await this.completeButton.click();
  }
}
