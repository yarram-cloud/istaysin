import { test, expect } from '@playwright/test';

const SLUG = 'premium-resort-pro';
const PUBLIC_URL = `http://localhost:3100/en/${SLUG}`;
const OWNER_EMAIL = 'owner-premium@e2e.com';
const PASSWORD = 'Welcome@1';

test.describe('Book Direct & Save Rate Comparison Widget', () => {
  // Enable competitor rates once before all tests in this file
  test.beforeAll(async ({ request }) => {
    // Get the tenant ID and first room type from the public property endpoint
    const propRes = await request.get(`/api/v1/public/properties/${SLUG}`);
    const propData = await propRes.json();
    const tenantId: string = propData.data?.id;
    const firstRoomTypeId: string = propData.data?.roomTypes?.[0]?.id;
    if (!tenantId || !firstRoomTypeId) return;

    // Authenticate as property owner
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: OWNER_EMAIL, password: PASSWORD }
    });
    const loginData = await loginRes.json();
    const token: string = loginData.data?.accessToken;
    if (!token) return;

    // Enable competitor rates with test data
    await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
      data: {
        competitorRates: {
          enabled: true,
          lastUpdated: new Date().toISOString(),
          rates: {
            [firstRoomTypeId]: {
              'Booking.com': 4200,
              'MakeMyTrip': 4000,
            }
          }
        }
      }
    });
  });

  test('Widget renders on public page with OTA rates and direct price', async ({ page }) => {
    await page.goto(PUBLIC_URL);
    const widget = page.locator('[data-testid="rate-comparison-widget"]');

    await expect(widget).toBeVisible();
    await expect(widget.locator('text=Booking.com')).toBeVisible();
    await expect(widget.locator('text=MakeMyTrip')).toBeVisible();
    await expect(widget.locator('text=Book Direct')).toBeVisible();
  });

  test('Savings badge is displayed when direct rate is lower than OTA rates', async ({ page }) => {
    await page.goto(PUBLIC_URL);
    const widget = page.locator('[data-testid="rate-comparison-widget"]');
    await expect(widget).toBeVisible();

    // Direct rate (₹2,500) is lower than min OTA rate (₹4,000) → savings badge shown
    await expect(widget.locator('text=You Save')).toBeVisible();
  });

  test('Why Book Direct? accordion expands to show all benefit items', async ({ page }) => {
    await page.goto(PUBLIC_URL);
    await expect(page.locator('[data-testid="rate-comparison-widget"]')).toBeVisible();

    const accordion = page.getByRole('button', { name: /Why Book Direct/i });
    await expect(accordion).toBeVisible();

    // Accordion starts collapsed
    await expect(page.locator('text=Best Rate Guarantee')).not.toBeVisible();

    // Click to open
    await accordion.click();
    await expect(page.locator('text=Best Rate Guarantee')).toBeVisible();

    // Click again to close
    await accordion.click();
    await expect(page.locator('text=Best Rate Guarantee')).not.toBeVisible();
  });

  test('Widget is responsive and renders within 375px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PUBLIC_URL);

    const widget = page.locator('[data-testid="rate-comparison-widget"]');
    await expect(widget).toBeVisible();

    const box = await widget.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);

    // Accordion button meets minimum 44px touch target
    const accordionBtn = page.getByRole('button', { name: /Why Book Direct/i });
    await expect(accordionBtn).toBeVisible();
    const btnBox = await accordionBtn.boundingBox();
    expect(btnBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Widget is not shown when competitor rates are disabled', async ({ page, request }) => {
    // Get tenant + auth
    const propRes = await request.get(`/api/v1/public/properties/${SLUG}`);
    const { data: property } = await propRes.json();
    const tenantId: string = property?.id;

    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: OWNER_EMAIL, password: PASSWORD }
    });
    const { data: authData } = await loginRes.json();
    const token: string = authData?.accessToken;

    // Disable the widget
    await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
      data: { competitorRates: { enabled: false, rates: {}, lastUpdated: new Date().toISOString() } }
    });

    await page.goto(PUBLIC_URL);
    await expect(page.locator('[data-testid="rate-comparison-widget"]')).not.toBeVisible({ timeout: 10000 });

    // Re-enable for subsequent test runs
    const firstRoomTypeId: string = property?.roomTypes?.[0]?.id;
    if (firstRoomTypeId) {
      await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
        data: {
          competitorRates: {
            enabled: true,
            lastUpdated: new Date().toISOString(),
            rates: { [firstRoomTypeId]: { 'Booking.com': 4200, 'MakeMyTrip': 4000 } }
          }
        }
      });
    }
  });
});
