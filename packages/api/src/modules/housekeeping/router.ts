import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';

export const housekeepingRouter = Router();
housekeepingRouter.use(authenticate, resolveTenant, requireTenant);

// GET /housekeeping/tasks
housekeepingRouter.get('/tasks', authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { status, date } = req.query;
    const where: any = { tenantId: req.tenantId! };
    if (status) where.status = status;
    if (date) where.taskDate = new Date(date as string);

    await withTenant(req.tenantId!, async () => {
      const tasks = await prisma.housekeepingTask.findMany({
        where,
        include: { room: { select: { roomNumber: true, floor: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: tasks });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// PATCH /housekeeping/tasks/:id/status
housekeepingRouter.patch('/tasks/:id/status', authorize('property_owner', 'general_manager', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed', 'inspected'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const task = await prisma.housekeepingTask.update({
        where: { id: req.params.id },
        data: {
          status,
          ...(status === 'completed' ? { completedAt: new Date() } : {}),
          ...(status === 'inspected' ? { inspectedBy: req.userId } : {}),
        },
      });

      // If task is completed or inspected, mark room as available
      if (status === 'completed' || status === 'inspected') {
        await prisma.room.update({
          where: { id: task.roomId },
          data: { status: 'available' },
        });
      }

      res.json({ success: true, data: task });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

// POST /housekeeping/tasks
housekeepingRouter.post('/tasks', authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { roomId, notes, assignedTo } = req.body;
    if (!roomId) {
      res.status(400).json({ success: false, error: 'roomId is required' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      // Verify room belongs to this tenant
      const room = await prisma.room.findFirst({
        where: { id: roomId, tenantId: req.tenantId! },
      });
      if (!room) {
        res.status(404).json({ success: false, error: 'Room not found' });
        return;
      }

      const task = await prisma.housekeepingTask.create({
        data: {
          tenantId: req.tenantId!,
          roomId,
          taskDate: new Date(),
          status: 'pending',
          notes: notes || null,
          assignedTo: assignedTo || null,
        },
        include: { room: { select: { roomNumber: true, floor: { select: { name: true } } } } },
      });
      res.status(201).json({ success: true, data: task });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// POST /housekeeping/maintenance
housekeepingRouter.post('/maintenance', authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { roomId, category, priority, description } = req.body;

    await withTenant(req.tenantId!, async () => {
      const request = await prisma.maintenanceRequest.create({
        data: {
          tenantId: req.tenantId!,
          roomId,
          raisedBy: req.userId!,
          category: category || 'other',
          priority: priority || 'medium',
          description,
        },
      });
      res.status(201).json({ success: true, data: request });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create maintenance request' });
  }
});
