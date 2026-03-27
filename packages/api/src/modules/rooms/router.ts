import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { floorSchema, roomTypeSchema, roomSchema } from '@istays/shared';
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
        },
        orderBy: [{ floor: { sortOrder: 'asc' } }, { roomNumber: 'asc' }],
      });
      res.json({ success: true, data: rooms });
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
        data: { ...parsed.data, tenantId: req.tenantId! },
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

// PATCH /rooms/:id/status
roomsRouter.patch('/:id/status', authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
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
      // Get all available rooms that are not booked for the given date range
      const where: any = {
        tenantId: req.tenantId!,
        isActive: true,
        status: 'available',
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
                status: { in: ['confirmed', 'checked_in'] },
                checkInDate: { lt: new Date(checkOut as string) },
                checkOutDate: { gt: new Date(checkIn as string) },
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
