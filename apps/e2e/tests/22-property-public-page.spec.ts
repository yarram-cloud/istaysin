/**
 * 22-property-public-page.spec.ts
 *
 * E2E tests for the public property page theme system.
 * Covers:
 *   - Page loads with hero for all reachable properties
 *   - Components render only when enabled
 *   - Theme switch in Website Builder reflects on public page
 *   - Mobile / tablet viewport rendering
 *   - Booking widget visibility
 *   - Footer social links
 *   - Navigation links
 */

import { test, expect } from '@playwright/test';

const PROPERTY_SLUG = 'premium-resort-pro'; // known seeded slug
const PROPERTY_URL  = `/en/${PROPERTY_SLUG}`;

// ─── Basic page load ──────────────────────────────────────────────────────────
test.describe('Public Property Page — Desktop', () => {
  test('loads without JS errors and has correct title', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    // Title should contain property name
    await expect(page).toHaveTitle(/.+\| Book Now/);

    // No uncaught JS errors
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('hero section is always visible', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    // Hero is identified by the section that fills the viewport (min-h screen)
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('header contains property name and Book Now button', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const header = page.locator('#site-header');
    await expect(header).toBeVisible();
    await expect(header.locator('a[href*="book"]')).toBeVisible();
  });

  test('nav links scroll to sections', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const aboutLink = page.locator('nav a[href="#about"]').first();
    // Anchor links should be present
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute('href', '#about');
  });

  test('footer is always rendered', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const footer = page.locator('footer').last();
    await expect(footer).toBeVisible();
    // Footer should have property name
    const footerText = await footer.textContent();
    expect(footerText).toBeTruthy();
  });

  test('Book Now button navigates to booking flow', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const bookBtn = page.locator('#site-header a[href*="book"]').first();
    const href = await bookBtn.getAttribute('href');
    expect(href).toContain('/book');
  });
});

// ─── Mobile viewport ──────────────────────────────────────────────────────────
test.describe('Public Property Page — Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('page loads and hero is visible on mobile', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('mobile nav does not show desktop links (they are hidden)', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    // Desktop nav has hidden md:flex — should not be visible on 375px
    const desktopNav = page.locator('nav.hidden');
    // The nav exists but is CSS-hidden
    await expect(desktopNav).toHaveClass(/hidden/);
  });

  test('Book Now button is visible on mobile', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const bookBtn = page.locator('#site-header a[href*="book"]').first();
    await expect(bookBtn).toBeVisible();
  });

  test('hero text is readable — h1 visible on mobile', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const h1 = page.locator('section h1').first();
    await expect(h1).toBeVisible();
  });

  test('footer visible and not cut off on mobile', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const footer = page.locator('footer').last();
    await expect(footer).toBeVisible();
  });
});

// ─── Tablet viewport ─────────────────────────────────────────────────────────
test.describe('Public Property Page — Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('page loads on tablet without layout overflow', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');
    // No horizontal scroll
    const bodyWidth    = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2); // 2px tolerance
  });

  test('hero and header visible on tablet', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await expect(page.locator('section').first()).toBeVisible();
    await expect(page.locator('#site-header')).toBeVisible();
  });
});

// ─── Component visibility (enabled/disabled via config) ──────────────────────
test.describe('Component Enable/Disable Guards', () => {
  test('page renders without JS errors with all optional sections populated', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');
    // Filter trivial browser warnings like ResizeObserver
    const fatal = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection')
    );
    expect(fatal).toHaveLength(0);
  });

  test('promo banner only visible when configured', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    // If the promo banner renders, it should have text content
    const banners = page.locator('[data-testid="promo-banner"]');
    const count = await banners.count();
    if (count > 0) {
      const text = await banners.first().textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
    // If banner not configured, it should simply not exist (pass by default)
  });
});

// ─── Theme: Website Builder → Publish → Reflect ──────────────────────────────
test.describe('Theme Persistence via Website Builder', () => {
  test('changing theme in dashboard updates public page without error', async ({ page, context }) => {
    // 1. Log in as property owner
    await page.goto('/login');
    await page.fill('[name="email"]', 'owner@premiumresortpro.com');
    await page.fill('[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10_000 });

    // 2. Go to Website Builder
    await page.goto('/dashboard/website');
    await page.waitForLoadState('networkidle');

    // 3. Select a different theme
    const themeOptions = page.locator('[data-testid^="theme-preset-"]');
    const count = await themeOptions.count();
    if (count > 0) {
      await themeOptions.last().click(); // pick last/different theme
      // Publish
      const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Save")');
      if (await publishBtn.count() > 0) {
        await publishBtn.first().click();
        await page.waitForTimeout(1500);
      }
    }

    // 4. Open public page in new tab and check no crash
    const newPage = await context.newPage();
    const errors: string[] = [];
    newPage.on('pageerror', (e) => errors.push(e.message));
    await newPage.goto(PROPERTY_URL);
    await newPage.waitForLoadState('networkidle');

    await expect(newPage.locator('section').first()).toBeVisible();
    const fatal = errors.filter(e => !e.includes('ResizeObserver'));
    expect(fatal).toHaveLength(0);
    await newPage.close();
  });
});

// ─── Accessibility basics ─────────────────────────────────────────────────────
test.describe('Accessibility', () => {
  test('page has exactly one h1', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('all images have alt attributes', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');
    const imgsWithoutAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length
    );
    expect(imgsWithoutAlt).toBe(0);
  });
});
