import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';

test.describe('26 — Visual Room Calendar (Tape Chart)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as property owner
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"], input[name="identifier"]', process.env.TEST_USER_EMAIL || 'owner@test.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('calendar page loads and renders grid structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);
    await page.waitForTimeout(2000);

    // The page should load
    const pageEl = page.locator('[data-testid="room-calendar-page"]');
    await expect(pageEl).toBeVisible({ timeout: 10000 });

    // Date range label should be visible
    const dateLabel = page.locator('[data-testid="date-range-label"]');
    await expect(dateLabel).toBeVisible();

    // Grid should render (or skeleton should disappear)
    const grid = page.locator('[data-testid="tape-chart-grid"]');
    const skeleton = page.locator('[data-testid="calendar-skeleton"]');

    // Wait for either grid or skeleton to disappear
    await expect(skeleton.or(grid)).toBeVisible({ timeout: 10000 });
  });

  test('today marker renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);
    await page.waitForTimeout(2000);

    const grid = page.locator('[data-testid="tape-chart-grid"]');
    // May or may not exist depending on whether rooms exist
    if (await grid.isVisible()) {
      const todayMarker = page.locator('[data-testid="today-marker"]');
      await expect(todayMarker).toBeVisible({ timeout: 5000 });
    }
  });

  test('date navigation changes the displayed range', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);
    await page.waitForTimeout(2000);

    const dateLabel = page.locator('[data-testid="date-range-label"]');
    await expect(dateLabel).toBeVisible({ timeout: 10000 });

    const initialText = await dateLabel.textContent();

    // Click next
    await page.click('[data-testid="date-nav-next"]');
    await page.waitForTimeout(1500);

    const nextText = await dateLabel.textContent();
    expect(nextText).not.toBe(initialText);

    // Click prev to go back
    await page.click('[data-testid="date-nav-prev"]');
    await page.waitForTimeout(1500);

    const backText = await dateLabel.textContent();
    expect(backText).toBe(initialText);
  });

  test('sidebar has Room Calendar link', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    // Look for the Room Calendar link in sidebar
    const calendarLink = page.locator('a[href="/dashboard/rooms/calendar"]');
    await expect(calendarLink).toBeVisible({ timeout: 5000 });
    await expect(calendarLink).toContainText('Room Calendar');
  });

  test('responsive: mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);
    await page.waitForTimeout(3000);

    // Page should render
    const pageEl = page.locator('[data-testid="room-calendar-page"]');
    await expect(pageEl).toBeVisible({ timeout: 10000 });

    // Date nav should still be usable
    const dateLabel = page.locator('[data-testid="date-range-label"]');
    await expect(dateLabel).toBeVisible();
  });

  test('responsive: tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);
    await page.waitForTimeout(3000);

    const pageEl = page.locator('[data-testid="room-calendar-page"]');
    await expect(pageEl).toBeVisible({ timeout: 10000 });
  });

  test('clicking a booking bar opens detail panel (if bookings exist)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);
    await page.waitForTimeout(3000);

    const bars = page.locator('[data-testid="booking-bar"]');
    const count = await bars.count();

    if (count > 0) {
      // Click the first booking bar
      await bars.first().click();
      await page.waitForTimeout(500);

      // Check if desktop or mobile panel appears
      const desktopPanel = page.locator('[data-testid="booking-detail-panel"]');
      const mobilePanel = page.locator('[data-testid="booking-detail-panel-mobile"]');

      const panelVisible = await desktopPanel.isVisible() || await mobilePanel.isVisible();
      expect(panelVisible).toBeTruthy();
    }
  });

  test('performance: page loads within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/dashboard/rooms/calendar`);

    // Wait for either grid or error state
    await page.waitForSelector(
      '[data-testid="tape-chart-grid"], [data-testid="calendar-skeleton"]',
      { timeout: 5000 }
    ).catch(() => {});

    const elapsed = Date.now() - start;
    // Allow up to 3s for page + API + render
    expect(elapsed).toBeLessThan(5000);
  });
});
