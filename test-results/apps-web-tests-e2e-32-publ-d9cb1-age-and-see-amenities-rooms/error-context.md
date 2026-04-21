# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\tests\e2e\32-public-booking-ui.spec.ts >> Public Guest Booking Portal UI Operations >> Guest can access the property page and see amenities & rooms
- Location: apps\web\tests\e2e\32-public-booking-ui.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2').first()

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Configuration
  4  | const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
  5  | const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';
  6  | 
  7  | test.describe('Public Guest Booking Portal UI Operations', () => {
  8  | 
  9  |   let propertySlug = '';
  10 | 
  11 |   test.beforeAll(async ({ request }) => {
  12 |     // Fetch a real property slug from the API
  13 |     const res = await request.get(`${API_URL}/api/v1/public/properties`);
  14 |     const data = await res.json();
  15 |     if (data.success && data.data && data.data.length > 0) {
  16 |       propertySlug = data.data[0].slug;
  17 |     }
  18 |   });
  19 | 
  20 |   // Skip all tests if no property exists
  21 |   test.beforeEach(async () => {
  22 |     if (!propertySlug) test.skip(true, 'No seeded properties found.');
  23 |   });
  24 | 
  25 |   test('Guest can access the property page and see amenities & rooms', async ({ page }) => {
  26 |     await page.goto(`${BASE_URL}/property/${propertySlug}`);
  27 |     
  28 |     // Evaluate if the page loaded normally
> 29 |     await expect(page.locator('h2').first()).toBeVisible();
     |                                              ^ Error: expect(locator).toBeVisible() failed
  30 | 
  31 |     // The "Command Center" / Hero should contain the tenant name
  32 |     const pageText = await page.textContent('body');
  33 |     // Ensure we don't end up on a 404 page if seeded correctly
  34 |     if (pageText?.includes('Property not found')) {
  35 |       test.skip(true, 'Test property not found, skipping public IBE UI test.');
  36 |     }
  37 | 
  38 |     // Verify rooms section exists
  39 |     await expect(page.locator('text=Our Accommodations').first()).toBeVisible();
  40 |     
  41 |     // Expect at least one "Book Your Stay" link
  42 |     await expect(page.locator('a:has-text("Book Your Stay")').first()).toBeVisible();
  43 |   });
  44 | 
  45 |   test('Guest can navigate to the booking wizard', async ({ page }) => {
  46 |     // We append random dates for stability
  47 |     const today = new Date();
  48 |     const futureIn = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  49 |     const futureOut = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  50 | 
  51 |     await page.goto(`${BASE_URL}/property/${propertySlug}/book?checkIn=${futureIn}&checkOut=${futureOut}&adults=2`);
  52 |     
  53 |     const pageText = await page.textContent('body');
  54 |     if (pageText?.includes('Property not found')) {
  55 |       test.skip(true, 'Test property not found, skipping public IBE UI check.');
  56 |     }
  57 | 
  58 |     // Wizard step 1 UI check
  59 |     await expect(page.locator('text=Select Your Dates')).toBeVisible();
  60 | 
  61 |     // Check Availability button
  62 |     const checkBtn = page.locator('button:has-text("Check Availability")');
  63 |     await expect(checkBtn).toBeVisible();
  64 | 
  65 |     // Click to fetch availability
  66 |     await checkBtn.click();
  67 | 
  68 |     // Wait for network response (assumes tenant exists and mock works)
  69 |     await page.waitForLoadState('networkidle');
  70 | 
  71 |     // Due to lack of deterministic seed validation here, we just verify no crass UI crash 
  72 |     // occurs and if a success comes back, "Proceed to Guest Details" is rendered.
  73 |     // If it fails (e.g. no rooms), it shows "No rooms are available".
  74 |     const bodyContent = await page.textContent('body');
  75 |     expect(bodyContent).toBeDefined();
  76 |   });
  77 | 
  78 | });
  79 | 
```