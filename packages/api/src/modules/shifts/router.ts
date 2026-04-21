import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { z } from 'zod';
import { logAudit } from '../../middleware/audit-log';

export const shiftsRouter = Router();

shiftsRouter.use(authenticate, resolveTenant, requireTenant);

const baseShiftSchema = z.object({
  userId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  role: z.string().min(1),
  notes: z.string().optional(),
  startingFloat: z.number().nonnegative().default(0)
});

const shiftSchema = baseShiftSchema.refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: "End time must be after start time",
  path: ["endTime"]
});

// GET /shifts
shiftsRouter.get('/', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const { start, end, userId } = req.query;
    
    await withTenant(req.tenantId!, async () => {
      const where: any = { tenantId: req.tenantId! };
      
      if (userId && typeof userId === 'string') {
        where.userId = userId;
      }
      
      if (start || end) {
        where.startTime = {};
        if (start) {
          const d = new Date(start as string);
          if (!isNaN(d.getTime())) where.startTime.gte = d;
        }
        if (end) {
          const d = new Date(end as string);
          if (!isNaN(d.getTime())) where.startTime.lte = d;
        }
      }

      const shifts = await prisma.staffShift.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { startTime: 'asc' }
      });

      res.json({ success: true, data: shifts });
    });
  } catch (err) {
    console.error('[SHIFTS LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch shifts' });
  }
});

// POST /shifts
shiftsRouter.post('/', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = shiftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;

    await withTenant(req.tenantId!, async () => {
      // Ensure user belongs to tenant
      const membership = await prisma.tenantMembership.findFirst({
        where: { tenantId: req.tenantId!, userId: data.userId }
      });

      if (!membership) {
        res.status(404).json({ success: false, error: 'User is not a staff member of this property' });
        return;
      }

      const shift = await prisma.staffShift.create({
        data: {
          tenantId: req.tenantId!,
          userId: data.userId,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          role: data.role,
          notes: data.notes,
          startingFloat: data.startingFloat,
          status: 'scheduled'
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } }
        }
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'staff_shift', shift.id, { role: data.role }, req.ip || undefined);

      res.status(201).json({ success: true, data: shift, message: 'Shift created successfully' });
    });
  } catch (err) {
    console.error('[SHIFTS CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create shift' });
  }
});

// PUT /shifts/:id
const updateShiftSchema = baseShiftSchema.partial().extend({
  status: z.enum(['scheduled', 'completed', 'missed']).optional(),
  endingFloat: z.number().nonnegative().optional(),
  cashDiscrepancy: z.number().optional(),
  handoverNotes: z.string().optional()
});

shiftsRouter.put('/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = updateShiftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;
    const updateData: any = {};
    if (data.userId) updateData.userId = data.userId;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.role) updateData.role = data.role;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;
    if (data.startingFloat !== undefined) updateData.startingFloat = data.startingFloat;
    if (data.endingFloat !== undefined) updateData.endingFloat = data.endingFloat;
    if (data.cashDiscrepancy !== undefined) updateData.cashDiscrepancy = data.cashDiscrepancy;
    if (data.handoverNotes !== undefined) updateData.handoverNotes = data.handoverNotes;

    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.staffShift.findUnique({ where: { id: req.params.id }});
      if (!existing || existing.tenantId !== req.tenantId) {
        res.status(404).json({ success: false, error: 'Shift not found' });
        return;
      }

      if (data.userId && data.userId !== existing.userId) {
        const mem = await prisma.tenantMembership.findFirst({
           where: { tenantId: req.tenantId!, userId: data.userId }
        });
        if (!mem) return res.status(404).json({ success: false, error: 'New user is not a staff member' });
      }

      const shift = await prisma.staffShift.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          user: { select: { id: true, fullName: true, email: true } }
        }
      });

      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'staff_shift', shift.id, {}, req.ip || undefined);

      res.json({ success: true, data: shift, message: 'Shift updated successfully' });
    });
  } catch (err) {
    console.error('[SHIFTS UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update shift' });
  }
});

// DELETE /shifts/:id
shiftsRouter.delete('/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.staffShift.findUnique({ where: { id: req.params.id }});
      if (!existing || existing.tenantId !== req.tenantId) {
        res.status(404).json({ success: false, error: 'Shift not found' });
        return;
      }

      await prisma.staffShift.delete({ where: { id: req.params.id }});
      await logAudit(req.tenantId!, req.userId, 'DELETE', 'staff_shift', req.params.id, {}, req.ip || undefined);

      res.json({ success: true, message: 'Shift deleted successfully' });
    });
  } catch (err) {
    console.error('[SHIFTS DELETE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete shift' });
  }
});
