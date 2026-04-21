import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/Email/i).or(page.getByPlaceholder(/example/i)).or(page.locator('input#identifier'));
    this.passwordInput = page.locator('input[type="password"], input#password');
    this.submitButton = page.getByRole('button', { name: /Sign In/i });
  }

  async goto() {
    await this.page.goto('/login', { timeout: 90000 });
  }

  async login(email: string, password: string = 'Welcome@1', expectSuccess: boolean = true) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.click();
    await this.emailInput.fill(email);
    
    await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
    
    await this.submitButton.click();
    
    if (expectSuccess) {
      // It should redirect to either /admin or /dashboard
      await expect(this.page).toHaveURL(/.*(\/dashboard|\/admin)/, { timeout: 30000 });
    }
  }

  async getErrorMessage() {
    await this.submitButton.waitFor({ state: 'visible', timeout: 15000 });
    const errorLocator = this.page.locator('.text-red-600');
    await errorLocator.first().waitFor({ state: 'visible', timeout: 15000 });
    return errorLocator.first().textContent();
  }
}
