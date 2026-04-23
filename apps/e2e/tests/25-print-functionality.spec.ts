import { test, expect } from '@playwright/test';

test.describe('Dashboard Print Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Basic login flow (assuming there's a reusable way or just simple auth)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123'); // From setup steps
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/analytics');
  });

  test('should have print button on analytics page', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    const printBtn = page.locator('button:has-text("Print Report")');
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toHaveClass(/print:hidden/);
  });

  test('should have print button on billing page', async ({ page }) => {
    await page.goto('/dashboard/billing');
    const printBtn = page.locator('button:has-text("Print Reports")');
    await expect(printBtn).toBeVisible();
  });

  test('should have print button on rooms/housekeeping page', async ({ page }) => {
    await page.goto('/dashboard/rooms');
    const printBtn = page.locator('button:has-text("Print")');
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toHaveClass(/print:hidden/);
  });

  test('should have print button on guests page', async ({ page }) => {
    await page.goto('/dashboard/guests');
    const printBtn = page.locator('button:has-text("Print Register")');
    await expect(printBtn).toBeVisible();
  });

  test('should verify print stylesheet is loaded', async ({ page }) => {
    const printStyle = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules);
          if (rules.some(rule => rule.type === CSSRule.MEDIA_RULE && (rule as CSSMediaRule).media.mediaText.includes('print'))) {
            return true;
          }
        } catch (e) {
          // Ignore cross-origin stylesheet errors
        }
      }
      return false;
    });
    expect(printStyle).toBeTruthy();
  });
});
