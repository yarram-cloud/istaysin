# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 22-property-public-page.spec.ts >> Accessibility >> page has exactly one h1
- Location: tests\22-property-public-page.spec.ts:206:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('h1')
Expected: 1
Received: 2
Timeout:  30000ms

Call log:
  - Expect "toHaveCount" with timeout 30000ms
  - waiting for locator('h1')
    33 × locator resolved to 2 elements
       - unexpected value "2"

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
          - /url: /en/premium-resort-pro/book
    - main [ref=e15]:
      - generic [ref=e16]:
        - main [ref=e17]:
          - generic [ref=e19]:
            - generic [ref=e21]: Premium Resort Pro
            - navigation [ref=e22]:
              - link "About" [ref=e23] [cursor=pointer]:
                - /url: "#about"
              - link "Rooms" [ref=e24] [cursor=pointer]:
                - /url: "#rooms"
              - link "Gallery" [ref=e25] [cursor=pointer]:
                - /url: "#gallery"
            - generic [ref=e26]:
              - link "Book Now" [ref=e27] [cursor=pointer]:
                - /url: /en/premium-resort-pro/book
              - button "Switch language" [ref=e30] [cursor=pointer]:
                - img [ref=e31]
                - generic [ref=e34]: English
          - generic [ref=e37]:
            - heading "Welcome to Premium Resort Pro" [level=1] [ref=e38]
            - paragraph
          - generic [ref=e39]:
            - generic [ref=e40]:
              - generic [ref=e42]:
                - generic [ref=e43]:
                  - heading "Accommodations" [level=2] [ref=e44]
                  - paragraph [ref=e45]: Find the perfect room for your stay.
                - generic [ref=e47]:
                  - generic [ref=e48]:
                    - generic [ref=e49]: No Image
                    - generic [ref=e50]: ₹2500 / night
                  - generic [ref=e51]:
                    - heading "Deluxe Room" [level=3] [ref=e52]
                    - paragraph
                    - generic [ref=e53]:
                      - generic [ref=e54]:
                        - img [ref=e55]
                        - text: Up to 2 guests
                      - img [ref=e59]
                    - link "Book this Room" [ref=e62] [cursor=pointer]:
                      - /url: /en/premium-resort-pro/book?roomType=b9bb2805-1cf9-4598-866e-5b49be1ad125
                      - text: Book this Room
                      - img [ref=e63]
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - heading "Guest Experiences" [level=2] [ref=e68]
                  - paragraph [ref=e69]: See what our guests have to say about their stay.
                - generic [ref=e71]:
                  - img [ref=e72]
                  - generic [ref=e75]:
                    - img [ref=e76]
                    - img [ref=e78]
                    - img [ref=e80]
                    - img [ref=e82]
                    - img [ref=e84]
                  - paragraph [ref=e86]: "\"Absolutely astonishing E2E functionality. Clean beds, fast APIs.\""
                  - generic [ref=e87]:
                    - generic [ref=e88]: R
                    - generic [ref=e89]:
                      - heading "Review Tester" [level=4] [ref=e90]
                      - paragraph [ref=e91]: Verified Stay
              - generic [ref=e93]:
                - heading "Property Policies" [level=3] [ref=e94]:
                  - img [ref=e95]
                  - text: Property Policies
                - generic [ref=e97]:
                  - generic [ref=e98]:
                    - generic [ref=e99]:
                      - term [ref=e100]: Check-in Time
                      - definition [ref=e101]: 14:00 (2:00 PM)
                    - generic [ref=e102]:
                      - term [ref=e103]: Check-out Time
                      - definition [ref=e104]: 11:00 (11:00 AM)
                    - generic [ref=e105]:
                      - term [ref=e106]: Cancellation
                      - definition [ref=e107]: Standard 48-hour cancellation policy applies.
                    - generic [ref=e108]:
                      - term [ref=e109]: Child Policy
                      - definition [ref=e110]: Children under 5 stay free with existing bedding.
                    - generic [ref=e111]:
                      - term [ref=e112]: Pets
                      - definition [ref=e113]: Pets are strictly not allowed.
                  - paragraph [ref=e115]: "Note: Guests are required to show a photo identification upon check-in. Valid ID proofs include Passport, Aadhar Card, Driving License, or Voter ID."
            - generic [ref=e118]:
              - generic [ref=e119]: Best Price Guarantee
              - generic [ref=e120]:
                - heading "Book Your Stay" [level=3] [ref=e121]
                - paragraph [ref=e122]: Select dates to view available prices.
              - generic [ref=e123]:
                - generic [ref=e124]:
                  - generic [ref=e125] [cursor=pointer]:
                    - generic [ref=e126]: Check In
                    - generic [ref=e127]:
                      - img [ref=e128]
                      - textbox [ref=e130]: 2026-04-22
                  - generic [ref=e132] [cursor=pointer]:
                    - generic [ref=e133]: Check Out
                    - textbox [ref=e135]: 2026-04-23
                - generic [ref=e137] [cursor=pointer]:
                  - generic [ref=e138]: Guests & Rooms
                  - generic [ref=e139]:
                    - generic [ref=e140]:
                      - img [ref=e141]
                      - generic [ref=e146]: 2 Guests, 1 Room
                    - img [ref=e147]
                - button "Check Availability" [ref=e149] [cursor=pointer]
              - generic [ref=e151]:
                - img [ref=e152]
                - generic [ref=e155]: No hidden fees
                - img [ref=e157]
                - generic [ref=e160]: Instant Confirmation
        - generic [ref=e161]:
          - generic [ref=e162]:
            - generic [ref=e163]:
              - heading "Premium Resort Pro" [level=4] [ref=e164]
              - paragraph [ref=e165]: Experience luxury and comfort in every stay.
            - generic [ref=e166]:
              - heading "Quick Links" [level=5] [ref=e167]
              - list [ref=e168]:
                - listitem [ref=e169]:
                  - link "About" [ref=e170] [cursor=pointer]:
                    - /url: "#about"
                - listitem [ref=e171]:
                  - link "Rooms & Suites" [ref=e172] [cursor=pointer]:
                    - /url: "#rooms"
                - listitem [ref=e173]:
                  - link "Gallery" [ref=e174] [cursor=pointer]:
                    - /url: "#gallery"
            - generic [ref=e175]:
              - heading "Legal" [level=5] [ref=e176]
              - list [ref=e177]:
                - listitem [ref=e178]:
                  - link "Privacy Policy" [ref=e179] [cursor=pointer]:
                    - /url: "#"
                - listitem [ref=e180]:
                  - link "Terms of Service" [ref=e181] [cursor=pointer]:
                    - /url: "#"
                - listitem [ref=e182]:
                  - link "Refund Policy" [ref=e183] [cursor=pointer]:
                    - /url: "#"
            - generic [ref=e184]:
              - heading "Contact" [level=5] [ref=e185]
              - paragraph [ref=e187]: ","
          - generic [ref=e188]:
            - paragraph [ref=e189]: © 2026 Premium Resort Pro. All rights reserved.
            - paragraph [ref=e190]: Powered by iStays
    - contentinfo [ref=e191]:
      - generic [ref=e192]:
        - generic [ref=e193]:
          - heading "Premium Resort Pro" [level=3] [ref=e194]
          - paragraph [ref=e195]: ", ,"
          - paragraph [ref=e196]: 📞
          - paragraph [ref=e197]: ✉️
        - generic [ref=e198]:
          - heading "Quick Links" [level=3] [ref=e199]
          - list [ref=e200]:
            - listitem [ref=e201]:
              - link "Our Rooms" [ref=e202] [cursor=pointer]:
                - /url: "#rooms"
            - listitem [ref=e203]:
              - link "Guest Reviews" [ref=e204] [cursor=pointer]:
                - /url: "#reviews"
            - listitem [ref=e205]:
              - link "Terms & Conditions" [ref=e206] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e207]:
              - link "Privacy Policy" [ref=e208] [cursor=pointer]:
                - /url: /privacy
        - heading "Connect With Us" [level=3] [ref=e210]
      - generic [ref=e211]:
        - text: © 2026 Premium Resort Pro. All rights reserved.
        - generic [ref=e212]: Powered by iStays
  - alert [ref=e213]
```

# Test source

```ts
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
  155 |     if (count > 0) {
  156 |       const text = await banners.first().textContent();
  157 |       expect(text?.trim().length).toBeGreaterThan(0);
  158 |     }
  159 |     // If banner not configured, it should simply not exist (pass by default)
  160 |   });
  161 | });
  162 | 
  163 | // ─── Theme: Website Builder → Publish → Reflect ──────────────────────────────
  164 | test.describe('Theme Persistence via Website Builder', () => {
  165 |   test('changing theme in dashboard updates public page without error', async ({ page, context }) => {
  166 |     // 1. Log in as property owner
  167 |     await page.goto('/login');
  168 |     await page.fill('[name="email"]', 'owner@premiumresortpro.com');
  169 |     await page.fill('[name="password"]', 'Test@1234');
  170 |     await page.click('button[type="submit"]');
  171 |     await page.waitForURL('**/dashboard**', { timeout: 10_000 });
  172 | 
  173 |     // 2. Go to Website Builder
  174 |     await page.goto('/dashboard/website');
  175 |     await page.waitForLoadState('networkidle');
  176 | 
  177 |     // 3. Select a different theme
  178 |     const themeOptions = page.locator('[data-testid^="theme-preset-"]');
  179 |     const count = await themeOptions.count();
  180 |     if (count > 0) {
  181 |       await themeOptions.last().click(); // pick last/different theme
  182 |       // Publish
  183 |       const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Save")');
  184 |       if (await publishBtn.count() > 0) {
  185 |         await publishBtn.first().click();
  186 |         await page.waitForTimeout(1500);
  187 |       }
  188 |     }
  189 | 
  190 |     // 4. Open public page in new tab and check no crash
  191 |     const newPage = await context.newPage();
  192 |     const errors: string[] = [];
  193 |     newPage.on('pageerror', (e) => errors.push(e.message));
  194 |     await newPage.goto(PROPERTY_URL);
  195 |     await newPage.waitForLoadState('networkidle');
  196 | 
  197 |     await expect(newPage.locator('section').first()).toBeVisible();
  198 |     const fatal = errors.filter(e => !e.includes('ResizeObserver'));
  199 |     expect(fatal).toHaveLength(0);
  200 |     await newPage.close();
  201 |   });
  202 | });
  203 | 
  204 | // ─── Accessibility basics ─────────────────────────────────────────────────────
  205 | test.describe('Accessibility', () => {
  206 |   test('page has exactly one h1', async ({ page }) => {
  207 |     await page.goto(PROPERTY_URL);
  208 |     const h1s = page.locator('h1');
> 209 |     await expect(h1s).toHaveCount(1);
      |                       ^ Error: expect(locator).toHaveCount(expected) failed
  210 |   });
  211 | 
  212 |   test('all images have alt attributes', async ({ page }) => {
  213 |     await page.goto(PROPERTY_URL);
  214 |     await page.waitForLoadState('networkidle');
  215 |     const imgsWithoutAlt = await page.evaluate(() =>
  216 |       Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length
  217 |     );
  218 |     expect(imgsWithoutAlt).toBe(0);
  219 |   });
  220 | });
  221 | 
```