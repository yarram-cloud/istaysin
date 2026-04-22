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

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: B
          - heading "Budget Hotel Basic" [level=1] [ref=e8]
        - navigation [ref=e9]:
          - link "About" [ref=e10] [cursor=pointer]:
            - /url: "#about"
          - link "Rooms" [ref=e11] [cursor=pointer]:
            - /url: "#rooms"
          - link "Amenities" [ref=e12] [cursor=pointer]:
            - /url: "#amenities"
          - link "Reviews" [ref=e13] [cursor=pointer]:
            - /url: "#reviews"
        - link "Book Now" [ref=e14] [cursor=pointer]:
          - /url: /property/budget-hotel-basic/book
    - main [ref=e15]:
      - main [ref=e17]:
        - generic [ref=e19]:
          - generic [ref=e21]: Budget Hotel Basic
          - navigation [ref=e22]:
            - link "About" [ref=e23] [cursor=pointer]:
              - /url: "#about"
            - link "Rooms" [ref=e24] [cursor=pointer]:
              - /url: "#rooms"
            - link "Gallery" [ref=e25] [cursor=pointer]:
              - /url: "#gallery"
          - generic [ref=e26]:
            - link "Book Now" [ref=e27] [cursor=pointer]:
              - /url: /property/budget-hotel-basic/book
            - button "Switch language" [ref=e29] [cursor=pointer]:
              - img [ref=e30]
              - generic [ref=e33]: English
        - generic [ref=e36]:
          - heading "Welcome to Budget Hotel Basic" [level=1] [ref=e37]
          - paragraph
          - button "Book Now" [ref=e38] [cursor=pointer]
        - generic [ref=e46]:
          - generic [ref=e47]: Best Price Guarantee
          - generic [ref=e48]:
            - heading "Book Your Stay" [level=3] [ref=e49]
            - paragraph [ref=e50]: Select dates to view available prices.
          - generic [ref=e51]:
            - generic [ref=e52]:
              - generic [ref=e53] [cursor=pointer]:
                - generic [ref=e54]: Check In
                - generic [ref=e55]:
                  - img [ref=e56]
                  - textbox [ref=e58]: 2026-04-22
              - generic [ref=e60] [cursor=pointer]:
                - generic [ref=e61]: Check Out
                - textbox [ref=e63]: 2026-04-23
            - generic [ref=e65] [cursor=pointer]:
              - generic [ref=e66]: Guests & Rooms
              - generic [ref=e67]:
                - generic [ref=e68]:
                  - img [ref=e69]
                  - generic [ref=e74]: 2 Guests, 1 Room
                - img [ref=e75]
            - button "Check Availability" [ref=e77] [cursor=pointer]
          - generic [ref=e79]:
            - img [ref=e80]
            - generic [ref=e83]: No hidden fees
            - img [ref=e85]
            - generic [ref=e88]: Instant Confirmation
    - contentinfo [ref=e89]:
      - generic [ref=e90]:
        - generic [ref=e91]:
          - heading "Budget Hotel Basic" [level=3] [ref=e92]
          - paragraph [ref=e93]: ", ,"
          - paragraph [ref=e94]: 📞
          - paragraph [ref=e95]: ✉️
        - generic [ref=e96]:
          - heading "Quick Links" [level=3] [ref=e97]
          - list [ref=e98]:
            - listitem [ref=e99]:
              - link "Our Rooms" [ref=e100] [cursor=pointer]:
                - /url: "#rooms"
            - listitem [ref=e101]:
              - link "Guest Reviews" [ref=e102] [cursor=pointer]:
                - /url: "#reviews"
            - listitem [ref=e103]:
              - link "Terms & Conditions" [ref=e104] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e105]:
              - link "Privacy Policy" [ref=e106] [cursor=pointer]:
                - /url: /privacy
        - heading "Connect With Us" [level=3] [ref=e108]
      - generic [ref=e109]:
        - text: © 2026 Budget Hotel Basic. All rights reserved.
        - generic [ref=e110]: Powered by iStays
  - alert [ref=e111]
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
  38 |     // Verify rooms section exists (using text segment from the premium template UI 'Our Rooms & Suites')
  39 |     await expect(page.locator('text=Our Rooms').first()).toBeVisible();
  40 |     
  41 |     // Expect at least one booked link, this can vary by component structure variant
  42 |     await expect(page.locator('a[href*="/book"]').first()).toBeVisible();
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