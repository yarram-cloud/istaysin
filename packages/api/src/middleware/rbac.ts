import { Request, Response, NextFunction } from 'express';
import type { Role } from '@istays/shared';

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 *
 * Usage:
 *   router.get('/rooms', authorize('property_owner', 'general_manager', 'front_desk'), handler);
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role as Role;

    // Global admin can access everything
    if (userRole === 'global_admin') {
      next();
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Require global admin role
 */
export function requireGlobalAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'global_admin' && !(req.user as any).isGlobalAdmin)) {
    res.status(403).json({ success: false, error: 'Global admin access required' });
    return;
  }
  next();
}

/**
 * Require global admin or global support role
 */
export function requirePlatformStaff(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'global_admin' && req.user.role !== 'global_support')) {
    res.status(403).json({ success: false, error: 'Platform staff access required' });
    return;
  }
  next();
}
