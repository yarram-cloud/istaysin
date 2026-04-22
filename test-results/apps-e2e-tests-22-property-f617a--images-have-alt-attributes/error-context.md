# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\22-property-public-page.spec.ts >> Accessibility >> all images have alt attributes
- Location: apps\e2e\tests\22-property-public-page.spec.ts:212:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/en/premium-resort-pro", waiting until "load"

```

# Test source

```ts
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
  209 |     await expect(h1s).toHaveCount(1);
  210 |   });
  211 | 
  212 |   test('all images have alt attributes', async ({ page }) => {
> 213 |     await page.goto(PROPERTY_URL);
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  214 |     await page.waitForLoadState('networkidle');
  215 |     const imgsWithoutAlt = await page.evaluate(() =>
  216 |       Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length
  217 |     );
  218 |     expect(imgsWithoutAlt).toBe(0);
  219 |   });
  220 | });
  221 | 
```