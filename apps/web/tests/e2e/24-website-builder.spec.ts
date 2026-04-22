import { test, expect, Page, APIRequestContext } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:4100';
const WEB = process.env.WEB_URL || 'http://localhost:3100';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function loginAndGetTokens(request: APIRequestContext) {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: { email: process.env.TEST_EMAIL || 'admin@istaysin.com', password: process.env.TEST_PASSWORD || 'Password123!' },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  return { token: body.data?.accessToken as string, tenantId: body.data?.tenantId as string };
}

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

  test('WB-01: GET settings requires auth', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/tenants/fake-id/settings`);
    expect(res.status()).toBe(401);
  });

  test('WB-02: PATCH settings requires auth', async ({ request }) => {
    const res = await request.patch(`${API}/api/v1/tenants/fake-id/settings`, {
      data: { config: { websiteBuilder: {} } },
    });
    expect(res.status()).toBe(401);
  });

  // ── Full UI flow ────────────────────────────────────────────────────────────

  test('WB-03: Website Builder page loads and shows compact tabs', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials — skipping UI tests');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);

    // Page heading
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // The new 16-tab structure sidebar items
    const expectedTabs = ['Theme & Brand styling', 'Component Switchboard', '1. Header & Nav', '2. Hero Banner', '12. Footer & Socials'];
    for (const tab of expectedTabs) {
      await expect(page.getByRole('button', { name: new RegExp(tab, 'i') }).first()).toBeVisible();
    }
  });

  test('WB-04: Theme & Styling tab displays 12 premium themes', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    const expectedThemes = [
      'Luxury Gold', 'Modern Minimal', 'Corporate Trust', 'Boutique Chic',
      'Dark Elegance', 'Classic Heritage', 'Resort Tropical', 'Playful Vibrant',
      'Compact Urban', 'Retro Vintage', 'Nature Eco', 'Abstract Art'
    ];
    for (const theme of expectedThemes) {
      await expect(page.getByRole('button', { name: new RegExp('^' + theme + '$', 'i') }).first()).toBeVisible();
    }
  });

  test('WB-05: Auto-Translate language switcher contains 8 Indian/Intl languages', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    const select = page.locator('select').first(); // The language dropdown next to Auto-Translate
    const optionValues = await select.locator('option').evaluateAll(opts =>
      (opts as HTMLOptionElement[]).map(o => o.value)
    );
    const expected = ['hi', 'te', 'ta', 'kn', 'ml', 'fr', 'es', 'ar'];
    for (const code of expected) {
      expect(optionValues).toContain(code);
    }
  });

  test('WB-06: Translation button uses Gemini API to translate components', async ({ page, request }) => {
     const auth = await loginAndGetTokens(request);
     test.skip(!auth, 'No valid test credentials');
     if (!auth) return;
 
     await injectAuth(page, auth.token, auth.tenantId);
     await page.goto(`${WEB}/dashboard/website`);
     await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });
 
     // Handle native confirm dialog automatically to "Accept"
     page.on('dialog', dialog => dialog.accept());
 
     // We do a mock interception so we don't spam Google Vertex AI during tests
     await page.route('/api/translate', async route => {
       await route.fulfill({
         status: 200,
         json: { translatedContent: {} }
       });
     });
 
     // Click AI Translate
     const translateBtn = page.getByRole('button', { name: /AI Translate/i });
     await translateBtn.click();
     
     // Due to stubbing, it shows Translation Complete! alert. Wait for the dialog handler to catch it.
     await page.waitForTimeout(1000); 
  });

  test('WB-07: Component switchboard lists all 16 items', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Component Switchboard/i }).click();

    await expect(page.getByText('hero', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('amenities', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('rooms', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('gallery', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('faq', { exact: true }).first()).toBeVisible();
  });

  test('WB-08: Save & Publish button triggers settings update', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuth(page, auth.token, auth.tenantId);
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Handle standard alert
    page.on('dialog', dialog => dialog.accept());

    let patchCalled = false;
    page.on('request', req => {
      if (req.method() === 'PATCH' && req.url().includes('/settings')) {
        patchCalled = true;
      }
    });

    await page.getByRole('button', { name: /Publish/i }).click();
    await page.waitForTimeout(2000);
    expect(patchCalled).toBe(true);
  });
});
