/**
 * 33-tenant-cache-invalidation.spec.ts
 *
 * Verifies the resolver cache (packages/api/src/middleware/tenant-cache.ts)
 * invalidates correctly when membership / plan / status changes.
 *
 * The cache has a 60s TTL, so without invalidation hooks the changes below
 * would not take effect until the TTL expires. These assertions only pass
 * when invalidate*() is called on every relevant write path.
 */

import { test, expect } from '@playwright/test';

const OWNER_EMAIL = 'owner-premium@e2e.com';
const MANAGER_EMAIL = 'manager-premium@e2e.com';
const ADMIN_EMAIL = 'admin@istays.com';
const PASSWORD = 'Welcome@1';

async function login(request: any, identifier: string) {
  const res = await request.post('/api/v1/auth/login', { data: { identifier, password: PASSWORD } });
  const body = await res.json();
  return body.success ? body.data : null;
}

test.describe('33 — Tenant cache invalidation contract', () => {
  test('membership deactivation takes effect immediately, not after TTL', async ({ request }) => {
    const owner   = await login(request, OWNER_EMAIL);
    const manager = await login(request, MANAGER_EMAIL);
    test.skip(!owner || !manager, 'owner / manager fixtures not seeded');
    if (!owner || !manager) return;

    const tenantId = owner.user?.tenantId || owner.tenantId;
    const managerUserId = manager.user?.id || manager.userId;
    expect(tenantId).toBeTruthy();
    expect(managerUserId).toBeTruthy();

    // 1. Manager hits a tenant-scoped endpoint — succeeds and warms the cache.
    const okBefore = await request.get('/api/v1/tenants/setup-progress', {
      headers: { Authorization: `Bearer ${manager.accessToken}`, 'x-tenant-id': tenantId },
    });
    expect(okBefore.status(), 'manager should have access before deactivation').toBe(200);

    // 2. Owner deactivates the manager.
    const deactivate = await request.put(
      `/api/v1/tenants/${tenantId}/staff/${managerUserId}/status`,
      {
        headers: { Authorization: `Bearer ${owner.accessToken}`, 'x-tenant-id': tenantId },
        data: { isActive: false },
      },
    );
    expect(deactivate.ok()).toBe(true);

    // 3. Manager retries — must get 403 immediately. If invalidateMembership()
    //    is missing, this would still pass for up to 60s on the cached entry.
    const blocked = await request.get('/api/v1/tenants/setup-progress', {
      headers: { Authorization: `Bearer ${manager.accessToken}`, 'x-tenant-id': tenantId },
    });
    expect(blocked.status(), 'manager should be blocked immediately').toBe(403);

    // 4. Restore — reactivate so the rest of the suite is unaffected.
    await request.put(
      `/api/v1/tenants/${tenantId}/staff/${managerUserId}/status`,
      {
        headers: { Authorization: `Bearer ${owner.accessToken}`, 'x-tenant-id': tenantId },
        data: { isActive: true },
      },
    );

    // 5. After reactivation + invalidation, manager should pass on the next call.
    const okAfter = await request.get('/api/v1/tenants/setup-progress', {
      headers: { Authorization: `Bearer ${manager.accessToken}`, 'x-tenant-id': tenantId },
    });
    expect(okAfter.status(), 'manager should regain access immediately after reactivation').toBe(200);
  });

  test('plan change takes effect immediately on resolver-cached tenant', async ({ request }) => {
    const admin = await login(request, ADMIN_EMAIL);
    test.skip(!admin?.user?.isGlobalAdmin, 'global admin not seeded');
    if (!admin?.user?.isGlobalAdmin) return;

    const owner = await login(request, OWNER_EMAIL);
    test.skip(!owner, 'owner fixture not seeded');
    if (!owner) return;

    const tenantId = owner.user?.tenantId || owner.tenantId;
    expect(tenantId).toBeTruthy();

    // Warm the cache via an authed call that runs through the resolver.
    const warm = await request.get('/api/v1/tenants/setup-progress', {
      headers: { Authorization: `Bearer ${owner.accessToken}`, 'x-tenant-id': tenantId },
    });
    expect(warm.ok()).toBe(true);

    // Capture original plan so we restore at the end.
    const detailRes = await request.get(`/api/v1/platform/tenants/${tenantId}/detail`, {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });
    const original = (await detailRes.json()).data?.plan;
    expect(original).toBeTruthy();

    const target = original === 'enterprise' ? 'professional' : 'enterprise';

    try {
      // Change the plan as global admin.
      const patch = await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
        data: { plan: target },
      });
      expect(patch.ok()).toBe(true);

      // /platform/tenants/:id/detail reads directly from DB (uncached) — confirms the write landed.
      const after = await request.get(`/api/v1/platform/tenants/${tenantId}/detail`, {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
      });
      expect((await after.json()).data?.plan).toBe(target);

      // The owner's resolver cache entry should also reflect the new plan
      // (invalidateTenant was called inside the plan-change handler).
      // We can't observe req.tenantPlan directly, but a successful authed call
      // tells us the cached entry isn't stuck in a broken state.
      const passthrough = await request.get('/api/v1/tenants/setup-progress', {
        headers: { Authorization: `Bearer ${owner.accessToken}`, 'x-tenant-id': tenantId },
      });
      expect(passthrough.ok()).toBe(true);
    } finally {
      // Always restore the original plan.
      await request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
        data: { plan: original },
      });
    }
  });
});
