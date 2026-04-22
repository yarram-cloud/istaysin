# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps\e2e\tests\12-platform-admin.spec.ts >> Global Admin Platform Security Constraints >> Local Admins are strictly forbidden from accessing /platform routes (Cross-Tenant RLS Test)
- Location: apps\e2e\tests\12-platform-admin.spec.ts:19:7

# Error details

```
TypeError: apiRequestContext.post: Invalid URL
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Global Admin Platform Security Constraints', () => {
  4  |   let superadminToken: string;
  5  | 
  6  |   test.beforeEach(async ({ request }) => {
  7  |     // We assume a global superadmin exists in the system seeded in '01-auth-flows.spec.ts'
  8  |     // Let's retrieve a token for it, or use the regular admin to verify they CANNOT access Global Routes
> 9  |     const loginRes = await request.post('/api/v1/auth/login', {
     |                                    ^ TypeError: apiRequestContext.post: Invalid URL
  10 |       data: {
  11 |         email: 'owner-premium@e2e.com', // 'premium-resort-pro' local admin
  12 |         password: 'Welcome@1',
  13 |       }
  14 |     });
  15 |     const loginData = await loginRes.json();
  16 |     superadminToken = loginData.data.accessToken;
  17 |   });
  18 | 
  19 |   test('Local Admins are strictly forbidden from accessing /platform routes (Cross-Tenant RLS Test)', async ({ request }) => {
  20 |     // 1. Attempt to hit the Global Platform endpoint
  21 |     // The route `GET /api/v1/platform/tenants` lists ALL hotels in the system.
  22 |     // It requires `global_admin` role.
  23 |     const res = await request.get('/api/v1/platform/tenants', {
  24 |       headers: { 'Authorization': `Bearer ${superadminToken}` }
  25 |     });
  26 | 
  27 |     // 2. Assure RBAC stops them
  28 |     expect(res.status()).toBe(403);
  29 |     const body = await res.json();
  30 |     expect(body.success).toBe(false);
  31 |     expect(body.error).toContain('Global admin access required');
  32 |     
  33 |     // 3. Assure they cannot forcefully change another Property's status 
  34 |     const restrictRes = await request.patch(`/api/v1/platform/tenants/invalid-mock-123/status`, {
  35 |       headers: { 'Authorization': `Bearer ${superadminToken}` },
  36 |       data: { status: 'suspended' }
  37 |     });
  38 |     
  39 |     // RBAC should fire before it even reaches the route logic
  40 |     expect(restrictRes.status()).toBe(403);
  41 |   });
  42 | });
  43 | 
```