import { test, expect, Page, APIRequestContext } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:4100';
const WEB = process.env.WEB_URL || 'http://localhost:3100';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function loginAndGetTokens(request: APIRequestContext) {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: {
      email: process.env.TEST_EMAIL || 'admin@istaysin.com',
      password: process.env.TEST_PASSWORD || 'Password123!',
    },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  return { token: body.data?.accessToken as string, tenantId: body.data?.tenantId as string };
}

/** Injects auth AND plan into localStorage so PlanGate reads the correct tier */
async function injectAuthWithPlan(page: Page, token: string, tenantId: string, plan: string) {
  await page.addInitScript(({ token, tenantId, plan }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('memberships', JSON.stringify([
      { tenant: { id: tenantId, plan } }
    ]));
    document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
  }, { token, tenantId, plan });
}

// ─────────────────────────────────────────────────────────────────────────────
// 34 — Plan Gate Feature Gating
// ─────────────────────────────────────────────────────────────────────────────

test.describe('34 — Plan Gate Feature Gating', () => {

  // ── Upgrade wall: Free user on gated page ──────────────────────────────────

  test('PG-01: Free user sees upgrade wall on Analytics', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'free');
    await page.goto(`${WEB}/dashboard/analytics`);

    // Should render upgrade wall, not analytics content
    await expect(page.getByText('Upgrade to Starter', { exact: false })).toBeVisible({ timeout: 8000 });
    // Should NOT show stat cards
    await expect(page.getByText('Occupancy Rate', { exact: false })).not.toBeVisible();
  });

  test('PG-02: Free user sees upgrade wall on Website Builder', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'free');
    await page.goto(`${WEB}/dashboard/website`);

    await expect(page.getByText('Upgrade to Starter', { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('PG-03: Free user sees upgrade wall on Coupons', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'free');
    await page.goto(`${WEB}/dashboard/coupons`);

    await expect(page.getByText('Upgrade to Starter', { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('PG-04: Free user sees upgrade wall on Channel Manager', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'free');
    await page.goto(`${WEB}/dashboard/channels`);

    await expect(page.getByText('Upgrade to Enterprise', { exact: false })).toBeVisible({ timeout: 8000 });
  });

  // ── Starter (basic) plan access ───────────────────────────────────────────

  test('PG-05: Starter user sees analytics stat cards (no charts)', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'basic');
    await page.goto(`${WEB}/dashboard/analytics`);

    // Stat cards should be visible
    await expect(page.getByText('Occupancy Rate', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Revenue This Month', { exact: false })).toBeVisible();

    // Upsell banner for charts should appear
    await expect(page.getByText('Unlock Revenue & Booking Source Charts', { exact: false })).toBeVisible();

    // Professional charts should NOT be visible
    await expect(page.getByText('Revenue Summary', { exact: false })).not.toBeVisible();
  });

  test('PG-06: Starter user can access Website Builder', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'basic');
    await page.goto(`${WEB}/dashboard/website`);

    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });
    // Should NOT see upgrade wall
    await expect(page.getByText('Upgrade to Starter', { exact: false })).not.toBeVisible();
  });

  // ── Professional plan access ──────────────────────────────────────────────

  test('PG-07: Professional user sees full analytics with charts', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'professional');
    await page.goto(`${WEB}/dashboard/analytics`);

    // Both stat cards and chart section should be visible
    await expect(page.getByText('Occupancy Rate', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Revenue Summary', { exact: false })).toBeVisible();
    await expect(page.getByText('Booking Sources', { exact: false })).toBeVisible();

    // Upsell banner should NOT appear
    await expect(page.getByText('Unlock Revenue & Booking Source Charts', { exact: false })).not.toBeVisible();
  });

  test('PG-08: Professional user sees upgrade wall on Channel Manager', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'professional');
    await page.goto(`${WEB}/dashboard/channels`);

    await expect(page.getByText('Upgrade to Enterprise', { exact: false })).toBeVisible({ timeout: 8000 });
  });

  // ── Sidebar lock icons ────────────────────────────────────────────────────

  test('PG-09: Free user sees lock icons on premium sidebar items', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'free');
    await page.goto(`${WEB}/dashboard`);

    // Analytics sidebar link should be locked (rendered as button, not <a>)
    await expect(page.waitForTimeout(2000));
    const analyticsLink = page.getByRole('button', { name: /Analytics/i }).first();
    await expect(analyticsLink).toBeVisible({ timeout: 8000 });
  });

  // ── Enterprise-only: Custom Domain tab in Website Builder ─────────────────

  test('PG-10: Starter user sees upgrade wall on Domain tab in Website Builder', async ({ page, request }) => {
    const auth = await loginAndGetTokens(request);
    test.skip(!auth, 'No valid test credentials');
    if (!auth) return;

    await injectAuthWithPlan(page, auth.token, auth.tenantId, 'basic');
    await page.goto(`${WEB}/dashboard/website`);
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible({ timeout: 10000 });

    // Click the Domain tab
    await page.getByRole('button', { name: /20\. Custom Domain/i }).click();
    await expect(page.getByText('Upgrade to Enterprise', { exact: false })).toBeVisible({ timeout: 5000 });
  });
});
