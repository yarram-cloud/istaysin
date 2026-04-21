# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 22-property-public-page.spec.ts >> Public Property Page — Desktop >> nav links scroll to sections
- Location: tests\22-property-public-page.spec.ts:50:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('nav a[href="#about"]').first()
Expected: visible
Received: hidden
Timeout:  30000ms

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('nav a[href="#about"]').first()
    33 × locator resolved to <a href="#about" class="hover:property-theme-text transition-colors">About</a>
       - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: P
          - heading "Premium Resort Pro" [level=1] [ref=e8]
        - link "Book Now" [ref=e9]:
          - /url: /en/premium-resort-pro/book
    - main [ref=e10]:
      - generic [ref=e11]:
        - main [ref=e12]:
          - generic [ref=e14]:
            - generic [ref=e16]: Premium Resort Pro
            - generic [ref=e17]:
              - link "Book Now" [ref=e18]:
                - /url: /en/premium-resort-pro/book
              - button "Switch language" [ref=e21] [cursor=pointer]:
                - img [ref=e22]
          - generic [ref=e27]:
            - heading "Welcome to Premium Resort Pro" [level=1] [ref=e28]
            - paragraph
          - generic [ref=e29]:
            - generic [ref=e30]:
              - generic [ref=e32]:
                - generic [ref=e33]:
                  - heading "Accommodations" [level=2] [ref=e34]
                  - paragraph [ref=e35]: Find the perfect room for your stay.
                - generic [ref=e37]:
                  - generic [ref=e38]:
                    - generic [ref=e39]: No Image
                    - generic [ref=e40]: ₹2500 / night
                  - generic [ref=e41]:
                    - heading "Deluxe Room" [level=3] [ref=e42]
                    - paragraph
                    - generic [ref=e43]:
                      - generic [ref=e44]:
                        - img [ref=e45]
                        - text: Up to 2 guests
                      - img [ref=e49]
                    - link "Book this Room" [ref=e52]:
                      - /url: /en/premium-resort-pro/book?roomType=b9bb2805-1cf9-4598-866e-5b49be1ad125
                      - text: Book this Room
                      - img [ref=e53]
              - generic [ref=e56]:
                - generic [ref=e57]:
                  - heading "Guest Experiences" [level=2] [ref=e58]
                  - paragraph [ref=e59]: See what our guests have to say about their stay.
                - generic [ref=e61]:
                  - img [ref=e62]
                  - generic [ref=e65]:
                    - img [ref=e66]
                    - img [ref=e68]
                    - img [ref=e70]
                    - img [ref=e72]
                    - img [ref=e74]
                  - paragraph [ref=e76]: "\"Absolutely astonishing E2E functionality. Clean beds, fast APIs.\""
                  - generic [ref=e77]:
                    - generic [ref=e78]: R
                    - generic [ref=e79]:
                      - heading "Review Tester" [level=4] [ref=e80]
                      - paragraph [ref=e81]: Verified Stay
              - generic [ref=e83]:
                - heading "Property Policies" [level=3] [ref=e84]:
                  - img [ref=e85]
                  - text: Property Policies
                - generic [ref=e87]:
                  - generic [ref=e88]:
                    - generic [ref=e89]:
                      - term [ref=e90]: Check-in Time
                      - definition [ref=e91]: 14:00 (2:00 PM)
                    - generic [ref=e92]:
                      - term [ref=e93]: Check-out Time
                      - definition [ref=e94]: 11:00 (11:00 AM)
                    - generic [ref=e95]:
                      - term [ref=e96]: Cancellation
                      - definition [ref=e97]: Standard 48-hour cancellation policy applies.
                    - generic [ref=e98]:
                      - term [ref=e99]: Child Policy
                      - definition [ref=e100]: Children under 5 stay free with existing bedding.
                    - generic [ref=e101]:
                      - term [ref=e102]: Pets
                      - definition [ref=e103]: Pets are strictly not allowed.
                  - paragraph [ref=e105]: "Note: Guests are required to show a photo identification upon check-in. Valid ID proofs include Passport, Aadhar Card, Driving License, or Voter ID."
            - generic [ref=e108]:
              - generic [ref=e109]: Best Price Guarantee
              - generic [ref=e110]:
                - heading "Book Your Stay" [level=3] [ref=e111]
                - paragraph [ref=e112]: Select dates to view available prices.
              - generic [ref=e113]:
                - generic [ref=e114]:
                  - generic [ref=e115] [cursor=pointer]:
                    - generic [ref=e116]: Check In
                    - generic [ref=e117]:
                      - img [ref=e118]
                      - textbox [ref=e120]: 2026-04-22
                  - generic [ref=e122] [cursor=pointer]:
                    - generic [ref=e123]: Check Out
                    - textbox [ref=e125]: 2026-04-23
                - generic [ref=e127] [cursor=pointer]:
                  - generic [ref=e128]: Guests & Rooms
                  - generic [ref=e129]:
                    - generic [ref=e130]:
                      - img [ref=e131]
                      - generic [ref=e136]: 2 Guests, 1 Room
                    - img [ref=e137]
                - button "Check Availability" [ref=e139] [cursor=pointer]
              - generic [ref=e141]:
                - img [ref=e142]
                - generic [ref=e145]: No hidden fees
                - img [ref=e147]
                - generic [ref=e150]: Instant Confirmation
        - generic [ref=e151]:
          - generic [ref=e152]:
            - generic [ref=e153]:
              - heading "Premium Resort Pro" [level=4] [ref=e154]
              - paragraph [ref=e155]: Experience luxury and comfort in every stay.
            - generic [ref=e156]:
              - heading "Quick Links" [level=5] [ref=e157]
              - list [ref=e158]:
                - listitem [ref=e159]:
                  - link "About" [ref=e160]:
                    - /url: "#about"
                - listitem [ref=e161]:
                  - link "Rooms & Suites" [ref=e162]:
                    - /url: "#rooms"
                - listitem [ref=e163]:
                  - link "Gallery" [ref=e164]:
                    - /url: "#gallery"
            - generic [ref=e165]:
              - heading "Legal" [level=5] [ref=e166]
              - list [ref=e167]:
                - listitem [ref=e168]:
                  - link "Privacy Policy" [ref=e169]:
                    - /url: "#"
                - listitem [ref=e170]:
                  - link "Terms of Service" [ref=e171]:
                    - /url: "#"
                - listitem [ref=e172]:
                  - link "Refund Policy" [ref=e173]:
                    - /url: "#"
            - generic [ref=e174]:
              - heading "Contact" [level=5] [ref=e175]
              - paragraph [ref=e177]: ","
          - generic [ref=e178]:
            - paragraph [ref=e179]: © 2026 Premium Resort Pro. All rights reserved.
            - paragraph [ref=e180]: Powered by iStays
    - contentinfo [ref=e181]:
      - generic [ref=e182]:
        - generic [ref=e183]:
          - heading "Premium Resort Pro" [level=3] [ref=e184]
          - paragraph [ref=e185]: ", ,"
          - paragraph [ref=e186]: 📞
          - paragraph [ref=e187]: ✉️
        - generic [ref=e188]:
          - heading "Quick Links" [level=3] [ref=e189]
          - list [ref=e190]:
            - listitem [ref=e191]:
              - link "Our Rooms" [ref=e192]:
                - /url: "#rooms"
            - listitem [ref=e193]:
              - link "Guest Reviews" [ref=e194]:
                - /url: "#reviews"
            - listitem [ref=e195]:
              - link "Terms & Conditions" [ref=e196]:
                - /url: /terms
            - listitem [ref=e197]:
              - link "Privacy Policy" [ref=e198]:
                - /url: /privacy
        - heading "Connect With Us" [level=3] [ref=e200]
      - generic [ref=e201]:
        - text: © 2026 Premium Resort Pro. All rights reserved.
        - generic [ref=e202]: Powered by iStays
  - alert [ref=e203]
```

# Test source

```ts
  1   | /**
  2   |  * 22-property-public-page.spec.ts
  3   |  *
  4   |  * E2E tests for the public property page theme system.
  5   |  * Covers:
  6   |  *   - Page loads with hero for all reachable properties
  7   |  *   - Components render only when enabled
  8   |  *   - Theme switch in Website Builder reflects on public page
  9   |  *   - Mobile / tablet viewport rendering
  10  |  *   - Booking widget visibility
  11  |  *   - Footer social links
  12  |  *   - Navigation links
  13  |  */
  14  | 
  15  | import { test, expect } from '@playwright/test';
  16  | 
  17  | const PROPERTY_SLUG = 'premium-resort-pro'; // known seeded slug
  18  | const PROPERTY_URL  = `/en/${PROPERTY_SLUG}`;
  19  | 
  20  | // ─── Basic page load ──────────────────────────────────────────────────────────
  21  | test.describe('Public Property Page — Desktop', () => {
  22  |   test('loads without JS errors and has correct title', async ({ page }) => {
  23  |     const errors: string[] = [];
  24  |     page.on('pageerror', (e) => errors.push(e.message));
  25  | 
  26  |     await page.goto(PROPERTY_URL);
  27  |     await page.waitForLoadState('networkidle');
  28  | 
  29  |     // Title should contain property name
  30  |     await expect(page).toHaveTitle(/.+\| Book Now/);
  31  | 
  32  |     // No uncaught JS errors
  33  |     expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  34  |   });
  35  | 
  36  |   test('hero section is always visible', async ({ page }) => {
  37  |     await page.goto(PROPERTY_URL);
  38  |     // Hero is identified by the section that fills the viewport (min-h screen)
  39  |     const hero = page.locator('section').first();
  40  |     await expect(hero).toBeVisible();
  41  |   });
  42  | 
  43  |   test('header contains property name and Book Now button', async ({ page }) => {
  44  |     await page.goto(PROPERTY_URL);
  45  |     const header = page.locator('#site-header');
  46  |     await expect(header).toBeVisible();
  47  |     await expect(header.locator('a[href*="book"]')).toBeVisible();
  48  |   });
  49  | 
  50  |   test('nav links scroll to sections', async ({ page }) => {
  51  |     await page.goto(PROPERTY_URL);
  52  |     const aboutLink = page.locator('nav a[href="#about"]').first();
  53  |     // Anchor links should be present
> 54  |     await expect(aboutLink).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
  55  |     await expect(aboutLink).toHaveAttribute('href', '#about');
  56  |   });
  57  | 
  58  |   test('footer is always rendered', async ({ page }) => {
  59  |     await page.goto(PROPERTY_URL);
  60  |     const footer = page.locator('footer').last();
  61  |     await expect(footer).toBeVisible();
  62  |     // Footer should have property name
  63  |     const footerText = await footer.textContent();
  64  |     expect(footerText).toBeTruthy();
  65  |   });
  66  | 
  67  |   test('Book Now button navigates to booking flow', async ({ page }) => {
  68  |     await page.goto(PROPERTY_URL);
  69  |     const bookBtn = page.locator('#site-header a[href*="book"]').first();
  70  |     const href = await bookBtn.getAttribute('href');
  71  |     expect(href).toContain('/book');
  72  |   });
  73  | });
  74  | 
  75  | // ─── Mobile viewport ──────────────────────────────────────────────────────────
  76  | test.describe('Public Property Page — Mobile (375px)', () => {
  77  |   test.use({ viewport: { width: 375, height: 812 } });
  78  | 
  79  |   test('page loads and hero is visible on mobile', async ({ page }) => {
  80  |     await page.goto(PROPERTY_URL);
  81  |     await page.waitForLoadState('networkidle');
  82  |     const hero = page.locator('section').first();
  83  |     await expect(hero).toBeVisible();
  84  |   });
  85  | 
  86  |   test('mobile nav does not show desktop links (they are hidden)', async ({ page }) => {
  87  |     await page.goto(PROPERTY_URL);
  88  |     // Desktop nav has hidden md:flex — should not be visible on 375px
  89  |     const desktopNav = page.locator('nav.hidden');
  90  |     // The nav exists but is CSS-hidden
  91  |     await expect(desktopNav).toHaveClass(/hidden/);
  92  |   });
  93  | 
  94  |   test('Book Now button is visible on mobile', async ({ page }) => {
  95  |     await page.goto(PROPERTY_URL);
  96  |     const bookBtn = page.locator('#site-header a[href*="book"]').first();
  97  |     await expect(bookBtn).toBeVisible();
  98  |   });
  99  | 
  100 |   test('hero text is readable — h1 visible on mobile', async ({ page }) => {
  101 |     await page.goto(PROPERTY_URL);
  102 |     const h1 = page.locator('section h1').first();
  103 |     await expect(h1).toBeVisible();
  104 |   });
  105 | 
  106 |   test('footer visible and not cut off on mobile', async ({ page }) => {
  107 |     await page.goto(PROPERTY_URL);
  108 |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  109 |     await page.waitForTimeout(300);
  110 |     const footer = page.locator('footer').last();
  111 |     await expect(footer).toBeVisible();
  112 |   });
  113 | });
  114 | 
  115 | // ─── Tablet viewport ─────────────────────────────────────────────────────────
  116 | test.describe('Public Property Page — Tablet (768px)', () => {
  117 |   test.use({ viewport: { width: 768, height: 1024 } });
  118 | 
  119 |   test('page loads on tablet without layout overflow', async ({ page }) => {
  120 |     await page.goto(PROPERTY_URL);
  121 |     await page.waitForLoadState('networkidle');
  122 |     // No horizontal scroll
  123 |     const bodyWidth    = await page.evaluate(() => document.body.scrollWidth);
  124 |     const viewportWidth = await page.evaluate(() => window.innerWidth);
  125 |     expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2); // 2px tolerance
  126 |   });
  127 | 
  128 |   test('hero and header visible on tablet', async ({ page }) => {
  129 |     await page.goto(PROPERTY_URL);
  130 |     await expect(page.locator('section').first()).toBeVisible();
  131 |     await expect(page.locator('#site-header')).toBeVisible();
  132 |   });
  133 | });
  134 | 
  135 | // ─── Component visibility (enabled/disabled via config) ──────────────────────
  136 | test.describe('Component Enable/Disable Guards', () => {
  137 |   test('page renders without JS errors with all optional sections populated', async ({ page }) => {
  138 |     const errors: string[] = [];
  139 |     page.on('pageerror', (e) => errors.push(e.message));
  140 |     await page.goto(PROPERTY_URL);
  141 |     await page.waitForLoadState('networkidle');
  142 |     // Filter trivial browser warnings like ResizeObserver
  143 |     const fatal = errors.filter(e =>
  144 |       !e.includes('ResizeObserver') &&
  145 |       !e.includes('Non-Error promise rejection')
  146 |     );
  147 |     expect(fatal).toHaveLength(0);
  148 |   });
  149 | 
  150 |   test('promo banner only visible when configured', async ({ page }) => {
  151 |     await page.goto(PROPERTY_URL);
  152 |     // If the promo banner renders, it should have text content
  153 |     const banners = page.locator('[data-testid="promo-banner"]');
  154 |     const count = await banners.count();
```