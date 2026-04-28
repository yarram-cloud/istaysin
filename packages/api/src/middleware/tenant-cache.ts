import { prisma } from '../config/database';

/**
 * Tenant + membership lookup cache for `resolveTenant` middleware.
 *
 * Why this exists: every authenticated request currently does
 *   tenant.findUnique + tenantMembership.findFirst
 * before the route's own queries run. With the DB in another region those
 * two round-trips alone add ~100-500ms per request. This module replaces
 * those reads with an in-memory TTL cache.
 *
 * Trade-offs you should know:
 *   - In-memory only: state is per-process, so horizontal replicas warm up
 *     independently. Acceptable at our scale; revisit with Redis if we
 *     ever need a shared cache across nodes.
 *   - Eventually consistent within TTL: a status flip from active→suspended
 *     takes effect within 60s, not immediately. We accept this in exchange
 *     for the per-request speedup. Critical writes call invalidate*() to
 *     bypass the wait.
 *   - Negative results are cached briefly (10s) so a 404 storm can't turn
 *     into a DB storm.
 *
 * Concurrency: the Map operations are synchronous and JS is single-threaded,
 * so there is no read/write race within a process.
 */

export type CachedTenant = {
  id: string;
  slug: string;
  schemaName: string;
  status: string;
  plan: string;
} | null;

export type CachedMembership = { id: string } | null;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const POSITIVE_TTL_MS = 60_000;
const NEGATIVE_TTL_MS = 10_000;
// Bound the cache so a misbehaving caller (e.g. slug-fuzz attack) cannot grow
// it without limit. With ~5k tenants this comfortably covers the working set.
const MAX_ENTRIES = 5_000;

const tenantById = new Map<string, CacheEntry<CachedTenant>>();
const tenantBySlug = new Map<string, CacheEntry<CachedTenant>>();
const membershipByPair = new Map<string, CacheEntry<CachedMembership>>();

const TENANT_SELECT = {
  id: true,
  slug: true,
  schemaName: true,
  status: true,
  plan: true,
} as const;

function isFresh<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> {
  return !!entry && entry.expiresAt > Date.now();
}

function setEntry<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  // JS Map preserves insertion order. We want pseudo-LRU semantics so a hot
  // key doesn't age out under FIFO eviction — explicitly delete-before-set
  // so re-cached entries move to the back of the iteration order.
  if (map.has(key)) map.delete(key);

  if (map.size >= MAX_ENTRIES) {
    // Drop the oldest 10% of entries to amortise the eviction cost.
    const drop = Math.ceil(MAX_ENTRIES / 10);
    let i = 0;
    for (const k of map.keys()) {
      map.delete(k);
      if (++i >= drop) break;
    }
  }
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function membershipKey(userId: string, tenantId: string): string {
  return `${userId}:${tenantId}`;
}

// ── Read helpers (these are what middleware calls instead of prisma) ─────────

export async function getTenantById(id: string): Promise<CachedTenant> {
  const cached = tenantById.get(id);
  if (isFresh(cached)) return cached.value;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: TENANT_SELECT,
  });

  setEntry(tenantById, id, tenant, tenant ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS);
  // Cross-populate the slug-keyed cache so a subsequent slug lookup is also a hit.
  if (tenant) setEntry(tenantBySlug, tenant.slug, tenant, POSITIVE_TTL_MS);

  return tenant;
}

export async function getTenantBySlug(slug: string): Promise<CachedTenant> {
  const cached = tenantBySlug.get(slug);
  if (isFresh(cached)) return cached.value;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: TENANT_SELECT,
  });

  setEntry(tenantBySlug, slug, tenant, tenant ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS);
  if (tenant) setEntry(tenantById, tenant.id, tenant, POSITIVE_TTL_MS);

  return tenant;
}

export async function getActiveMembership(userId: string, tenantId: string): Promise<CachedMembership> {
  const key = membershipKey(userId, tenantId);
  const cached = membershipByPair.get(key);
  if (isFresh(cached)) return cached.value;

  const m = await prisma.tenantMembership.findFirst({
    where: { userId, tenantId, isActive: true },
    select: { id: true },
  });

  setEntry(membershipByPair, key, m, m ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS);
  return m;
}

// ── Invalidation helpers (call after writes that change cached fields) ───────

/** Invalidate both id-keyed and slug-keyed entries for a tenant. */
export function invalidateTenant(id: string): void {
  const entry = tenantById.get(id);
  tenantById.delete(id);

  if (entry?.value?.slug) {
    tenantBySlug.delete(entry.value.slug);
  } else {
    // Fallback: walk the slug cache for any entry pointing to this id.
    // O(n) but n is bounded by MAX_ENTRIES.
    for (const [slug, e] of tenantBySlug) {
      if (e.value?.id === id) tenantBySlug.delete(slug);
    }
  }
}

export function invalidateTenantBySlug(slug: string): void {
  const entry = tenantBySlug.get(slug);
  tenantBySlug.delete(slug);
  if (entry?.value?.id) tenantById.delete(entry.value.id);
}

export function invalidateMembership(userId: string, tenantId: string): void {
  membershipByPair.delete(membershipKey(userId, tenantId));
}

export function invalidateAllMembershipsForTenant(tenantId: string): void {
  const suffix = `:${tenantId}`;
  for (const key of membershipByPair.keys()) {
    if (key.endsWith(suffix)) membershipByPair.delete(key);
  }
}

export function invalidateAllMembershipsForUser(userId: string): void {
  const prefix = `${userId}:`;
  for (const key of membershipByPair.keys()) {
    if (key.startsWith(prefix)) membershipByPair.delete(key);
  }
}

// ── Test helpers ─────────────────────────────────────────────────────────────

/** Reset the cache. Intended for tests only. */
export function _resetCacheForTests(): void {
  tenantById.clear();
  tenantBySlug.clear();
  membershipByPair.clear();
}

/** Inspect cache state. Intended for tests / debugging only. */
export function _cacheStats(): { tenantById: number; tenantBySlug: number; membership: number } {
  return {
    tenantById: tenantById.size,
    tenantBySlug: tenantBySlug.size,
    membership: membershipByPair.size,
  };
}
