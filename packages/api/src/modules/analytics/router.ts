import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager', 'accountant'));

// Helper: IST start/end of day
function istDay(date: Date): { start: Date; end: Date } {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(date.getTime() + IST_OFFSET);
  const y = nowIST.getUTCFullYear(), m = nowIST.getUTCMonth(), d = nowIST.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET);
  const end   = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET);
  return { start, end };
}

// Helper: IST start/end of month
function istMonth(date: Date): { start: Date; end: Date } {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(date.getTime() + IST_OFFSET);
  const y = nowIST.getUTCFullYear(), m = nowIST.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0) - IST_OFFSET);
  const end   = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - IST_OFFSET);
  return { start, end };
}

// GET /analytics/occupancy
analyticsRouter.get('/occupancy', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const totalRooms = await prisma.room.count({ where: { tenantId, isActive: true } });
    const occupiedRooms = await prisma.room.count({ where: { tenantId, status: 'occupied' } });
    const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    res.json({ success: true, data: { totalRooms, occupiedRooms, availableRooms: totalRooms - occupiedRooms, occupancyPercent } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch occupancy' });
  }
});

// GET /analytics/revenue
analyticsRouter.get('/revenue', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const payments = await prisma.guestPayment.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end }, status: 'completed' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBookings = await prisma.booking.count({
      where: { tenantId, createdAt: { gte: start, lte: end } },
    });
    const totalRooms = await prisma.room.count({ where: { tenantId, isActive: true } });
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
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch revenue' });
  }
});

// GET /analytics/booking-sources
analyticsRouter.get('/booking-sources', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const sources = await prisma.booking.groupBy({
      by: ['source'],
      where: { tenantId },
      _count: { id: true },
    });

    res.json({ success: true, data: sources.map((s) => ({ source: s.source, count: s._count.id })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch booking sources' });
  }
});

// GET /analytics/overview-v2?from=YYYY-MM-DD&to=YYYY-MM-DD
// Single enriched endpoint: occupancy + KPIs + today panel + sources + top room types
analyticsRouter.get('/overview-v2', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = istDay(now);
    const thisMonth = istMonth(now);

    // Parse optional date range (defaults to current month)
    const fromStr = req.query.from as string | undefined;
    const toStr   = req.query.to   as string | undefined;

    // Validate dates early — prevent Invalid Date from reaching Prisma
    if (fromStr && isNaN(new Date(fromStr).getTime())) {
      res.status(400).json({ success: false, error: 'Invalid from date — use YYYY-MM-DD' }); return;
    }
    if (toStr && isNaN(new Date(toStr).getTime())) {
      res.status(400).json({ success: false, error: 'Invalid to date — use YYYY-MM-DD' }); return;
    }

    const rangeStart = fromStr ? new Date(fromStr + 'T00:00:00+05:30') : thisMonth.start;
    const rangeEnd   = toStr   ? new Date(toStr   + 'T23:59:59+05:30') : thisMonth.end;

    // Previous period for growth calc (same duration before rangeStart)
    const periodDuration = rangeEnd.getTime() - rangeStart.getTime();
    const prevStart = new Date(rangeStart.getTime() - periodDuration);
    const prevEnd   = new Date(rangeStart.getTime() - 1);

    {
      const tenantId = req.tenantId!;

      // ── 1. Occupancy (live right now) ──────────────────────────────
      const [totalRooms, occupiedRooms] = await Promise.all([
        prisma.room.count({ where: { tenantId, isActive: true } }),
        prisma.room.count({ where: { tenantId, status: 'occupied' } }),
      ]);

      // ── 2. Revenue (current period) ────────────────────────────────
      const [payments, prevPayments] = await Promise.all([
        prisma.guestPayment.findMany({
          where: { tenantId, createdAt: { gte: rangeStart, lte: rangeEnd }, status: 'completed' },
          select: { amount: true },
        }),
        prisma.guestPayment.findMany({
          where: { tenantId, createdAt: { gte: prevStart, lte: prevEnd }, status: 'completed' },
          select: { amount: true },
        }),
      ]);
      const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
      const prevRevenue  = prevPayments.reduce((s, p) => s + p.amount, 0);
      const revenueGrowth = prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
        : null;

      // ── 3. Revenue today ───────────────────────────────────────────
      const todayPayments = await prisma.guestPayment.findMany({
        where: { tenantId, createdAt: { gte: today.start, lte: today.end }, status: 'completed' },
        select: { amount: true },
      });
      const revenueToday = todayPayments.reduce((s, p) => s + p.amount, 0);

      // ── 4. F&B Revenue from POS (current period) ───────────────────
      let fnbRevenue = 0;
      try {
        const posOrders = await (prisma as any).posOrder?.findMany({
          where: { tenantId, createdAt: { gte: rangeStart, lte: rangeEnd }, status: 'paid' },
          select: { total: true },
        });
        if (Array.isArray(posOrders)) {
          fnbRevenue = posOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
        }
      } catch { /* POS table may not exist on all deployments */ }

      // ── 5. Bookings (period) ────────────────────────────────────────
      const [bookings, prevBookings] = await Promise.all([
        prisma.booking.findMany({
          where: { tenantId, createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { id: true, checkInDate: true, checkOutDate: true, status: true, source: true, guestProfileId: true },
        }),
        prisma.booking.findMany({
          where: { tenantId, createdAt: { gte: prevStart, lte: prevEnd } },
          select: { id: true },
        }),
      ]);

      const confirmedBookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status));

      // ADR: revenue / confirmed bookings
      const adr = confirmedBookings.length > 0
        ? Math.round(totalRevenue / confirmedBookings.length)
        : 0;

      // RevPAR: revenue / (rooms × days)
      const days = Math.max(1, Math.ceil(periodDuration / (1000 * 60 * 60 * 24)));
      const revpar = totalRooms > 0 ? Math.round(totalRevenue / (totalRooms * days)) : 0;

      // Avg Length of Stay (nights)
      const stayLengths = confirmedBookings
        .map(b => Math.ceil((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000))
        .filter(n => n > 0);
      const avgLos = stayLengths.length > 0
        ? Math.round((stayLengths.reduce((s, n) => s + n, 0) / stayLengths.length) * 10) / 10
        : 0;

      // No-show rate
      const noShows = bookings.filter(b => b.status === 'no_show').length;
      const noShowRate = bookings.length > 0
        ? Math.round((noShows / bookings.length) * 1000) / 10
        : 0;

      // Cancellation rate
      const cancelled = bookings.filter(b => b.status === 'cancelled').length;
      const cancellationRate = bookings.length > 0
        ? Math.round((cancelled / bookings.length) * 1000) / 10
        : 0;

      // Repeat guest % (within the selected period only — guests booking for the first time
      // in this range but who have prior history in a different range are not counted)
      const guestIds = confirmedBookings.map(b => b.guestProfileId).filter(Boolean) as string[];
      const uniqueGuests = new Set(guestIds);
      const guestBookingCounts = new Map<string, number>();
      guestIds.forEach(id => guestBookingCounts.set(id, (guestBookingCounts.get(id) || 0) + 1));
      const repeatGuests = [...guestBookingCounts.values()].filter(c => c > 1).length;
      const repeatGuestPercent = uniqueGuests.size > 0
        ? Math.round((repeatGuests / uniqueGuests.size) * 100)
        : 0;

      // Pending confirmation count
      const pendingConfirmation = bookings.filter(b => b.status === 'pending_confirmation').length;

      // ── 6. Today panel ─────────────────────────────────────────────
      const [arrivalsToday, departuresToday, checkedInNow] = await Promise.all([
        prisma.booking.count({
          where: { tenantId, checkInDate: { gte: today.start, lte: today.end }, status: { in: ['confirmed', 'pending_confirmation'] } },
        }),
        prisma.booking.count({
          where: { tenantId, checkOutDate: { gte: today.start, lte: today.end }, status: 'checked_in' },
        }),
        prisma.booking.count({
          where: { tenantId, status: 'checked_in', checkOutDate: { lt: today.start } },
        }),
      ]);

      // ── 7. Booking sources ─────────────────────────────────────────
      const sourceGroups = await prisma.booking.groupBy({
        by: ['source'],
        where: { tenantId, createdAt: { gte: rangeStart, lte: rangeEnd } },
        _count: { id: true },
      });
      const bookingSources: Record<string, number> = {};
      sourceGroups.forEach(s => { bookingSources[s.source || 'unknown'] = s._count.id; });

      // ── 8. Top Room Types by Revenue ───────────────────────────────
      const bookingRooms = await prisma.bookingRoom.findMany({
        where: {
          booking: { tenantId, createdAt: { gte: rangeStart, lte: rangeEnd }, status: { notIn: ['cancelled', 'no_show'] } },
        },
        include: { roomType: { select: { name: true, baseRate: true } } },
      });
      const roomTypeRevMap = new Map<string, { name: string; bookings: number; revenue: number }>();
      for (const br of bookingRooms) {
        const name = br.roomType?.name || 'Unknown';
        const existing = roomTypeRevMap.get(name) || { name, bookings: 0, revenue: 0 };
        existing.bookings += 1;
        // Use actual charged rate (ratePerNight) not baseRate for accurate revenue ranking
        existing.revenue += br.ratePerNight;
        roomTypeRevMap.set(name, existing);
      }
      const topRoomTypes = [...roomTypeRevMap.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // ── 9. Guest count ─────────────────────────────────────────────
      const guestCount = await prisma.guestProfile.count({ where: { tenantId } });

      res.json({
        success: true,
        data: {
          occupancy: {
            current: occupiedRooms,
            total: totalRooms,
            percent: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
          },
          revenue: {
            period: Math.round(totalRevenue),
            prev:   Math.round(prevRevenue),
            today:  Math.round(revenueToday),
            fnb:    Math.round(fnbRevenue),
            total:  Math.round(totalRevenue + fnbRevenue),
            growth: revenueGrowth,
          },
          kpi: { adr, revpar, avgLengthOfStay: avgLos, noShowRate, cancellationRate, repeatGuestPercent },
          today: {
            arrivalsExpected:  arrivalsToday,
            departuresExpected: departuresToday,
            overdueCheckouts:  checkedInNow,
            pendingConfirmation,
          },
          bookings: {
            period:  bookings.length,
            prev:    prevBookings.length,
            pending: pendingConfirmation,
          },
          topRoomTypes,
          bookingSources,
          guestCount,
        },
      });
    }
  } catch (err) {
    console.error('[ANALYTICS OVERVIEW-V2 ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics overview' });
  }
});
