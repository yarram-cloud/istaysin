# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\11-property-settings.spec.ts >> Property Settings & Customizations (Subdomain / Colors) >> Updating Brand Colors uniquely changes Public Landing Page theme
- Location: apps\e2e\tests\11-property-settings.spec.ts:17:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/login", waiting until "load"

```

# Test source

```ts
  1  | import { Page, Locator, expect } from '@playwright/test';
  2  | 
  3  | export class LoginPage {
  4  |   readonly page: Page;
  5  |   readonly emailInput: Locator;
  6  |   readonly passwordInput: Locator;
  7  |   readonly submitButton: Locator;
  8  | 
  9  |   constructor(page: Page) {
  10 |     this.page = page;
  11 |     this.emailInput = page.getByLabel(/Email/i).or(page.getByPlaceholder(/example/i)).or(page.locator('input#identifier'));
  12 |     this.passwordInput = page.locator('input[type="password"], input#password');
  13 |     this.submitButton = page.getByRole('button', { name: /Sign In/i });
  14 |   }
  15 | 
  16 |   async goto() {
> 17 |     await this.page.goto('/login', { timeout: 90000 });
     |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  18 |   }
  19 | 
  20 |   async login(email: string, password: string = 'Welcome@1', expectSuccess: boolean = true) {
  21 |     await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
  22 |     await this.emailInput.click();
  23 |     await this.emailInput.fill(email);
  24 |     
  25 |     await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  26 |     await this.passwordInput.click();
  27 |     await this.passwordInput.fill(password);
  28 |     
  29 |     await this.submitButton.click();
  30 |     
  31 |     if (expectSuccess) {
  32 |       // It should redirect to either /admin or /dashboard
  33 |       await expect(this.page).toHaveURL(/.*(\/dashboard|\/admin)/, { timeout: 30000 });
  34 |     }
  35 |   }
  36 | 
  37 |   async getErrorMessage() {
  38 |     await this.submitButton.waitFor({ state: 'visible', timeout: 15000 });
  39 |     const errorLocator = this.page.locator('.text-red-600');
  40 |     await errorLocator.first().waitFor({ state: 'visible', timeout: 15000 });
  41 |     return errorLocator.first().textContent();
  42 |   }
  43 | }
  44 | 
```