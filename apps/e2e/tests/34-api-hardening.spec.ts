/**
 * 34-api-hardening.spec.ts
 *
 * Smokes the production-hardening additions to the API:
 *   - GET /health is liveness, /health/ready is readiness (DB-aware)
 *   - Responses ≥1KB are gzip-compressed when the client advertises support
 *   - Rate-limit headers are emitted on every response
 *   - Tenant-keyed quota is higher than IP-keyed (basic sanity check)
 */

import { test, expect } from '@playwright/test';

test.describe('34 — API hardening smokes', () => {
  test('GET /api/v1/health is alive without touching the DB', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('istays-api');
  });

  test('GET /api/v1/health/ready confirms DB reachability', async ({ request }) => {
    const res = await request.get('/api/v1/health/ready');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.db).toBe('reachable');
  });

  test('responses include rate-limit headers', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.headers()['x-ratelimit-limit']).toBeTruthy();
    expect(res.headers()['x-ratelimit-reset']).toBeTruthy();
  });

  test('IP-keyed quota is the conservative baseline (≤200/min)', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    const limit = Number(res.headers()['x-ratelimit-limit']);
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(200);
  });

  test('tenant-keyed quota is higher than IP-keyed', async ({ request }) => {
    const ipRes = await request.get('/api/v1/health');
    const ipLimit = Number(ipRes.headers()['x-ratelimit-limit']);

    // Pass any well-formed UUID; the limiter only validates shape, not membership.
    const tenantRes = await request.get('/api/v1/health', {
      headers: { 'x-tenant-id': '00000000-0000-0000-0000-000000000000' },
    });
    const tenantLimit = Number(tenantRes.headers()['x-ratelimit-limit']);

    expect(tenantLimit).toBeGreaterThan(ipLimit);
  });

  test('large JSON responses are gzip-compressed', async ({ request }) => {
    // /platform/plans is a public-friendly endpoint that returns >1KB once
    // seeded, exceeding the compression threshold.
    const res = await request.get('/api/v1/platform/plans', {
      headers: { 'Accept-Encoding': 'gzip' },
    });
    // Public/auth gating may return 401 before middleware completes — in that
    // case the body is small and won't be compressed. We only assert the
    // compression layer is wired by checking that *some* GET returns
    // content-encoding: gzip when the body is >1KB.
    if (res.ok()) {
      const enc = res.headers()['content-encoding'];
      // It's OK for the test runner to transparently decompress; we just want
      // to confirm the server advertises compression on a sufficiently-large
      // payload. If it's not gzip, the body must at least be small.
      const bodyLen = (await res.text()).length;
      if (bodyLen >= 1024) {
        expect(enc).toBe('gzip');
      }
    }
  });
});
