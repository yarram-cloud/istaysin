import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSchemaName?: string;
      tenantPlan?: string;
      tenantStatus?: string;
    }
  }
}

/**
 * Tenant Resolver Middleware
 *
 * Resolves the current tenant from:
 * 1. x-tenant-id header (priority — sent by frontend)
 * 2. JWT payload (tenantId)
 * 3. x-tenant-slug header
 * 4. Request hostname (subdomain)
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. From x-tenant-id header — ALWAYS takes priority
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId && /^[0-9a-f-]{36}$/i.test(headerTenantId)) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: headerTenantId },
        select: { id: true, schemaName: true, status: true, plan: true },
      });

      if (!tenant || (tenant.status !== 'active' && tenant.status !== 'pending_approval')) {
        res.status(403).json({ success: false, error: 'Property not found or inactive' });
        return;
      }

      // Verify the authenticated user is actually a member of this tenant
      if (req.userId) {
        const membership = await prisma.tenantMembership.findFirst({
          where: { userId: req.userId, tenantId: tenant.id, isActive: true },
          select: { id: true },
        });
        if (!membership) {
          res.status(403).json({ success: false, error: 'Access denied: you are not a member of this property' });
          return;
        }
      }

      req.tenantId = tenant.id;
      req.tenantSchemaName = tenant.schemaName;
      req.tenantPlan = tenant.plan || 'free';
      req.tenantStatus = tenant.status;
      next();
      return;
    }

    // 2. From JWT payload — also verify membership is still active (handles revoked staff)
    if (req.user?.tenantId) {
      const [tenant, membership] = await Promise.all([
        prisma.tenant.findUnique({
          where: { id: req.user.tenantId },
          select: { id: true, schemaName: true, status: true, plan: true },
        }),
        req.userId
          ? prisma.tenantMembership.findFirst({
              where: { userId: req.userId, tenantId: req.user.tenantId, isActive: true },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

      if (!tenant || (tenant.status !== 'active' && tenant.status !== 'pending_approval')) {
        res.status(403).json({ success: false, error: 'Property not found or inactive' });
        return;
      }

      if (req.userId && !membership) {
        res.status(403).json({ success: false, error: 'Access denied: membership revoked' });
        return;
      }

      req.tenantId = tenant.id;
      req.tenantSchemaName = tenant.schemaName;
      req.tenantPlan = tenant.plan || 'free';
      req.tenantStatus = tenant.status;
      next();
      return;
    }

    // 3. From x-tenant-slug header
    let tenantSlug = req.headers['x-tenant-slug'] as string;

    // 4. From subdomain
    if (!tenantSlug) {
      const host = req.hostname;
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
        tenantSlug = parts[0];
      }
    }

    if (!tenantSlug) {
      // No tenant context — allow for global routes
      next();
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, schemaName: true, status: true, plan: true },
    });

    if (!tenant || tenant.status !== 'active') {
      res.status(404).json({ success: false, error: 'Property not found or inactive' });
      return;
    }

    req.tenantId = tenant.id;
    req.tenantSchemaName = tenant.schemaName;
    req.tenantPlan = tenant.plan || 'free';
    req.tenantStatus = tenant.status;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require tenant context — returns 400 if no tenant resolved
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    res.status(400).json({ success: false, error: 'Property context required' });
    return;
  }
  next();
}
