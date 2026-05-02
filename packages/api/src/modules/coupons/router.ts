import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { couponSchema, validateCouponSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';

export const couponsRouter = Router();

// Public/Internal Validation endpoint (can be called by frontend before booking)
// POST /coupons/validate
couponsRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const parsed = validateCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { code, bookingAmount, roomTypeId, checkIn } = parsed.data;
    const tenantId = req.headers['x-tenant-id'] as string || (req as any).tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    {
      const coupon = await prisma.coupon.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: code.toUpperCase(),
          },
        },
      });

      if (!coupon || !coupon.isActive) {
        return res.status(404).json({ success: false, error: 'Invalid or inactive promo code' });
      }

      // 1. Date Validation
      const now = new Date();
      if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        return res.status(400).json({ success: false, error: 'Promo code is not yet valid' });
      }
      if (coupon.validUntil && new Date(coupon.validUntil) < now) {
        return res.status(400).json({ success: false, error: 'Promo code has expired' });
      }

      // 2. Usage Validation
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return res.status(400).json({ success: false, error: 'Promo code usage limit reached' });
      }

      // 3. Min Amount Validation
      if (bookingAmount < coupon.minBookingAmount) {
        return res.status(400).json({ 
          success: false, 
          error: `Minimum booking amount of ₹${coupon.minBookingAmount} required for this promo code` 
        });
      }

      // 4. Room Type Validation
      const applicableRoomTypes = (coupon.applicableRoomTypes as string[]) || [];
      if (applicableRoomTypes.length > 0 && !applicableRoomTypes.includes(roomTypeId)) {
        return res.status(400).json({ success: false, error: 'Promo code is not applicable for this room type' });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = (bookingAmount * coupon.discountValue) / 100;
      } else {
        discountAmount = Math.min(coupon.discountValue, bookingAmount);
      }

      res.json({
        success: true,
        data: {
          couponId: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: Math.round(discountAmount),
        },
      });
    }
  } catch (err) {
    console.error('[COUPON VALIDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

// Admin-only routes (requires authentication)
couponsRouter.use(authenticate, resolveTenant, requireTenant);

// GET /coupons
couponsRouter.get('/', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: coupons });
  } catch (err: any) {
    console.error('[COUPON LIST ERROR]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch coupons' });
  }
});

// POST /coupons
couponsRouter.post('/', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = couponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const data = parsed.data;

    await withTenant(req.tenantId!, async () => {
      const coupon = await prisma.coupon.create({
        data: {
          tenantId: req.tenantId!,
          code: data.code.toUpperCase(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          maxUses: data.maxUses,
          minBookingAmount: data.minBookingAmount,
          validFrom: data.validFrom ? new Date(data.validFrom) : null,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          applicableRoomTypes: data.applicableRoomTypes,
          isActive: data.isActive,
        },
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'coupon', coupon.id, { code: coupon.code });

      res.status(201).json({ success: true, data: coupon });
    });
  } catch (err: any) {
    console.error('[COUPON CREATE ERROR]', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }
    res.status(500).json({ success: false, error: err.message || 'Failed to create coupon' });
  }
});

// PATCH /coupons/:id
couponsRouter.patch('/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = couponSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const data = parsed.data;
    const updateData: any = { ...data };
    
    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
    if (data.code) updateData.code = data.code.toUpperCase();

    await withTenant(req.tenantId!, async () => {
      const coupon = await prisma.coupon.update({
        where: { id: req.params.id, tenantId: req.tenantId! },
        data: updateData,
      });

      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'coupon', coupon.id, { code: coupon.code });

      res.json({ success: true, data: coupon });
    });
  } catch (err) {
    console.error('[COUPON UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update coupon' });
  }
});

// DELETE /coupons/:id
couponsRouter.delete('/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      await prisma.coupon.delete({
        where: { id: req.params.id, tenantId: req.tenantId! },
      });

      await logAudit(req.tenantId!, req.userId, 'DELETE', 'coupon', req.params.id);

      res.json({ success: true, message: 'Coupon deleted successfully' });
    });
  } catch (err) {
    console.error('[COUPON DELETE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete coupon' });
  }
});
