import { test, expect } from '@playwright/test';

test.describe('Global Admin Platform Security Constraints', () => {
  let superadminToken: string;

  test.beforeEach(async ({ request }) => {
    // We assume a global superadmin exists in the system seeded in '01-auth-flows.spec.ts'
    // Let's retrieve a token for it, or use the regular admin to verify they CANNOT access Global Routes
    const loginRes = await request.post('/api/v1/auth/login', {
      data: {
        identifier: 'owner-premium@e2e.com', // 'premium-resort-pro' local admin
        password: 'Welcome@1',
      }
    });
    const loginData = await loginRes.json();
    superadminToken = loginData.data.accessToken;
  });

  test('Local Admins are strictly forbidden from accessing /platform routes (Cross-Tenant RLS Test)', async ({ request }) => {
    // 1. Attempt to hit the Global Platform endpoint
    // The route `GET /api/v1/platform/tenants` lists ALL hotels in the system.
    // It requires `global_admin` role.
    const res = await request.get('/api/v1/platform/tenants', {
      headers: { 'Authorization': `Bearer ${superadminToken}` }
    });

    // 2. Assure RBAC stops them
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Global admin access required');
    
    // 3. Assure they cannot forcefully change another Property's status 
    const restrictRes = await request.patch(`/api/v1/platform/tenants/invalid-mock-123/status`, {
      headers: { 'Authorization': `Bearer ${superadminToken}` },
      data: { status: 'suspended' }
    });
    
    // RBAC should fire before it even reaches the route logic
    expect(restrictRes.status()).toBe(403);
  });
});
