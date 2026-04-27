/**
 * 30-website-builder-render.spec.ts
 *
 * Verifies that fields edited in the Website Builder dashboard actually surface
 * on the public property page. Each behaviour audited in the website-builder
 * review (SEO meta, contact override, footer copyright override, social links,
 * brand color CSS var, custom CSS injection) gets one assertion here.
 *
 * Strategy: drive PATCH /tenants/:id/settings via the API to avoid UI flake,
 * then load the public page and assert the rendered output.
 */

import { test, expect } from '@playwright/test';

const TENANT_SLUG = 'premium-resort-pro';
const OWNER_EMAIL = 'owner-premium@e2e.com';
const TEST_PASSWORD = 'Welcome@1';
const PUBLIC_URL = `/en/${TENANT_SLUG}`;

test.describe('30 — Website Builder render parity', () => {
  let token: string;
  let tenantId: string;
  let savedConfig: any = null;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: OWNER_EMAIL, password: TEST_PASSWORD },
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      test.skip(true, 'Owner credentials not seeded — skipping');
      return;
    }
    token = loginData.data.accessToken;
    tenantId = loginData.data.user?.tenantId || loginData.data.tenantId;

    // Snapshot existing config so we restore it after the test
    const settingsRes = await request.get(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await settingsRes.json();
    if (body.success) savedConfig = body.data?.config?.websiteBuilder || {};
  });

  test.afterAll(async ({ request }) => {
    if (!token || !tenantId || !savedConfig) return;
    await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { config: { websiteBuilder: savedConfig } },
    });
  });

  test('SEO override flows into <title> and meta description', async ({ request, page }) => {
    test.skip(!token, 'no auth');
    const seoTitle = `Premium Resort Pro — Luxury ${Date.now()}`;
    const seoDescription = 'Hand-crafted hospitality on the Goa coast.';
    const seoKeywords = 'goa, resort, luxury, beach';

    const res = await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        config: {
          websiteBuilder: {
            ...savedConfig,
            components: {
              ...(savedConfig.components || {}),
              seo: { title: seoTitle, description: seoDescription, keywords: seoKeywords },
            },
          },
        },
      },
    });
    expect(res.ok()).toBe(true);

    await page.goto(PUBLIC_URL);
    await expect(page).toHaveTitle(seoTitle);

    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', seoDescription);

    const metaKeywords = page.locator('meta[name="keywords"]');
    await expect(metaKeywords).toHaveAttribute('content', seoKeywords);
  });

  test('Footer copyright override and social links render', async ({ request, page }) => {
    test.skip(!token, 'no auth');
    const customCopyright = `© 2026 Custom Footer Co — line ${Date.now()}`;

    const res = await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        config: {
          websiteBuilder: {
            ...savedConfig,
            components: {
              ...(savedConfig.components || {}),
              footer: {
                enabled: true,
                text: customCopyright,
                socialLinks: {
                  facebook: 'https://facebook.com/example-resort',
                  instagram: 'https://instagram.com/example-resort',
                  twitter: '',
                },
              },
            },
          },
        },
      },
    });
    expect(res.ok()).toBe(true);

    await page.goto(PUBLIC_URL);
    await expect(page.locator('footer').last()).toContainText(customCopyright);

    // Two social links provided (twitter empty), so two anchors should appear
    const fbLink = page.locator('footer a[href*="facebook.com/example-resort"]').first();
    const igLink = page.locator('footer a[href*="instagram.com/example-resort"]').first();
    await expect(fbLink).toBeVisible();
    await expect(igLink).toBeVisible();
  });

  test('Contact override (CMS email/phone) wins over property fallback', async ({ request, page }) => {
    test.skip(!token, 'no auth');
    const overrideEmail = `bookings+${Date.now()}@example-resort.com`;
    const overridePhone = '+91 99999 11111';

    const res = await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        config: {
          websiteBuilder: {
            ...savedConfig,
            components: {
              ...(savedConfig.components || {}),
              contact: {
                enabled: true,
                title: 'Get in Touch',
                email: overrideEmail,
                phone: overridePhone,
              },
            },
          },
        },
      },
    });
    expect(res.ok()).toBe(true);

    await page.goto(PUBLIC_URL);
    await expect(page.locator('section#contact')).toBeVisible();
    await expect(
      page.locator(`section#contact a[href="mailto:${overrideEmail}"]`).first()
    ).toBeVisible();
    await expect(page.locator('section#contact')).toContainText(overridePhone);
  });

  test('Custom CSS is injected into the page', async ({ request, page }) => {
    test.skip(!token, 'no auth');
    const css = '.brand-cms-marker { display: block !important; }';

    const res = await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        config: {
          websiteBuilder: {
            ...savedConfig,
            components: {
              ...(savedConfig.components || {}),
              advanced: { customCss: css },
            },
          },
        },
      },
    });
    expect(res.ok()).toBe(true);

    await page.goto(PUBLIC_URL);
    const matched = await page.evaluate((needle) => {
      return Array.from(document.querySelectorAll('style')).some((s) =>
        (s.textContent || '').includes(needle)
      );
    }, css);
    expect(matched).toBe(true);
  });

  test('Brand color CSS var reflects primaryColor', async ({ request, page }) => {
    test.skip(!token, 'no auth');
    const newPrimary = '#a3128b';

    const res = await request.patch(`/api/v1/tenants/${tenantId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { primaryColor: newPrimary, secondaryColor: '#f59e0b' },
    });
    expect(res.ok()).toBe(true);

    await page.goto(PUBLIC_URL);
    const brandColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--brand-color').trim()
    );
    expect(brandColor.toLowerCase()).toBe(newPrimary);

    const brandSecondary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--brand-color-secondary').trim()
    );
    expect(brandSecondary.toLowerCase()).toBe('#f59e0b');
  });
});

// Mobile + tablet smoke for the redesigned dashboard Brand Identity panel
test.describe('30 — Website Builder dashboard responsive smoke', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Brand Identity cards stack and inputs are reachable on 375px', async ({ page, request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { identifier: OWNER_EMAIL, password: TEST_PASSWORD },
    });
    const loginData = await loginRes.json();
    test.skip(!loginData.success, 'no test credentials');

    await page.context().addCookies([
      {
        name: 'accessToken',
        value: loginData.data.accessToken,
        url: page.url() || 'http://localhost:3100',
      },
    ]);
    await page.addInitScript((tok: string) => {
      localStorage.setItem('accessToken', tok);
    }, loginData.data.accessToken);

    await page.goto('/dashboard/website');
    await expect(page.getByRole('heading', { level: 3, name: /Color Palette/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Typography/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^Layout$/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Brand Assets/i })).toBeVisible();
  });
});
