import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { requireGlobalAdmin } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';
import { sendPropertyApprovalEmail } from '../../services/email';

export const platformRouter = Router();
platformRouter.use(authenticate, requireGlobalAdmin);

// GET /platform/registrations — pending approvals
platformRouter.get('/registrations', async (req: Request, res: Response) => {
  try {
    const { status = 'pending_approval' } = req.query;
    const tenants = await prisma.tenant.findMany({
      where: { status: status as string },
      include: { owner: { select: { id: true, fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tenants });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

// POST /platform/approve/:id
platformRouter.post('/approve/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'active' },
      include: { owner: { select: { email: true } } },
    });

    sendPropertyApprovalEmail(tenant.owner.email, { propertyName: tenant.name, status: 'approved' }).catch(console.error);
    await logAudit(tenant.id, req.userId, 'APPROVE', 'tenant', tenant.id, {}, req.ip || undefined);

    res.json({ success: true, data: tenant, message: 'Property approved' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to approve property' });
  }
});

// POST /platform/reject/:id
platformRouter.post('/reject/:id', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'suspended' },
      include: { owner: { select: { email: true } } },
    });

    sendPropertyApprovalEmail(tenant.owner.email, { propertyName: tenant.name, status: 'rejected', reason }).catch(console.error);

    res.json({ success: true, data: tenant, message: 'Property rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reject property' });
  }
});

// GET /platform/tenants — all tenants
platformRouter.get('/tenants', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          owner: { select: { fullName: true, email: true } },
          _count: { select: { rooms: true, bookings: true, memberships: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({ success: true, data: tenants, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

// GET /platform/analytics
platformRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const [totalTenants, activeTenants, pendingApprovals, totalBookings, totalUsers] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.tenant.count({ where: { status: 'pending_approval' } }),
      prisma.booking.count(),
      prisma.globalUser.count(),
    ]);

    const recentRegistrations = await prisma.tenant.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        pendingApprovals,
        totalBookings,
        totalUsers,
        recentRegistrations,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});
