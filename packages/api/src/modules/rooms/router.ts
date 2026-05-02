import { validateRequest } from '../../middleware/validate';
import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { floorSchema, roomTypeSchema, roomSchema, updateRoomSchema, updateRoomStatusSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';

export const roomsRouter = Router();

// All room routes require authentication and tenant context
roomsRouter.use(authenticate, resolveTenant, requireTenant);

// ── Floors ──

// GET /rooms/floors
roomsRouter.get('/floors', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const floors = await prisma.floor.findMany({
        where: { tenantId: req.tenantId! },
        orderBy: { sortOrder: 'asc' },
        include: { rooms: { select: { id: true, roomNumber: true, status: true } } },
      });
      res.json({ success: true, data: floors });
    });
  } catch (err) {
    console.error('[ROOMS FLOORS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch floors' });
  }
});

// POST /rooms/floors
roomsRouter.post('/floors', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = floorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const floor = await prisma.floor.create({
        data: { ...parsed.data, tenantId: req.tenantId! },
      });
      await logAudit(req.tenantId!, req.userId, 'CREATE', 'floor', floor.id, parsed.data, req.ip || undefined);
      res.status(201).json({ success: true, data: floor });
    });
  } catch (err) {
    console.error('[ROOMS CREATE FLOOR ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create floor' });
  }
});

// PUT /rooms/floors/:id
roomsRouter.put('/floors/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = floorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const floor = await prisma.floor.update({
        where: { id: req.params.id, tenantId: req.tenantId! },
        data: { ...parsed.data },
      });
      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'floor', floor.id, parsed.data, req.ip || undefined);
      res.json({ success: true, data: floor });
    });
  } catch (err) {
    console.error('[ROOMS UPDATE FLOOR ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update floor' });
  }
});

// ── Room Types ──

// GET /rooms/types
roomsRouter.get('/types', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const types = await prisma.roomType.findMany({
        where: { tenantId: req.tenantId!, isActive: true },
        include: {
          photos: { orderBy: { sortOrder: 'asc' }, take: 3 },
          _count: { select: { rooms: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: types });
    });
  } catch (err) {
    console.error('[ROOMS TYPES ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch room types' });
  }
});

// POST /rooms/types
roomsRouter.post('/types', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = roomTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await withTenant(req.tenantId!, async () => {
      const roomType = await prisma.roomType.create({
        data: { ...parsed.data, slug, tenantId: req.tenantId! },
      });
      await logAudit(req.tenantId!, req.userId, 'CREATE', 'room_type', roomType.id, parsed.data, req.ip || undefined);
      res.status(201).json({ success: true, data: roomType });
    });
  } catch (err) {
    console.error('[ROOMS CREATE TYPE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create room type' });
  }
});

// PUT /rooms/types/:id
roomsRouter.put('/types/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = roomTypeSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      // First, fetch the existing record to verify it belongs to this tenant
      const existing = await prisma.roomType.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId! }
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Room type not found' });
        return;
      }

      const updateData: any = { ...parsed.data };
      if (parsed.data.name) {
        updateData.slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      const roomType = await prisma.roomType.update({
        where: { id: req.params.id },
        data: updateData,
      });
      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'room_type', roomType.id, parsed.data, req.ip || undefined);
      res.json({ success: true, data: roomType });
    });
  } catch (err) {
    console.error('[ROOMS UPDATE TYPE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update room type' });
  }
});

// ── Room Type Delete (must be before DELETE /:id to avoid shadowing) ──

// DELETE /rooms/types/:id (soft-delete)
roomsRouter.delete('/types/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const roomCount = await prisma.room.count({
        where: { roomTypeId: req.params.id, tenantId: req.tenantId!, isActive: true },
      });
      if (roomCount > 0) {
        res.status(400).json({ success: false, error: `Cannot delete type with ${roomCount} active room(s). Remove rooms first.` });
        return;
      }

      await prisma.roomType.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      await logAudit(req.tenantId!, req.userId, 'DELETE', 'room_type', req.params.id, {}, req.ip || undefined);
      res.json({ success: true, message: 'Room type deleted' });
    });
  } catch (err) {
    console.error('[ROOMS DELETE TYPE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete room type' });
  }
});

// ── Floor Delete (must be before DELETE /:id to avoid shadowing) ──

// DELETE /rooms/floors/:id
roomsRouter.delete('/floors/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      // Check if floor has active rooms
      const roomCount = await prisma.room.count({
        where: { floorId: req.params.id, tenantId: req.tenantId!, isActive: true },
      });
      if (roomCount > 0) {
        res.status(400).json({ success: false, error: `Cannot delete floor with ${roomCount} active room(s). Remove rooms first.` });
        return;
      }

      await prisma.floor.delete({ where: { id: req.params.id } });
      await logAudit(req.tenantId!, req.userId, 'DELETE', 'floor', req.params.id, {}, req.ip || undefined);
      res.json({ success: true, message: 'Floor deleted' });
    });
  } catch (err) {
    console.error('[ROOMS DELETE FLOOR ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete floor' });
  }
});

// ── Rooms ──

// GET /rooms
roomsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, floorId, roomTypeId } = req.query;
    const where: any = { tenantId: req.tenantId!, isActive: true };
    if (status) where.status = status;
    if (floorId) where.floorId = floorId;
    if (roomTypeId) where.roomTypeId = roomTypeId;

    await withTenant(req.tenantId!, async () => {
      const rooms = await prisma.room.findMany({
        where,
        include: {
          floor: { select: { id: true, name: true } },
          roomType: { select: { id: true, name: true, baseRate: true, amenities: true } },
          // Active checked-in booking room — used to expose advance & security deposit
          bookingRooms: {
            where: { booking: { status: 'checked_in' } },
            select: {
              id: true,
              advanceAmount: true,
              securityDeposit: true,
              securityDepositStatus: true,
              booking: {
                select: { id: true, bookingNumber: true, guestName: true, checkInDate: true, checkOutDate: true },
              },
            },
            take: 1,
          },
        },
        orderBy: [{ floor: { sortOrder: 'asc' } }, { roomNumber: 'asc' }],
      });

      // Flatten the active occupancy into a stable shape on each room
      const data = rooms.map((r) => {
        const active = r.bookingRooms[0];
        const { bookingRooms, ...rest } = r as any;
        return {
          ...rest,
          currentOccupancy: active
            ? {
                bookingRoomId: active.id,
                advanceAmount: active.advanceAmount,
                securityDeposit: active.securityDeposit,
                securityDepositStatus: active.securityDepositStatus,
                booking: active.booking,
              }
            : null,
        };
      });

      res.json({ success: true, data });
    });
  } catch (err) {
    console.error('[ROOMS LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
  }
});

// POST /rooms
roomsRouter.post('/', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = roomSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const room = await prisma.room.create({
        data: { ...parsed.data, features: parsed.data.features as any, tenantId: req.tenantId! },
        include: {
          floor: { select: { id: true, name: true } },
          roomType: { select: { id: true, name: true, baseRate: true } },
        },
      });
      await logAudit(req.tenantId!, req.userId, 'CREATE', 'room', room.id, parsed.data, req.ip || undefined);
      res.status(201).json({ success: true, data: room });
    });
  } catch (err) {
    console.error('[ROOMS CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create room' });
  }
});

// PUT /rooms/:id
roomsRouter.put('/:id', validateRequest(updateRoomSchema), authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { roomNumber, floorId, roomTypeId, status, rateOverride } = req.body;
    if (!roomNumber?.trim()) {
      res.status(400).json({ success: false, error: 'Room number is required' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      // Verify room belongs to this tenant
      const existing = await prisma.room.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId! },
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Room not found' });
        return;
      }

      const room = await prisma.room.update({
        where: { id: req.params.id },
        data: {
          ...(roomNumber && { roomNumber: roomNumber.trim() }),
          ...(floorId && { floorId }),
          ...(roomTypeId && { roomTypeId }),
          ...(status && { status }),
          ...(rateOverride !== undefined && { rateOverride: rateOverride === null ? null : parseFloat(rateOverride) }),
        },
        include: {
          floor: { select: { id: true, name: true } },
          roomType: { select: { id: true, name: true, baseRate: true } },
        },
      });
      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'room', room.id, req.body, req.ip || undefined);
      res.json({ success: true, data: room });
    });
  } catch (err) {
    console.error('[ROOMS UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update room' });
  }
});

// DELETE /rooms/:id (soft-delete)
roomsRouter.delete('/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.room.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId! },
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Room not found' });
        return;
      }

      await prisma.room.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      await logAudit(req.tenantId!, req.userId, 'DELETE', 'room', req.params.id, {}, req.ip || undefined);
      res.json({ success: true, message: 'Room deleted' });
    });
  } catch (err) {
    console.error('[ROOMS DELETE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete room' });
  }
});

// PATCH /rooms/:id/status
roomsRouter.patch('/:id/status', validateRequest(updateRoomStatusSchema), authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    // Canonical status list — keep in sync with updateRoomStatusSchema in @istays/shared
    const validStatuses = ['available', 'occupied', 'blocked', 'maintenance', 'dirty', 'cleaning'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const room = await prisma.room.update({
        where: { id: req.params.id },
        data: { status },
      });
      await logAudit(req.tenantId!, req.userId, 'UPDATE_STATUS', 'room', room.id, { status }, req.ip || undefined);
      res.json({ success: true, data: room });
    });
  } catch (err) {
    console.error('[ROOMS STATUS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update room status' });
  }
});

// GET /rooms/availability
roomsRouter.get('/availability', async (req: Request, res: Response) => {
  try {
    const { checkIn, checkOut, roomTypeId } = req.query;
    if (!checkIn || !checkOut) {
      res.status(400).json({ success: false, error: 'checkIn and checkOut dates are required' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      // Get all active rooms excluding permanently blocked ones.
      // Do NOT filter by current room.status — a room occupied TODAY
      // may be free on future requested dates.
      const checkInDt = new Date(checkIn as string + 'T12:00:00+05:30');
      const checkOutDt = new Date(checkOut as string + 'T12:00:00+05:30');
      const where: any = {
        tenantId: req.tenantId!,
        isActive: true,
        status: { notIn: ['blocked', 'maintenance'] },
      };
      if (roomTypeId) where.roomTypeId = roomTypeId;

      const rooms = await prisma.room.findMany({
        where,
        include: {
          floor: { select: { id: true, name: true } },
          roomType: { select: { id: true, name: true, baseRate: true, amenities: true, maxOccupancy: true } },
          bookingRooms: {
            where: {
              booking: {
                status: { in: ['pending_confirmation', 'confirmed', 'checked_in'] },
                checkInDate: { lt: checkOutDt },
                checkOutDate: { gt: checkInDt },
              },
            },
          },
        },
      });

      // Filter out rooms that have active bookings in the range
      const availableRooms = rooms.filter((r) => r.bookingRooms.length === 0);

      res.json({ success: true, data: availableRooms });
    });
  } catch (err) {
    console.error('[ROOMS AVAILABILITY ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
});

// GET /rooms/availability-grid — tape chart data (single optimized query)
roomsRouter.get('/availability-grid', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate are required (YYYY-MM-DD)' });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0 || diffDays > 31) {
      res.status(400).json({ success: false, error: 'Date range must be 1-31 days.' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const rooms = await prisma.room.findMany({
        where: { tenantId: req.tenantId!, isActive: true },
        include: {
          floor: { select: { id: true, name: true, sortOrder: true } },
          roomType: { select: { id: true, name: true, baseRate: true } },
          bookingRooms: {
            where: {
              booking: {
                status: { notIn: ['cancelled'] },
                checkInDate: { lt: end },
                checkOutDate: { gt: start },
              },
            },
            include: {
              booking: {
                select: {
                  id: true, bookingNumber: true, guestName: true,
                  guestPhone: true, guestEmail: true,
                  checkInDate: true, checkOutDate: true,
                  status: true, totalAmount: true, source: true,
                  numAdults: true, numChildren: true,
                },
              },
            },
          },
        },
        orderBy: [{ floor: { sortOrder: 'asc' } }, { roomNumber: 'asc' }],
      });

      const unassigned = await prisma.bookingRoom.findMany({
        where: {
          tenantId: req.tenantId!,
          roomId: null,
          booking: {
            status: { notIn: ['cancelled'] },
            checkInDate: { lt: end },
            checkOutDate: { gt: start },
          },
        },
        include: {
          booking: {
            select: {
              id: true, bookingNumber: true, guestName: true,
              guestPhone: true, checkInDate: true, checkOutDate: true,
              status: true, totalAmount: true, source: true,
            },
          },
          roomType: { select: { id: true, name: true } },
        },
      });

      res.json({ success: true, data: { rooms, unassigned } });
    });
  } catch (err) {
    console.error('[AVAILABILITY GRID ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch availability grid' });
  }
});
