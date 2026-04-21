import { test, expect } from '@playwright/test';

test.describe('PWA Capabilities', () => {
  test('Manifest should be available and valid', async ({ request }) => {
    const response = await request.get('http://localhost:3100/manifest.json');
    expect(response.ok()).toBeTruthy();
    
    const manifest = await response.json();
    expect(manifest.name).toBe('iStays Staff');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('Layout should contain PWA meta tags and theme coloring', async ({ page }) => {
    await page.goto('http://localhost:3100/login');
    
    // Check for viewport theme configuration matching Apple status bar specs
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#09090b');

    // Apple web app capability
    const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(appleCapable).toBe('yes');
  });
});
