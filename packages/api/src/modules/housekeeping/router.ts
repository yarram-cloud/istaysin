import { validateRequest } from '../../middleware/validate';
import { updateTaskStatusSchema, updateTaskSchema, createTaskSchema, createMaintenanceSchema } from '@istays/shared';
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

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      include: { room: { select: { roomNumber: true, floor: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// PATCH /housekeeping/tasks/:id/status
housekeepingRouter.patch('/tasks/:id/status', validateRequest(updateTaskStatusSchema), authorize('property_owner', 'general_manager', 'housekeeping', 'front_desk'), async (req: Request, res: Response) => {
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

      // Update room housekeeping status based on task completion
      if (status === 'completed') {
        await prisma.room.update({
          where: { id: task.roomId },
          data: { housekeepingStatus: 'clean' },
        });
      } else if (status === 'inspected') {
        await prisma.room.update({
          where: { id: task.roomId },
          data: { housekeepingStatus: 'inspected' },
        });
      } else if (status === 'in_progress') {
        await prisma.room.update({
          where: { id: task.roomId },
          data: { housekeepingStatus: 'cleaning' },
        });
      }

      res.json({ success: true, data: task });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update task status' });
  }
});

// PATCH /housekeeping/tasks/:id
housekeepingRouter.patch('/tasks/:id', validateRequest(updateTaskSchema), authorize('property_owner', 'general_manager', 'housekeeping', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const { assignedTo, checklist, notes } = req.body;

    await withTenant(req.tenantId!, async () => {
      const task = await prisma.housekeepingTask.update({
        where: { id: req.params.id },
        data: {
          ...(assignedTo !== undefined ? { assignedTo } : {}),
          ...(checklist !== undefined ? { checklist } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: { room: { select: { roomNumber: true, floor: { select: { name: true } } } } },
      });
      res.json({ success: true, data: task });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

// POST /housekeeping/tasks
housekeepingRouter.post('/tasks', validateRequest(createTaskSchema), authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const { roomId, notes, assignedTo, taskType, priority } = req.body;
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

      // Generate default checklist based on taskType
      const tType = taskType || 'cleaning';
      let defaultChecklist: { id: string; item: string; done: boolean }[] = [];
      if (tType === 'cleaning' || tType === 'deep_cleaning') {
        defaultChecklist = [
          { id: '1', item: 'Change bed linen', done: false },
          { id: '2', item: 'Replace towels', done: false },
          { id: '3', item: 'Clean bathroom', done: false },
          { id: '4', item: 'Vacuum floor', done: false },
          { id: '5', item: 'Empty trash', done: false },
          { id: '6', item: 'Restock amenities', done: false },
        ];
        if (tType === 'deep_cleaning') {
          defaultChecklist.push({ id: '7', item: 'Clean windows and curtains', done: false });
          defaultChecklist.push({ id: '8', item: 'Deep clean carpets', done: false });
        }
      } else if (tType === 'inspection') {
        defaultChecklist = [
          { id: '1', item: 'Check cleanliness', done: false },
          { id: '2', item: 'Check amenities', done: false },
          { id: '3', item: 'Check electronics', done: false },
        ];
      }

      const task = await prisma.housekeepingTask.create({
        data: {
          tenantId: req.tenantId!,
          roomId,
          taskDate: new Date(),
          status: 'pending',
          taskType: tType,
          priority: priority || 'normal',
          checklist: defaultChecklist,
          notes: notes || null,
          assignedTo: assignedTo || null,
        },
        include: { room: { select: { roomNumber: true, floor: { select: { name: true } } } } },
      });

      // Update room status to reflect it needs attention
      await prisma.room.update({
        where: { id: roomId },
        data: { housekeepingStatus: 'dirty' },
      });

      res.status(201).json({ success: true, data: task });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// POST /housekeeping/maintenance
housekeepingRouter.post('/maintenance', validateRequest(createMaintenanceSchema), authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
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

// GET /housekeeping/staff
housekeepingRouter.get('/staff', authorize('property_owner', 'general_manager', 'front_desk', 'housekeeping'), async (req: Request, res: Response) => {
  try {
    const staffMembers = await prisma.tenantMembership.findMany({
      where: { 
        tenantId: req.tenantId!,
        role: { in: ['housekeeping', 'general_manager', 'property_owner'] },
        isActive: true
      },
      include: { user: { select: { id: true, fullName: true, email: true } } }
    });
    const formatted = staffMembers.map(s => ({
      id: s.userId,
      fullName: s.user?.fullName,
      email: s.user?.email,
      role: s.role
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch housekeeping staff' });
  }
});


