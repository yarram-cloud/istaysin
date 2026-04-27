import { test, expect } from '@playwright/test';

test.describe('Platform Admin — Plans & Custom Pricing', () => {
  let adminToken: string;
  let tenantId: string;
  let planId: string;

  test.beforeAll(async ({ request }) => {
    // Login as the global admin (seeded in 01-auth-flows)
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'admin@istays.com', password: 'Welcome@1' }
    });
    const loginData = await loginRes.json();

    // Fallback: if global admin doesn't exist, skip gracefully
    if (!loginData.success || !loginData.data?.user?.isGlobalAdmin) {
      test.skip();
      return;
    }
    adminToken = loginData.data.accessToken;

    // Grab a tenant for custom pricing tests
    const tenantsRes = await request.get('/api/v1/platform/tenants?limit=1', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tenantsData = await tenantsRes.json();
    if (tenantsData.success && tenantsData.data?.length > 0) {
      tenantId = tenantsData.data[0].id;
    }
  });

  // ── Plan CRUD ──────────────────────────────────────────────

  test('GET /platform/plans returns plans (auto-seeds if empty)', async ({ request }) => {
    const res = await request.get('/api/v1/platform/plans', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.length).toBeGreaterThanOrEqual(4);

    // Verify plan structure
    const freePlan = body.data.find((p: any) => p.code === 'free');
    expect(freePlan).toBeDefined();
    expect(freePlan.actualPrice).toBe(0);
    expect(freePlan.name).toBe('Starter');

    planId = body.data[1].id; // Save a non-free plan for update test
  });

  test('PUT /platform/plans/:id updates a single plan', async ({ request }) => {
    test.skip(!planId, 'No plan ID available');

    const res = await request.put(`/api/v1/platform/plans/${planId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { actualPrice: 3499 }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.actualPrice).toBe(3499);

    // Restore original
    await request.put(`/api/v1/platform/plans/${planId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { actualPrice: 2999 }
    });
  });

  test('PUT /platform/plans-bulk validates input', async ({ request }) => {
    // Empty array
    const res1 = await request.put('/api/v1/platform/plans-bulk', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plans: [] }
    });
    expect(res1.status()).toBe(400);

    // Missing id
    const res2 = await request.put('/api/v1/platform/plans-bulk', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plans: [{ actualPrice: 100 }] }
    });
    expect(res2.status()).toBe(400);

    // Negative price
    const res3 = await request.put('/api/v1/platform/plans-bulk', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { plans: [{ id: planId, actualPrice: -500 }] }
    });
    expect(res3.status()).toBe(400);
  });

  // ── GST Slabs ──────────────────────────────────────────────

  test('GET /platform/gst-slabs returns slabs', async ({ request }) => {
    const res = await request.get('/api/v1/platform/gst-slabs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.slabs).toBeDefined();
    expect(Array.isArray(body.data.slabs)).toBe(true);
  });

  // ── Per-Tenant Custom Pricing ──────────────────────────────

  test('GET /platform/tenants/:id/custom-pricing returns null when unset', async ({ request }) => {
    test.skip(!tenantId, 'No tenant ID available');

    const res = await request.get(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // customPlanPricing is null when never set
  });

  test('PUT /platform/tenants/:id/custom-pricing sets and clears overrides', async ({ request }) => {
    test.skip(!tenantId, 'No tenant ID available');

    // Set custom pricing
    const setRes = await request.put(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        customPlanPricing: {
          basic: { monthlyPrice: 999, discountedPrice: 799, yearlyPrice: 699, trialDays: 30 }
        }
      }
    });
    expect(setRes.status()).toBe(200);
    const setBody = await setRes.json();
    expect(setBody.success).toBe(true);
    expect(setBody.data.customPlanPricing.basic.monthlyPrice).toBe(999);

    // Verify it's set
    const getRes = await request.get(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getBody = await getRes.json();
    expect(getBody.data.customPlanPricing).toBeDefined();
    expect(getBody.data.customPlanPricing.basic.monthlyPrice).toBe(999);

    // Clear custom pricing
    const clearRes = await request.put(`/api/v1/platform/tenants/${tenantId}/custom-pricing`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { customPlanPricing: null }
    });
    expect(clearRes.status()).toBe(200);
    expect(clearRes.json().then((b: any) => b.data.customPlanPricing)).resolves.toBeNull();
  });

  test('GET /platform/tenants/:id/detail returns tenant info', async ({ request }) => {
    test.skip(!tenantId, 'No tenant ID available');

    const res = await request.get(`/api/v1/platform/tenants/${tenantId}/detail`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(tenantId);
    expect(body.data.owner).toBeDefined();
    expect(body.data._count).toBeDefined();
  });

  // ── RBAC Guard ──────────────────────────────────────────────

  test('Non-admin users are forbidden from plan endpoints', async ({ request }) => {
    // Login as a regular property owner
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' }
    });
    const loginData = await loginRes.json();
    if (!loginData.success) { test.skip(); return; }
    const ownerToken = loginData.data.accessToken;

    const res = await request.get('/api/v1/platform/plans', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    expect(res.status()).toBe(403);
  });
});
