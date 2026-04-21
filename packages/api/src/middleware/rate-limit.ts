import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter for development.
 * In production, use Redis-backed sliding window.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `rate:${ip}`;
}

export function apiLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
    return;
  }

  entry.count++;
  next();
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

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);
