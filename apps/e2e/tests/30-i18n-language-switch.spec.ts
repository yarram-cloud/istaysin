import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3100';

// Helper: login and navigate to dashboard
async function loginToDashboard(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('input#email', 'rajya@istays.local');
  await page.fill('input#password', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

test.describe('i18n Language Switching', () => {
  test('should display language switcher in dashboard header', async ({ page }) => {
    await loginToDashboard(page);
    // The language switcher button should be visible (Languages icon)
    const switcher = page.locator('button:has(svg.lucide-languages)');
    await expect(switcher).toBeVisible();
  });

  test('should show all 10 languages in dropdown', async ({ page }) => {
    await loginToDashboard(page);
    const switcher = page.locator('button:has(svg.lucide-languages)');
    await switcher.click();
    
    const dropdown = page.locator('.absolute.right-0.top-full');
    await expect(dropdown).toBeVisible();
    
    // Should have 10 language options
    const options = dropdown.locator('button');
    await expect(options).toHaveCount(10);
    
    // Verify key languages are present
    await expect(dropdown).toContainText('English');
    await expect(dropdown).toContainText('हिन्दी');
    await expect(dropdown).toContainText('தமிழ்');
    await expect(dropdown).toContainText('বাংলা');
    await expect(dropdown).toContainText('తెలుగు');
  });

  test('should switch sidebar to Hindi', async ({ page }) => {
    await loginToDashboard(page);
    const switcher = page.locator('button:has(svg.lucide-languages)');
    await switcher.click();
    
    // Click Hindi
    await page.locator('button:has-text("हिन्दी")').click();
    
    // Wait for re-render
    await page.waitForTimeout(1000);
    
    // Sidebar should now have Hindi text
    const sidebar = page.locator('aside');
    await expect(sidebar).toContainText('प्रबंधन'); // Management
    await expect(sidebar).toContainText('अवलोकन'); // Overview
    await expect(sidebar).toContainText('बुकिंग'); // Bookings
    await expect(sidebar).toContainText('लॉग आउट'); // Log out
  });

  test('should persist language across page refresh', async ({ page }) => {
    await loginToDashboard(page);
    
    // Switch to Tamil
    const switcher = page.locator('button:has(svg.lucide-languages)');
    await switcher.click();
    await page.locator('button:has-text("தமிழ்")').click();
    await page.waitForTimeout(1000);
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('aside');
    
    // Sidebar should still be in Tamil
    const sidebar = page.locator('aside');
    await expect(sidebar).toContainText('மேலாண்மை'); // Management
  });

  test('should be accessible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginToDashboard(page);
    
    // Language switcher should still be visible on mobile
    const switcher = page.locator('button:has(svg.lucide-languages)');
    await expect(switcher).toBeVisible();
    
    await switcher.click();
    const dropdown = page.locator('.absolute.right-0.top-full');
    await expect(dropdown).toBeVisible();
  });

  test('should switch back to English', async ({ page }) => {
    await loginToDashboard(page);
    
    // Switch to Bengali first
    const switcher = page.locator('button:has(svg.lucide-languages)');
    await switcher.click();
    await page.locator('button:has-text("বাংলা")').click();
    await page.waitForTimeout(1000);
    
    // Switch back to English
    await switcher.click();
    await page.locator('button:has-text("English")').click();
    await page.waitForTimeout(1000);
    
    // Verify English labels
    const sidebar = page.locator('aside');
    await expect(sidebar).toContainText('Management');
    await expect(sidebar).toContainText('Overview');
    await expect(sidebar).toContainText('Log out');
  });
});
