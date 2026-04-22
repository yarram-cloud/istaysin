# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\02-tenant-setup.spec.ts >> Property Registration & Admin Approval Flow >> Owner successfully registers a new property
- Location: apps\e2e\tests\02-tenant-setup.spec.ts:24:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/register", waiting until "load"

```

# Test source

```ts
  1  | import { Page, Locator } from '@playwright/test';
  2  | 
  3  | export class RegisterPage {
  4  |   readonly page: Page;
  5  | 
  6  |   // Step 1: Plan
  7  |   readonly starterPlan: Locator;
  8  |   readonly basicPlan: Locator;
  9  |   
  10 |   // Step 2: Property
  11 |   readonly propertyNameInput: Locator;
  12 |   readonly propertyTypeSelect: Locator;
  13 |   readonly contactPhoneInput: Locator;
  14 |   readonly contactEmailInput: Locator;
  15 |   // Location Map stub interactions might be needed, but we'll fill defaults
  16 |   
  17 |   // Auto-filled overrides overrides
  18 |   readonly cityInput: Locator;
  19 |   readonly stateInput: Locator;
  20 |   readonly pincodeInput: Locator;
  21 | 
  22 |   // Step 3: Owner
  23 |   readonly fullNameInput: Locator;
  24 |   readonly emailInput: Locator;
  25 |   readonly phoneInput: Locator;
  26 |   readonly passwordInput: Locator;
  27 |   readonly confirmPasswordInput: Locator;
  28 | 
  29 |   // Navigation
  30 |   readonly nextButton: Locator;
  31 |   readonly completeButton: Locator;
  32 | 
  33 |   constructor(page: Page) {
  34 |     this.page = page;
  35 | 
  36 |     // Step 1
  37 |     this.starterPlan = page.getByText('Starter', { exact: true });
  38 |     this.basicPlan = page.getByText('Basic', { exact: true });
  39 | 
  40 |     // Step 2
  41 |     this.propertyNameInput = page.locator('input#propertyName');
  42 |     this.propertyTypeSelect = page.locator('select#propertyType');
  43 |     this.contactPhoneInput = page.locator('input#contactPhone');
  44 |     this.contactEmailInput = page.locator('input#contactEmail');
  45 |     
  46 |     // Auto-filled/Edit
  47 |     this.cityInput = page.locator('input#city');
  48 |     this.stateInput = page.locator('input#state');
  49 |     this.pincodeInput = page.locator('input#pincode');
  50 | 
  51 |     // Step 3
  52 |     this.fullNameInput = page.locator('input#fullName');
  53 |     this.emailInput = page.locator('input#ownerEmail');
  54 |     this.phoneInput = page.locator('input#phone');
  55 |     this.passwordInput = page.locator('input#password');
  56 |     this.confirmPasswordInput = page.locator('input#confirmPassword');
  57 | 
  58 |     // Navigation
  59 |     this.nextButton = page.getByRole('button', { name: /Next Step/i });
  60 |     this.completeButton = page.getByRole('button', { name: /Complete Registration/i });
  61 |   }
  62 | 
  63 |   async goto() {
> 64 |     await this.page.goto('/register');
     |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  65 |   }
  66 | 
  67 |   async selectPlan(plan: 'starter' | 'basic') {
  68 |     if (plan === 'starter') await this.starterPlan.click();
  69 |     if (plan === 'basic') await this.basicPlan.click();
  70 |     await this.nextButton.click();
  71 |   }
  72 | 
  73 |   async fillPropertyDetails(data: { name: string, type: string, phone: string, email?: string }) {
  74 |     await this.propertyNameInput.fill(data.name);
  75 |     await this.propertyTypeSelect.selectOption(data.type);
  76 |     await this.contactPhoneInput.fill(data.phone);
  77 |     if (data.email) await this.contactEmailInput.fill(data.email);
  78 |     
  79 |     // Fill required location fields that appear after MapPin or auto-filled
  80 |     // In e2e the MapPin might not auto-trigger the city/state properly if we don't mock it,
  81 |     // Actually the UI renders them if they exist. By default latitude/longitude is set, 
  82 |     // so let's just make sure they are filled. If they are hidden, we might need to trigger something.
  83 |     // The LocationMap component dynamically loads. We can just fill them if visible.
  84 |     if (await this.cityInput.isVisible()) await this.cityInput.fill('Mumbai');
  85 |     if (await this.stateInput.isVisible()) await this.stateInput.fill('Maharashtra');
  86 |     if (await this.pincodeInput.isVisible()) await this.pincodeInput.fill('400001');
  87 |   }
  88 | 
  89 |   async fillOwnerDetails(data: { name: string, email: string, phone: string, pass: string }) {
  90 |     await this.fullNameInput.fill(data.name);
  91 |     await this.emailInput.fill(data.email);
  92 |     await this.phoneInput.fill(data.phone);
  93 |     await this.passwordInput.fill(data.pass);
  94 |     await this.confirmPasswordInput.fill(data.pass);
  95 |     await this.completeButton.click();
  96 |   }
  97 | }
  98 | 
```