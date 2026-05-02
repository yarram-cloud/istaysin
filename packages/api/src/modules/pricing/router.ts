import { validateRequest } from '../../middleware/validate';
import { createPricingSchema, updatePricingSchema } from '@istays/shared';
import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authorize } from '../../middleware/rbac';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';

export const pricingRouter = Router();

pricingRouter.use(authenticate, resolveTenant, requireTenant);

// GET /pricing
pricingRouter.get('/', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const rules = await prisma.pricingRule.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: { roomType: { select: { name: true } } },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch pricing rules' });
  }
});

// POST /pricing
pricingRouter.post('/', validateRequest(createPricingSchema), authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, daysOfWeek, roomTypeId, adjustmentType, adjustmentValue, priority, isActive } = req.body;
    
    if (!name || !adjustmentType || typeof adjustmentValue !== 'number') {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const rule = await prisma.pricingRule.create({
        data: {
          tenantId: req.tenantId!,
          name,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [],
          roomTypeId: roomTypeId || null,
          adjustmentType,
          adjustmentValue,
          priority: priority || 0,
          isActive: isActive !== undefined ? isActive : true,
        },
        include: { roomType: { select: { name: true } } },
      });
      res.status(201).json({ success: true, data: rule });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create pricing rule' });
  }
});

// PUT /pricing/:id
pricingRouter.put('/:id', validateRequest(updatePricingSchema), authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, daysOfWeek, roomTypeId, adjustmentType, adjustmentValue, priority, isActive } = req.body;

    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.pricingRule.findFirst({ where: { id, tenantId: req.tenantId! } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Rule not found' });
        return;
      }

      const rule = await prisma.pricingRule.update({
        where: { id },
        data: {
          name,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
          daysOfWeek: daysOfWeek !== undefined ? (Array.isArray(daysOfWeek) ? daysOfWeek : []) : undefined,
          roomTypeId: roomTypeId !== undefined ? (roomTypeId || null) : undefined,
          adjustmentType,
          adjustmentValue,
          priority,
          isActive,
        },
        include: { roomType: { select: { name: true } } },
      });
      res.json({ success: true, data: rule });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update pricing rule' });
  }
});

// DELETE /pricing/:id
pricingRouter.delete('/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.pricingRule.findFirst({ where: { id, tenantId: req.tenantId! } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Rule not found' });
        return;
      }
      await prisma.pricingRule.delete({ where: { id } });
      res.json({ success: true, message: 'Rule deleted' });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete pricing rule' });
  }
});
