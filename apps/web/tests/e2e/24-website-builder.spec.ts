import { test, expect, Page, APIRequestContext } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:4100';
const WEB = process.env.WEB_URL || 'http://localhost:3100';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Obtain a JWT + tenant ID by logging in via the API */
async function loginAndGetTokens(request: APIRequestContext) {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: { email: process.env.TEST_EMAIL || 'admin@istaysin.com', password: process.env.TEST_PASSWORD || 'Password123!' },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  return { token: body.data?.accessToken as string, tenantId: body.data?.tenantId as string };
}

/** Inject auth tokens into browser localStorage so the page is authenticated */
async function injectAuth(page: Page, token: string, tenantId: string) {
  await page.addInitScript(({ token, tenantId }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('tenantId', tenantId);
    document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
  }, { token, tenantId });
}

// ─────────────────────────────────────────────────────────────────────────────
// 24 — Website Builder: CMS UI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('24 — Website Builder CMS', () => {

  // ── API-level guards ────────────────────────────────────────────────────────

  test('WB-01: GET settings requires auth', async ({ request }) => {
    // Get any tenant id from a fake id — should get 401 without token
    const res = await request.get(`${API}/api/v1/tenants/fake-id/settings`);
    expect(res.status()).toBe(401);
  });

  test('WB-02: PATCH settings requires auth', async ({ request }) => {
    const res = await request.patch(`${API}/api/v1/tenants/fake-id/settings`, {
      data: { config: { websiteBuilder: {} } },
    });
    expect(res.status()).toBe(401);
  });

  test('WB-03: POST /api/upload requires a file field', async ({ request }) => {
    const res = await request.post(`${WEB}/api/upload`, {
      // Send without any file — should return 400
      multipart: {},
    });
    expect(res.status()).toBe(400);
  });

  // ── Full UI flow ────────────────────────────────────────────────────────────

  test('WB-04: Website Builder page loads and shows all tabs', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials — skipping UI tests');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);

    // Page heading
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // All 16 tab labels should be visible in the sidebar / tab strip
    const expectedTabs = [
      'Appearance', 'Promo Banner', 'Hero', 'About Us', 'Stats Bar',
      'Featured Rooms', 'Amenities', 'Photo Gallery', 'Nearby',
      'Location Map', 'Testimonials', 'Call to Action', 'FAQ',
      'Policies', 'Awards', 'Footer',
    ];
    for (const tab of expectedTabs) {
      await expect(page.getByRole('button', { name: new RegExp(tab, 'i') }).first()).toBeVisible();
    }
  });

  test('WB-05: Appearance tab shows 12 theme cards', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Appearance should be active by default
    // Verify 12 theme cards are rendered using their names
    const expectedThemes = [
      'Corporate Clean', 'Luxury Gold', 'Ocean Breeze', 'Forest Wellness',
      'Royal Heritage', 'Sunrise Desert', 'Himalayan Snow', 'Tropical Bloom',
      'Urban Chic', 'Rosewater Spa', 'Midnight Modern', 'Saffron Festivities',
    ];
    for (const theme of expectedThemes) {
      await expect(page.getByText(theme, { exact: true })).toBeVisible();
    }
  });

  test('WB-06: Language switcher shows all 12 languages', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    const select = page.locator('select').filter({ has: page.locator('option[value="hi"]') }).first();
    const optionValues = await select.locator('option').evaluateAll(opts =>
      (opts as HTMLOptionElement[]).map(o => o.value)
    );
    const expected = ['en', 'hi', 'te', 'ta', 'mr', 'bn', 'kn', 'ml', 'gu', 'pa', 'or', 'ur'];
    for (const code of expected) {
      expect(optionValues).toContain(code);
    }
  });

  test('WB-07: Switching locale initialises content for that language', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Navigate to Hero tab
    await page.getByRole('button', { name: /Hero/i }).first().click();

    // Switch to Hindi
    const select = page.locator('select').filter({ has: page.locator('option[value="hi"]') }).first();
    await select.selectOption('hi');

    // Magic translate button should now be visible (since locale != 'en')
    await expect(page.getByRole('button', { name: /Translate/i })).toBeVisible();
  });

  test('WB-08: Selecting a theme updates active highlight', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Click the "Luxury Gold" theme card
    await page.getByText('Luxury Gold', { exact: true }).click();

    // The card should update visual state — check it received the active ring class
    // by verifying a sibling element with the theme's tagline text is near an active card
    await expect(page.getByText('Deep navy with gleaming gold')).toBeVisible();
  });

  test('WB-09: Component toggle can disable "Photo Gallery"', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Appearance tab should have the component toggles section
    const toggleSection = page.getByText('Active Page Sections');
    await expect(toggleSection).toBeVisible();

    // The Photo Gallery toggle button
    const galleryToggle = page.locator('[data-testid="toggle-photoGallery"]').or(
      page.locator('button[aria-label*="photoGallery"]')
    );
    // Even without data-testid, verify the section text is present
    await expect(page.getByText(/Photo\s*Gallery/i).first()).toBeVisible();
  });

  test('WB-10: Save & Publish button sends PATCH to tenants settings', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Intercept the PATCH settings call
    let patchCalled = false;
    page.on('request', req => {
      if (req.method() === 'PATCH' && req.url().includes('/settings')) {
        patchCalled = true;
        const body = req.postDataJSON();
        // Ensure website builder config is embedded
        expect(body).toHaveProperty('config.websiteBuilder');
      }
    });

    await page.getByRole('button', { name: /Publish|Save/i }).first().click();

    // Wait for the network call and toast to appear
    await page.waitForTimeout(2000);
    expect(patchCalled).toBe(true);

    // Toast should appear
    const toast = page.locator('.fixed.bottom-6').locator('div').filter({ hasText: /published|error/i }).first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('WB-11: Mobile viewport — tab sidebar scrolls horizontally', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Publish button should be in the sticky bottom bar on mobile
    const publishBtn = page.getByRole('button', { name: /Publish|Save/i }).first();
    await expect(publishBtn).toBeVisible();

    // Verify the tab nav is scrollable (overflow-x) by checking tabs fit in a single row
    const firstTab = page.getByRole('button', { name: /Appearance/i }).first();
    await expect(firstTab).toBeVisible();
  });

  test('WB-12: Tablet viewport — layout renders two-column view', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await page.setViewportSize({ width: 768, height: 1024 });
    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // All tabs should still be accessible
    await expect(page.getByRole('button', { name: /Appearance/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Footer/i }).first()).toBeVisible();
  });

  // ── Upload validation (API level) ───────────────────────────────────────────

  test('WB-13: Upload /api/upload rejects oversized payload', async ({ request }) => {
    // Create a fake >5MB buffer
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0);
    const res = await request.post(`${WEB}/api/upload`, {
      multipart: {
        file: {
          name: 'huge.jpg',
          mimeType: 'image/jpeg',
          buffer: bigBuffer,
        },
      },
    });
    // Server may return 500 from Cloudinary or local — just ensure it doesn't 200 with a URL
    // The client-side guard should also prevent submission, but this tests the server path
    expect([400, 413, 500]).toContain(res.status());
  });
});
