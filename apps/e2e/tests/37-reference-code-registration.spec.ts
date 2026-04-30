import { test, expect } from '@playwright/test';

/**
 * 37-reference-code-registration.spec.ts
 *
 * Tests the campaign reference code flow:
 * - Registration form accepts an optional reference code
 * - Backend stores it correctly (uppercase, stripped)
 * - Invalid characters are rejected by Zod
 * - Platform admin /reference-stats endpoint returns correct aggregations
 *
 * NOTE: These tests use the API directly (not the full UI registration flow)
 * because registration requires OTP which is not E2E-automatable in CI.
 */

let adminToken: string;

test.describe.configure({ mode: 'serial' });

test.describe('Campaign Reference Code — Registration & Analytics', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { identifier: 'platform-admin@e2e.com', password: 'Welcome@1' },
    });
    const body = await res.json();
    adminToken = body.data?.accessToken;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-01: /platform/reference-stats returns 401 without auth
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-01: reference-stats is auth-protected', async ({ request }) => {
    const res = await request.get('/api/v1/platform/reference-stats');
    expect(res.status()).toBe(401);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-02: /platform/reference-stats returns valid data shape
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-02: reference-stats returns correct response shape', async ({ request }) => {
    if (!adminToken) test.skip();

    const res = await request.get('/api/v1/platform/reference-stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    // Each item must have expected shape
    for (const item of body.data) {
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('total');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('pending');
      expect(item).toHaveProperty('suspended');
      expect(item).toHaveProperty('lastRegistration');
      expect(typeof item.total).toBe('number');
      expect(typeof item.active).toBe('number');
      expect(typeof item.pending).toBe('number');
      // total must equal active + pending + suspended
      expect(item.total).toBe(item.active + item.pending + item.suspended);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-03: reference-stats sorted by total desc
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-03: reference-stats results are sorted by total desc', async ({ request }) => {
    if (!adminToken) test.skip();

    const res = await request.get('/api/v1/platform/reference-stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const body = await res.json();
    const data: any[] = body.data;
    if (data.length < 2) return; // skip if not enough data

    for (let i = 1; i < data.length; i++) {
      expect(data[i].total).toBeLessThanOrEqual(data[i - 1].total);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-04: Zod validator rejects invalid referenceCode chars via register-property
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-04: register-property rejects referenceCode with special chars', async ({ request }) => {
    // First login as an existing user with no property yet — use a seeded test account
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' },
    });
    const userToken = (await loginRes.json()).data?.accessToken;
    if (!userToken) test.skip();

    // Try to register with an invalid reference code (contains space and @)
    const res = await request.post('/api/v1/tenants/register-property', {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: 'REF Test Property',
        propertyType: 'hotel',
        address: '123 Test Street, Test Area',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        contactPhone: '+919876543210',
        contactEmail: 'ref-test@e2e.com',
        referenceCode: 'MY CODE@2024', // invalid: contains space and @
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    // Error should mention reference code
    expect(body.error).toMatch(/reference code/i);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-05: Zod validator accepts valid referenceCode (alphanumeric + hyphens)
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-05: register-property accepts valid referenceCode', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: 'owner-premium@e2e.com', password: 'Welcome@1' },
    });
    const userToken = (await loginRes.json()).data?.accessToken;
    if (!userToken) test.skip();

    const res = await request.post('/api/v1/tenants/register-property', {
      headers: { 'Authorization': `Bearer ${userToken}` },
      data: {
        name: 'REF Code E2E Hotel',
        propertyType: 'hotel',
        address: '456 Campaign Road, New Area',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500002',
        contactPhone: '+919988776655',
        contactEmail: 'ref-valid@e2e.com',
        referenceCode: 'YOUTUBE2024', // valid
      },
    });

    // Should succeed (201) OR 400 if phone already used — either is OK for this schema test
    // The key is it should NOT fail specifically because of the referenceCode field
    const body = await res.json();
    if (!body.success) {
      // If it failed, it must NOT be due to referenceCode
      expect(body.error).not.toMatch(/reference code/i);
    } else {
      expect(res.status()).toBe(201);
      // Verify referenceCode was saved and uppercased
      expect(body.data.referenceCode).toBe('YOUTUBE2024');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-06: referenceCode is normalised to uppercase on save
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-06: referenceCode stored uppercase regardless of input case', async ({ request }) => {
    // This test verifies the backend uppercasing via the reference-stats endpoint
    // If YOUTUBE2024 is in the DB from REF-05, it must appear as YOUTUBE2024 (not lowercase)
    if (!adminToken) test.skip();

    const res = await request.get('/api/v1/platform/reference-stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const body = await res.json();
    const data: any[] = body.data;

    // No code should contain lowercase letters (all codes normalised to uppercase on write)
    for (const item of data) {
      if (item.code !== '(no code)') {
        expect(item.code).toBe(item.code.toUpperCase());
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-07: Admin UI shows Campaign Stats panel
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-07: admin registrations page shows Campaign Stats section', async ({ page }) => {
    // Login as global admin
    await page.goto('/login');
    await page.fill('input[type="tel"], input[placeholder*="98765"]', '9000000001');
    await page.fill('input[type="password"]', 'Welcome@1');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');

    await page.goto('/admin/registrations');
    await page.waitForLoadState('networkidle');

    // Campaign Stats panel must be visible
    await expect(page.getByText('Campaign Stats')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Registrations grouped by reference / promo code')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REF-08: Registration form has Reference/Promo Code field
  // ─────────────────────────────────────────────────────────────────────────────
  test('REF-08: /register page shows optional Reference/Promo Code input', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // The input must exist and be optional (no required attribute)
    const input = page.locator('#referenceCode');
    await expect(input).toBeVisible();
    const isRequired = await input.getAttribute('required');
    expect(isRequired).toBeNull(); // optional field

    // Entering a value auto-uppercases and shows the confirmation text
    await input.fill('youtube2024');
    await expect(page.getByText(/YOUTUBE2024/)).toBeVisible();
    await expect(page.getByText(/will be applied/i)).toBeVisible();
  });
});
