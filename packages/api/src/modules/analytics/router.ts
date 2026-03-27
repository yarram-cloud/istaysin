import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager', 'accountant'));

// GET /analytics/occupancy
analyticsRouter.get('/occupancy', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const totalRooms = await prisma.room.count({ where: { tenantId: req.tenantId!, isActive: true } });
      const occupiedRooms = await prisma.room.count({ where: { tenantId: req.tenantId!, status: 'occupied' } });
      const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      res.json({ success: true, data: { totalRooms, occupiedRooms, availableRooms: totalRooms - occupiedRooms, occupancyPercent } });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch occupancy' });
  }
});

// GET /analytics/revenue
analyticsRouter.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1)); // first of current month
    const end = endDate ? new Date(endDate as string) : new Date();

    await withTenant(req.tenantId!, async () => {
      const payments = await prisma.guestPayment.findMany({
        where: { tenantId: req.tenantId!, createdAt: { gte: start, lte: end }, status: 'completed' },
      });

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalBookings = await prisma.booking.count({
        where: { tenantId: req.tenantId!, createdAt: { gte: start, lte: end } },
      });
      const totalRooms = await prisma.room.count({ where: { tenantId: req.tenantId!, isActive: true } });
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      const adr = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const revpar = totalRooms > 0 ? totalRevenue / (totalRooms * days) : 0;

      res.json({
        success: true,
        data: {
          totalRevenue: Math.round(totalRevenue),
          totalBookings,
          adr: Math.round(adr),
          revpar: Math.round(revpar),
          period: { start: start.toISOString(), end: end.toISOString() },
        },
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch revenue' });
  }
});

// GET /analytics/booking-sources
analyticsRouter.get('/booking-sources', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const sources = await prisma.booking.groupBy({
        by: ['source'],
        where: { tenantId: req.tenantId! },
        _count: { id: true },
      });

      res.json({ success: true, data: sources.map((s) => ({ source: s.source, count: s._count.id })) });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch booking sources' });
  }
});
