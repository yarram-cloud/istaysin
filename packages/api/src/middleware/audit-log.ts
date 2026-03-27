import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Log an audit entry for the current tenant.
 * Called from route handlers, not as middleware.
 */
export async function logAudit(
  tenantId: string,
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: Record<string, unknown>,
  ipAddress?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resource,
        resourceId,
        changes: changes || {},
        ipAddress,
      },
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
    // Don't throw — audit log failures shouldn't break the request
  }
}

/**
 * Middleware factory that auto-logs write operations.
 */
export function auditMiddleware(resource: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Store resource info for post-response logging
    (req as any)._auditResource = resource;
    next();
  };
}
