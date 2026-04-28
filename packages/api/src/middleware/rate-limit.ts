import { Request, Response, NextFunction } from 'express';

/**
 * Per-process in-memory rate limiter.
 *
 * Multi-tenant fairness: when the request carries an `x-tenant-id` header
 * (sent by the frontend for every authenticated call), the limiter keys by
 * tenant with a generous quota so one busy hotel's staff don't get blocked
 * collectively. Anonymous traffic falls back to per-IP keying with a
 * tighter quota — the original DDoS guard.
 *
 * Limitations: per-process. Behind a load balancer with N replicas the
 * effective limit is N × max. Acceptable until horizontal scale; swap for
 * a Redis-backed sliding window when that matters.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pickRateLimitTarget(req: Request): { key: string; max: number } {
  // Prefer tenant-keyed when the caller has identified a tenant context.
  const headerTenantId = req.headers['x-tenant-id'];
  if (typeof headerTenantId === 'string' && UUID_RE.test(headerTenantId)) {
    return { key: `tenant:${headerTenantId}`, max: 1000 };
  }
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return { key: `ip:${ip}`, max: 100 };
}

function check(key: string, max: number, windowMs: number): { ok: boolean; resetAt: number } {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    requestCounts.set(key, { count: 1, resetAt });
    return { ok: true, resetAt };
  }

  if (entry.count >= max) {
    return { ok: false, resetAt: entry.resetAt };
  }

  entry.count++;
  return { ok: true, resetAt: entry.resetAt };
}

export function apiLimiter(req: Request, res: Response, next: NextFunction): void {
  const { key, max } = pickRateLimitTarget(req);
  const windowMs = 60 * 1000;

  const result = check(key, max, windowMs);
  // Surface limit headers so clients (and load tests) can self-throttle.
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

  if (!result.ok) {
    const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
    return;
  }

  next();
}

function getRateLimitKey(req: Request): string {
  // Used by auth/public limiters that intentionally always key by IP.
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `rate:${ip}`;
}

/**
 * Stricter rate limiter for auth endpoints
 */
export function authLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = `auth:${getRateLimitKey(req)}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_MODE === 'true';
  const maxRequests = isTestEnv ? 1000 : 10; // Strict in production, relaxed for E2E tests

  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again in 15 minutes',
    });
    return;
  }

  entry.count++;
  next();
}

/**
 * Limit for public availability hints to prevent scraping
 */
export function publicHintsLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = `hints:${getRateLimitKey(req)}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30;

  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
    });
    return;
  }

  entry.count++;
  next();
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);
