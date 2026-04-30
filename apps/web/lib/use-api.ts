/**
 * SWR wrapper for the iStays API.
 *
 * What this fixes vs. raw `useSWR(url, fetcher)`:
 *
 *   1. **Tenant-aware cache keys.** The same URL (`/tenants/setup-progress`)
 *      returns different bodies depending on the `x-tenant-id` header that
 *      `apiFetch` injects. Plain SWR would serve tenant A's cached body to
 *      tenant B during admin preview / multi-property switches. We auto-prefix
 *      the active tenant id into the cache key so each tenant gets its own
 *      cache slot.
 *
 *   2. **No double-retry on auth errors.** `apiFetch` already has a refresh-
 *      token mutex that retries 401s. SWR's default `errorRetryCount: 3` would
 *      stack on top of that, multiplying the retry storm. We disable SWR
 *      retries on session-expiry errors and let the existing flow handle it.
 *
 *   3. **Cache-clear on logout.** SWR's cache lives in JS memory and survives
 *      `localStorage.clear()`. `clearAllSwrCache()` flushes everything so
 *      sensitive PII (booking PII, GST numbers, owner emails) doesn't leak
 *      across sessions on a shared device.
 *
 *   4. **Sensible defaults.** Static-ish data (plans, settings) gets long
 *      dedupe; live data (bookings, revenue) gets short dedupe. Tunable
 *      per call.
 */

'use client';

import useSWR, {
  type SWRConfiguration,
  type SWRResponse,
  useSWRConfig,
  unstable_serialize,
} from 'swr';
import { apiFetch } from './api';

export type UseApiOptions = SWRConfiguration & {
  /**
   * When false, treat the data as live and revalidate aggressively.
   * When true (default for read-only references like plans), be more relaxed.
   */
  staticish?: boolean;
};

function getActiveTenantId(): string {
  if (typeof window === 'undefined') return 'unassigned';
  return localStorage.getItem('tenantId') || localStorage.getItem('tenant_id') || 'unassigned';
}

/**
 * Build the cache key. Always a tuple `[tenantId, endpoint]` so identical
 * URLs across tenants do not collide. Pass `null` to disable the fetch
 * (useful while waiting for a prerequisite, e.g. user not logged in yet).
 */
export function apiKey(endpoint: string | null): readonly [string, string] | null {
  if (endpoint === null) return null;
  return [getActiveTenantId(), endpoint] as const;
}

const fetcher = async ([, endpoint]: readonly [string, string]) => apiFetch(endpoint);

const DEFAULTS_LIVE: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2_000,
  shouldRetryOnError: (err) => !/Session expired|API error: 401/.test(err?.message || ''),
};

const DEFAULTS_STATICISH: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60_000,
  shouldRetryOnError: (err) => !/Session expired|API error: 401/.test(err?.message || ''),
};

/**
 * Primary read hook.
 *
 *   const { data, error, isLoading, mutate } = useApi<TenantList>(
 *     '/platform/tenants?page=1',
 *   );
 *
 * Pass `null` to disable: `useApi(authReady ? '/auth/me' : null)`.
 * Pass `{ staticish: true }` for plans / settings / other rarely-changing data.
 */
export function useApi<T = unknown>(
  endpoint: string | null,
  options: UseApiOptions = {},
): SWRResponse<T, Error> & { isLoading: boolean } {
  const { staticish, ...swrOpts } = options;
  const base = staticish ? DEFAULTS_STATICISH : DEFAULTS_LIVE;
  const key = apiKey(endpoint);
  const result = useSWR<T, Error>(key, fetcher, { ...base, ...swrOpts });
  return { ...result, isLoading: !result.data && !result.error && key !== null };
}

/**
 * Imperative invalidation. Call after a write to refresh the cached read.
 * Accepts the same endpoint string you'd pass to useApi — tenant prefixing
 * is handled internally so call sites stay clean.
 *
 *   await tenantsApi.updatePlan(id, plan);
 *   await invalidateApi('/platform/tenants/' + id + '/detail');
 */
export function useApiMutate() {
  const { mutate } = useSWRConfig();
  return (endpoint: string) => {
    const key = apiKey(endpoint);
    if (key) return mutate(key);
    return Promise.resolve();
  };
}

/**
 * Module-level mutate helper for places that aren't React components
 * (api helpers, websocket handlers). Internally builds the same key shape
 * as useApi so invalidation hits the right cache slot.
 */
export async function invalidateApiKey(endpoint: string): Promise<void> {
  if (typeof window === 'undefined') return;
  // Lazy-import the global mutate to avoid coupling at module-init time.
  const { mutate } = await import('swr');
  const key = apiKey(endpoint);
  if (key) await mutate(unstable_serialize(key));
}

/**
 * Invalidate every cache key whose endpoint starts with `prefix`. Useful for
 * paginated/filtered tables — `invalidateApiPrefix('/platform/revenue')`
 * refreshes `?page=1`, `?page=2&plan=basic`, etc. all at once.
 *
 * Tenant prefixing happens transparently — the predicate matches against
 * the endpoint half of the [tenantId, endpoint] tuple key.
 */
export async function invalidateApiPrefix(prefix: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const { mutate } = await import('swr');
  const tenantId = getActiveTenantId();
  await mutate(
    (k) =>
      Array.isArray(k) &&
      k.length === 2 &&
      k[0] === tenantId &&
      typeof k[1] === 'string' &&
      k[1].startsWith(prefix),
    undefined,
    { revalidate: true },
  );
}

/**
 * Flush every cached entry. Wire into the logout flow so PII does not
 * survive a session boundary on a shared device. Safe no-op outside the
 * browser.
 */
export async function clearAllSwrCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  const { mutate } = await import('swr');
  await mutate(() => true, undefined, { revalidate: false });
}
