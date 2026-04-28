/**
 * 31-admin-change-plan.spec.ts
 *
 * Verifies the new admin "Change Plan" feature on /admin/tenants/[id]:
 *   - PATCH /platform/tenants/:id/plan validates the plan code
 *   - tenant.plan field updates and is reflected in subsequent reads
 *   - active Subscription row is mirrored onto the new plan
 *   - the dropdown + button are present on the admin tenant detail page
 *
 * API-first to avoid UI flake; UI test asserts the controls render only.
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@istays.com';
const ADMIN_PASSWORD = 'Welcome@1';

test.describe('31 — Admin: change tenant plan', () => {
  let adminToken: string;
  let tenantId: string;
  let originalPlan: string;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data?.user?.isGlobalAdmin) {
      test.skip(true, 'global admin not seeded — skipping');
      return;
    }
    adminToken = loginData.data.accessToken;

    // Pick the first tenant to mutate
    const tenantsRes = await request.get('/api/v1/platform/tenants?limit=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tenantsData = await tenantsRes.json();
    if (!tenantsData.success || tenantsData.data.length === 0) {
      test.skip(true, 'no tenants available');
      return;
    }
    tenantId = tenantsData.data[0].id;
    originalPlan = tenantsData.data[0].plan;
  });

  test.afterAll(async ({ request }) => {
    if (!adminToken || !tenantId || !originalPlan) return;
    await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plan: originalPlan },
    });
  });

  test('rejects unknown plan codes', async ({ request }) => {
    test.skip(!adminToken, 'no auth');
    const res = await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plan: 'nonexistent_plan_xyz' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Unknown plan code/i);
  });

  test('rejects empty plan body', async ({ request }) => {
    test.skip(!adminToken, 'no auth');
    const res = await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('changes tenant plan and mirrors onto active subscription', async ({ request }) => {
    test.skip(!adminToken, 'no auth');

    const targetPlan = originalPlan === 'enterprise' ? 'professional' : 'enterprise';

    const patchRes = await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plan: targetPlan },
    });
    expect(patchRes.ok()).toBe(true);
    const patchBody = await patchRes.json();
    expect(patchBody.success).toBe(true);
    expect(patchBody.data.plan).toBe(targetPlan);

    // Verify via tenant detail
    const detailRes = await request.get(`/api/v1/platform/tenants/${tenantId}/detail`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailBody = await detailRes.json();
    expect(detailBody.success).toBe(true);
    expect(detailBody.data.plan).toBe(targetPlan);

    // Active subscription (if any) should match the new plan
    const activeSub = (detailBody.data.subscriptions || []).find((s: any) => s.status === 'active');
    if (activeSub) {
      expect(activeSub.plan).toBe(targetPlan);
    }
  });

  test('UI: admin tenant detail shows the plan select + change button', async ({ page }) => {
    test.skip(!adminToken, 'no auth');

    await page.addInitScript((tok: string) => {
      localStorage.setItem('accessToken', tok);
    }, adminToken);
    await page.context().addCookies([
      { name: 'accessToken', value: adminToken, url: 'http://localhost:3100' },
    ]);

    await page.goto(`/admin/tenants/${tenantId}`);
    // The plan section label is an h3 (uppercase label, not a page heading)
    await expect(page.locator('text=SUBSCRIPTION PLAN').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#plan-select')).toBeVisible();
    await expect(page.getByRole('button', { name: /Change Plan/i })).toBeVisible();
    // Preview Dashboard button should also be present
    await expect(page.getByRole('button', { name: /Preview Dashboard/i })).toBeVisible();
  });
});
