# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\web\tests\e2e\32-public-booking-ui.spec.ts >> Public Guest Booking Portal UI Operations >> Guest can navigate to the booking wizard
- Location: apps\web\tests\e2e\32-public-booking-ui.spec.ts:45:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Select Your Dates')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Select Your Dates')

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
      - generic [ref=e16]:
        - link "Back to Property" [ref=e17] [cursor=pointer]:
          - /url: /property/budget-hotel-basic
          - img [ref=e18]
          - text: Back to Property
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: "1"
            - generic [ref=e23]: Select Room
          - generic [ref=e25]:
            - generic [ref=e26]: "2"
            - generic [ref=e27]: Guest Details
          - generic [ref=e29]:
            - generic [ref=e30]: "3"
            - generic [ref=e31]: Confirmation
        - generic [ref=e32]:
          - generic [ref=e34]:
            - heading "Search Availability" [level=2] [ref=e35]
            - generic [ref=e36]:
              - generic [ref=e37]:
                - generic [ref=e38]:
                  - text: Check-In
                  - textbox [ref=e39]: 2026-04-22
                - generic [ref=e40]:
                  - text: Check-Out
                  - textbox [ref=e41]: 2026-04-23
              - generic [ref=e42]:
                - generic [ref=e43]:
                  - text: Adults
                  - combobox [ref=e44]:
                    - option "1" [selected]
                    - option "2"
                    - option "3"
                    - option "4"
                    - option "5"
                - generic [ref=e45]:
                  - text: Children
                  - combobox [ref=e46]:
                    - option "0" [selected]
                    - option "1"
                    - option "2"
                    - option "3"
                    - option "4"
                - generic [ref=e47]:
                  - text: Room Type
                  - combobox [ref=e48]:
                    - option "Deluxe Room" [selected]
              - button "Check Availability" [ref=e49] [cursor=pointer]
          - generic [ref=e51]:
            - heading "Order Summary" [level=3] [ref=e52]:
              - img [ref=e53]
              - text: Order Summary
            - generic [ref=e55]:
              - generic [ref=e56]:
                - generic [ref=e57]: Property
                - paragraph [ref=e58]: Budget Hotel Basic
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - generic [ref=e61]: Check-In
                  - paragraph [ref=e62]: 21 Apr 2026
                - generic [ref=e63]:
                  - generic [ref=e64]: Check-Out
                  - paragraph [ref=e65]: 22 Apr 2026
              - generic [ref=e66]:
                - generic [ref=e67]: Guests
                - paragraph [ref=e68]: 1 Adults, 0 Children
    - contentinfo [ref=e69]:
      - generic [ref=e70]:
        - generic [ref=e71]:
          - heading "Budget Hotel Basic" [level=3] [ref=e72]
          - paragraph [ref=e73]: ", ,"
          - paragraph [ref=e74]: 📞
          - paragraph [ref=e75]: ✉️
        - generic [ref=e76]:
          - heading "Quick Links" [level=3] [ref=e77]
          - list [ref=e78]:
            - listitem [ref=e79]:
              - link "Our Rooms" [ref=e80] [cursor=pointer]:
                - /url: "#rooms"
            - listitem [ref=e81]:
              - link "Guest Reviews" [ref=e82] [cursor=pointer]:
                - /url: "#reviews"
            - listitem [ref=e83]:
              - link "Terms & Conditions" [ref=e84] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e85]:
              - link "Privacy Policy" [ref=e86] [cursor=pointer]:
                - /url: /privacy
        - heading "Connect With Us" [level=3] [ref=e88]
      - generic [ref=e89]:
        - text: © 2026 Budget Hotel Basic. All rights reserved.
        - generic [ref=e90]: Powered by iStays
  - alert [ref=e91]
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
  29 |     await expect(page.locator('h2').first()).toBeVisible();
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
> 59 |     await expect(page.locator('text=Select Your Dates')).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
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