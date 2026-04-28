/**
 * 32-revenue-plan-pricing.spec.ts
 *
 * Verifies that /platform/revenue surfaces the correct expected plan amount:
 *   - Falls back to the global SaaS plan price when no override exists
 *   - Honors per-tenant custom pricing override (config.customPlanPricing)
 *   - Multiplies yearly per-month rate by 12 when the active subscription is yearly
 *   - Flags overridden rows with isCustomPriced = true
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@istays.com';
const ADMIN_PASSWORD = 'Welcome@1';

test.describe('32 — Revenue: plan-aware expected amount', () => {
  let adminToken: string;
  let tenantId: string;
  let originalCustomPricing: any = null;
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

    // Pick the first non-suspended tenant for mutation
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

    const cpRes = await request.get(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const cpBody = await cpRes.json();
    if (cpBody.success) originalCustomPricing = cpBody.data?.customPlanPricing ?? null;
  });

  test.afterAll(async ({ request }) => {
    if (!adminToken || !tenantId) return;
    // Restore original state
    await request.put(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { customPlanPricing: originalCustomPricing },
    });
    if (originalPlan) {
      await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { plan: originalPlan },
      });
    }
  });

  async function fetchRevenueRow(request: any) {
    // Search by the tenant's slug to keep the response small
    const tenantRes = await request.get(`/api/v1/platform/tenants/${tenantId}/detail`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const slug = (await tenantRes.json()).data?.slug;
    expect(slug).toBeTruthy();

    const revRes = await request.get(`/api/v1/platform/revenue?search=${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(revRes.ok()).toBe(true);
    const body = await revRes.json();
    const row = body.data.find((r: any) => r.tenant.id === tenantId);
    expect(row, 'revenue row for tenant should exist').toBeTruthy();
    return row;
  }

  test('falls back to global plan price when no override exists', async ({ request }) => {
    test.skip(!adminToken, 'no auth');

    // Move to the basic plan and clear any custom pricing
    await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plan: 'basic' },
    });
    await request.put(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { customPlanPricing: null },
    });

    // Fetch the canonical basic plan price
    const plansRes = await request.get('/api/v1/platform/plans', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const basicPlan = (await plansRes.json()).data.find((p: any) => p.code === 'basic');
    expect(basicPlan).toBeTruthy();

    const row = await fetchRevenueRow(request);
    expect(row.plan).toBe('basic');
    expect(row.isCustomPriced).toBe(false);

    const expectedFromGlobal =
      row.billingCycle === 'yearly'
        ? Math.round(basicPlan.discountYearly * 12)
        : Math.round(basicPlan.discountMonthly || basicPlan.actualPrice);

    expect(row.expectedAmount).toBe(expectedFromGlobal);
  });

  test('honors per-tenant custom pricing override', async ({ request }) => {
    test.skip(!adminToken, 'no auth');

    const customMonthly = 1234;
    const customYearly = 999; // per-month
    await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plan: 'basic' },
    });
    await request.put(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        customPlanPricing: {
          basic: {
            monthlyPrice: 9999,
            discountedPrice: customMonthly,
            yearlyPrice: customYearly,
            trialDays: 14,
          },
        },
      },
    });

    const row = await fetchRevenueRow(request);
    expect(row.isCustomPriced).toBe(true);
    expect(row.effectiveMonthly).toBe(customMonthly);
    expect(row.effectiveYearlyPerMonth).toBe(customYearly);

    if (row.billingCycle === 'yearly') {
      expect(row.expectedAmount).toBe(customYearly * 12);
    } else {
      expect(row.expectedAmount).toBe(customMonthly);
    }
  });
});
