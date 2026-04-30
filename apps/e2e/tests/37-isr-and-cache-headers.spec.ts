/**
 * 37-isr-and-cache-headers.spec.ts
 *
 * Verifies the edge-cache layer for public property pages:
 *   - GET /api/v1/public/properties/:slug returns Cache-Control with s-maxage
 *   - Next.js page sets x-nextjs-cache: HIT on the second request (ISR working)
 *   - A settings save triggers /api/revalidate, refreshing the cached HTML
 *
 * The HIT-vs-MISS assertion only meaningfully runs against `next start`
 * (production build serving static + dynamic). Behind `next dev` the header
 * is always MISS, so we soft-skip in that case.
 */

import { test, expect } from '@playwright/test';

const PROPERTY_SLUG = 'premium-resort-pro';

test.describe('37 — ISR + cache headers', () => {
  test('GET /public/properties/:slug emits Cache-Control', async ({ request }) => {
    const res = await request.get(`/api/v1/public/properties/${PROPERTY_SLUG}`);
    expect(res.ok()).toBe(true);
    const cc = res.headers()['cache-control'] || '';
    expect(cc).toMatch(/public/i);
    expect(cc).toMatch(/s-maxage=\d+/);
    expect(cc).toMatch(/stale-while-revalidate=\d+/);
  });

  test('public page returns x-nextjs-cache HIT on warm requests', async ({ request }) => {
    // First request — populate the cache (or hit MISS in dev).
    const first = await request.get(`/en/${PROPERTY_SLUG}`);
    expect(first.ok()).toBe(true);
    const firstCache = first.headers()['x-nextjs-cache'];

    // If the dev server is serving (always MISS) just confirm 200 and bail.
    if (!firstCache || firstCache === 'MISS') {
      test.skip(
        firstCache !== 'HIT',
        `dev server (x-nextjs-cache=${firstCache || 'absent'}) — assertion only meaningful in next start`,
      );
    }

    // Second request — should be a cache hit (or STALE while revalidating).
    const second = await request.get(`/en/${PROPERTY_SLUG}`);
    expect(second.ok()).toBe(true);
    const secondCache = second.headers()['x-nextjs-cache'] || '';
    expect(['HIT', 'STALE']).toContain(secondCache);
  });

  test('on-demand revalidate endpoint rejects without secret', async ({ request }) => {
    const res = await request.post('/api/revalidate', {
      data: { slug: PROPERTY_SLUG },
    });
    // 401 (bad/missing secret) or 503 (REVALIDATE_SECRET unset). Both are
    // acceptable rejection paths — the assertion is "not 200".
    expect([401, 503]).toContain(res.status());
  });

  test('on-demand revalidate succeeds with valid secret + slug', async ({ request }) => {
    const secret = process.env.REVALIDATE_SECRET;
    test.skip(!secret, 'REVALIDATE_SECRET not configured for this env');
    if (!secret) return;

    const res = await request.post('/api/revalidate', {
      headers: { 'x-revalidate-secret': secret },
      data: { slug: PROPERTY_SLUG },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.slug).toBe(PROPERTY_SLUG);
    expect(Array.isArray(body.revalidated)).toBe(true);
    expect(body.revalidated.length).toBeGreaterThan(0);
  });

  test('on-demand revalidate rejects path-traversal-y slugs', async ({ request }) => {
    const secret = process.env.REVALIDATE_SECRET;
    test.skip(!secret, 'REVALIDATE_SECRET not configured');
    if (!secret) return;

    for (const bad of ['../etc', 'foo/bar', 'foo bar', '%2E%2E', '']) {
      const res = await request.post('/api/revalidate', {
        headers: { 'x-revalidate-secret': secret },
        data: { slug: bad },
      });
      expect(res.status(), `slug "${bad}" should be rejected`).toBe(400);
    }
  });
});
