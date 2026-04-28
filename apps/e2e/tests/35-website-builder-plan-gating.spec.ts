/**
 * 35-website-builder-plan-gating.spec.ts
 *
 * Verifies the multi-tenant XSS surface is plan-gated. The website builder
 * happily saves customScripts / customCss for any plan, but the public page
 * must only render them for paid tiers (`professional` / `enterprise`).
 * Free + basic tenants get the fields stripped server-side.
 *
 * Also asserts the CSP header is set on the public page so even an accepted
 * inline script can't exfiltrate to arbitrary hosts.
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@istays.com';
const OWNER_EMAIL = 'owner-premium@e2e.com';
const PASSWORD = 'Welcome@1';

const MARKER_CSS = '/* plan-gating-marker-css */';
const MARKER_HEAD = '<!-- plan-gating-marker-head -->';

async function login(request: any, identifier: string) {
  const res = await request.post('/api/v1/auth/login', { data: { identifier, password: PASSWORD } });
  const body = await res.json();
  return body.success ? body.data : null;
}

async function setPlan(request: any, adminToken: string, tenantId: string, plan: string) {
  return request.patch(`/api/v1/platform/tenants/${tenantId}/plan`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { plan },
  });
}

async function setBuilderInjection(request: any, ownerToken: string, tenantId: string, css: string, headJs: string) {
  return request.patch(`/api/v1/tenants/${tenantId}/settings`, {
    headers: { Authorization: `Bearer ${ownerToken}`, 'x-tenant-id': tenantId },
    data: {
      config: {
        websiteBuilder: {
          components: {
            advanced: { customCss: css },
            scripts: { head: headJs, body: '' },
          },
        },
      },
    },
  });
}

async function fetchPropertyConfig(request: any, slug: string) {
  const res = await request.get(`/api/v1/public/properties/${slug}`);
  return res.ok() ? (await res.json()).data : null;
}

test.describe('35 — Website-builder plan gating', () => {
  let adminToken: string;
  let ownerToken: string;
  let tenantId: string;
  let tenantSlug: string;
  let originalPlan: string;

  test.beforeAll(async ({ request }) => {
    const admin = await login(request, ADMIN_EMAIL);
    if (!admin?.user?.isGlobalAdmin) {
      test.skip(true, 'global admin not seeded');
      return;
    }
    adminToken = admin.accessToken;

    const owner = await login(request, OWNER_EMAIL);
    if (!owner) {
      test.skip(true, 'owner not seeded');
      return;
    }
    ownerToken = owner.accessToken;
    tenantId = owner.user?.tenantId || owner.tenantId;

    const detail = await request.get(`/api/v1/platform/tenants/${tenantId}/detail`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await detail.json();
    tenantSlug = body.data?.slug;
    originalPlan = body.data?.plan;
    expect(tenantSlug).toBeTruthy();

    // Save the same injected content for every test — the only thing that
    // varies between tests is the plan tier.
    await setBuilderInjection(request, ownerToken, tenantId, MARKER_CSS, MARKER_HEAD);
  });

  test.afterAll(async ({ request }) => {
    if (!adminToken || !tenantId) return;
    await setBuilderInjection(request, ownerToken, tenantId, '', '');
    if (originalPlan) await setPlan(request, adminToken, tenantId, originalPlan);
  });

  test('free plan: customCss and head scripts are stripped from the public response', async ({ request }) => {
    test.skip(!adminToken, 'no auth');
    await setPlan(request, adminToken, tenantId, 'free');

    const data = await fetchPropertyConfig(request, tenantSlug);
    expect(data).toBeTruthy();

    const css = data.config?.websiteBuilder?.components?.advanced?.customCss || '';
    const head = data.config?.websiteBuilder?.components?.scripts?.head || '';
    expect(css).toBe('');
    expect(head).toBe('');

    expect(data.featureFlags?.customCss).toBe(false);
    expect(data.featureFlags?.customScripts).toBe(false);
  });

  test('basic plan: still strips customCss and scripts', async ({ request }) => {
    test.skip(!adminToken, 'no auth');
    await setPlan(request, adminToken, tenantId, 'basic');

    const data = await fetchPropertyConfig(request, tenantSlug);
    const css = data.config?.websiteBuilder?.components?.advanced?.customCss || '';
    const head = data.config?.websiteBuilder?.components?.scripts?.head || '';
    expect(css).toBe('');
    expect(head).toBe('');
  });

  test('professional plan: customCss and scripts are returned verbatim', async ({ request }) => {
    test.skip(!adminToken, 'no auth');
    await setPlan(request, adminToken, tenantId, 'professional');

    const data = await fetchPropertyConfig(request, tenantSlug);
    const css = data.config?.websiteBuilder?.components?.advanced?.customCss || '';
    const head = data.config?.websiteBuilder?.components?.scripts?.head || '';
    expect(css).toBe(MARKER_CSS);
    expect(head).toBe(MARKER_HEAD);

    expect(data.featureFlags?.customCss).toBe(true);
    expect(data.featureFlags?.customScripts).toBe(true);
  });

  test('settings endpoint exposes featureFlags so dashboard can gate UI', async ({ request }) => {
    test.skip(!adminToken, 'no auth');
    await setPlan(request, adminToken, tenantId, 'basic');

    const res = await request.get(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${ownerToken}`, 'x-tenant-id': tenantId },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.featureFlags).toMatchObject({
      customCss: false,
      customScripts: false,
    });
  });

  test('public property page sets a Content-Security-Policy header', async ({ request }) => {
    test.skip(!tenantSlug, 'no slug');
    const res = await request.get(`/en/${tenantSlug}`);
    // Some test environments serve via a separate process — only assert if
    // we actually got a 2xx response from the Next.js app.
    if (!res.ok()) test.skip(true, 'public page not reachable in this env');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
  });
});
