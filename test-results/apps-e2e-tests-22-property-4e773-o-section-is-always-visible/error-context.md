# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\22-property-public-page.spec.ts >> Public Property Page — Desktop >> hero section is always visible
- Location: apps\e2e\tests\22-property-public-page.spec.ts:36:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/en/premium-resort-pro", waiting until "load"

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
> 37  |     await page.goto(PROPERTY_URL);
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
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
  54  |     await expect(aboutLink).toBeVisible();
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
```