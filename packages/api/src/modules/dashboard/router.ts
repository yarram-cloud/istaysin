import { Router, Request, Response } from 'express';
import { prisma, withTenant, getLocalDate } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, resolveTenant, requireTenant);

// GET /dashboard — today's overview
dashboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    const today = getLocalDate();

    await withTenant(req.tenantId!, async () => {
      const [
        totalRooms,
        occupiedRooms,
        todayCheckIns,
        todayCheckOuts,
        pendingBookings,
        recentBookings,
      ] = await Promise.all([
        prisma.room.count({ where: { tenantId: req.tenantId!, isActive: true } }),
        prisma.room.count({ where: { tenantId: req.tenantId!, status: 'occupied' } }),
        prisma.booking.count({
          where: { tenantId: req.tenantId!, checkInDate: new Date(today), status: { in: ['confirmed', 'checked_in'] } },
        }),
        prisma.booking.count({
          where: { tenantId: req.tenantId!, checkOutDate: new Date(today), status: 'checked_in' },
        }),
        prisma.booking.count({
          where: { tenantId: req.tenantId!, status: 'pending_confirmation' },
        }),
        prisma.booking.findMany({
          where: { tenantId: req.tenantId! },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, bookingNumber: true, guestName: true, checkInDate: true,
            checkOutDate: true, status: true, totalAmount: true, numRooms: true,
          },
        }),
      ]);

      const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Pending housekeeping tasks
      const pendingHousekeeping = await prisma.housekeepingTask.count({
        where: { tenantId: req.tenantId!, status: { in: ['pending', 'in_progress'] } },
      });

      res.json({
        success: true,
        data: {
          today,
          rooms: { total: totalRooms, occupied: occupiedRooms, available: totalRooms - occupiedRooms, occupancyPercent },
          todayCheckIns,
          todayCheckOuts,
          pendingBookings,
          pendingHousekeeping,
          recentBookings,
        },
      });
    });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});
