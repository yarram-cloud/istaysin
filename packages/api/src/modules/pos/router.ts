import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { z } from 'zod';
import { logAudit } from '../../middleware/audit-log';

export const posRouter = Router();
posRouter.use(authenticate, resolveTenant, requireTenant);

// --- Outlets ---
const outletSchema = z.object({
  name: z.string().min(2)
});

// GET /pos/outlets
posRouter.get('/outlets', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const outlets = await (prisma as any).posOutlet.findMany({
        where: { tenantId: req.tenantId! },
        include: { _count: { select: { orders: true, items: true } } },
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: outlets });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list POS outlets' });
  }
});

// POST /pos/outlets
posRouter.post('/outlets', authorize('property_owner', 'general_manager', 'fnb_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = outletSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const outlet = await (prisma as any).posOutlet.create({
        data: { tenantId: req.tenantId!, name: parsed.data.name }
      });
      
      await logAudit(req.tenantId!, req.userId, 'CREATE', 'pos-outlet', outlet.id, parsed.data, req.ip || undefined);
      res.json({ success: true, data: outlet });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create POS Outlet' });
  }
});

// --- Menu Items ---
const menuSchema = z.object({
  outletId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional()
});

// GET /pos/menu?outletId=xxx
posRouter.get('/menu', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const where: any = { tenantId: req.tenantId! };
      if (req.query.outletId) where.outletId = req.query.outletId;
      if (req.query.category) where.category = req.query.category;
      
      const items = await (prisma as any).menuItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      });
      res.json({ success: true, data: items });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list menu items' });
  }
});

// POST /pos/menu
posRouter.post('/menu', authorize('property_owner', 'general_manager', 'fnb_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = menuSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const item = await (prisma as any).menuItem.create({
        data: { tenantId: req.tenantId!, ...parsed.data }
      });
      
      res.json({ success: true, data: item });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create Menu Item' });
  }
});

// --- Orders ---
const orderSchema = z.object({
  outletId: z.string(),
  items: z.array(z.object({
    itemId: z.string().optional(),
    name: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
    notes: z.string().optional()
  }))
});

/**
 * Compute F&B GST based on tenant configuration.
 * Indian GST Rules for Restaurants in Hotels:
 * - Standalone restaurants (not in hotel): 5% without ITC
 * - In hotels with room tariff <= ₹7,500: 5% without ITC
 * - In hotels with room tariff > ₹7,500: 18% with ITC
 * - Outdoor catering: 5% without ITC
 * - Alcohol: State Excise (not GST) — excluded
 *
 * This reads from tenant.config.fnbGstRate if explicitly set,
 * otherwise defaults based on property type.
 */
async function getFnbGstRate(tenantId: string): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { config: true, propertyType: true }
  });
  const config = (tenant?.config as Record<string, any>) || {};

  // If the tenant has explicitly configured their F&B GST rate, use it
  if (typeof config.fnbGstRate === 'number') {
    return config.fnbGstRate;
  }

  // Auto-detect based on property type and average room rate
  if (config.fnbGstType === '18_with_itc') return 0.18;
  if (config.fnbGstType === '5_no_itc') return 0.05;
  if (config.fnbGstType === 'exempt') return 0;

  // Default: 5% for most Indian budget/mid-range hotels
  return 0.05;
}

// GET /pos/orders
posRouter.get('/orders', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const where: any = { tenantId: req.tenantId! };
      if (req.query.outletId) where.outletId = req.query.outletId;
      if (req.query.status) where.status = req.query.status;

      const orders = await (prisma as any).posOrder.findMany({
        where,
        include: { items: true, outlet: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(req.query.limit as string || '50'), 200)
      });
      res.json({ success: true, data: orders });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list orders' });
  }
});

// GET /pos/orders/:id
posRouter.get('/orders/:id', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const order = await (prisma as any).posOrder.findUnique({
        where: { id: req.params.id },
        include: { items: true, outlet: true }
      });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      res.json({ success: true, data: order });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// POST /pos/orders
posRouter.post('/orders', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    let subtotal = 0;
    const orderItemsData = parsed.data.items.map(i => {
      const totalPrice = i.quantity * i.unitPrice;
      subtotal += totalPrice;
      return {
        itemId: i.itemId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: totalPrice,
        notes: i.notes
      };
    });

    // Dynamic GST rate from tenant configuration
    const gstRate = await getFnbGstRate(req.tenantId!);
    const taxes = Math.round(subtotal * gstRate * 100) / 100;
    const totalAmount = subtotal + taxes;

    await withTenant(req.tenantId!, async () => {
      const order = await (prisma as any).posOrder.create({
        data: {
          tenantId: req.tenantId!,
          outletId: parsed.data.outletId,
          subtotal,
          taxes,
          totalAmount,
          status: 'open',
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });
      
      res.json({ success: true, data: order });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create POS Order' });
  }
});

// PUT /pos/orders/:id/void — Void an open order
posRouter.put('/orders/:id/void', authorize('property_owner', 'general_manager', 'fnb_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const order = await (prisma as any).posOrder.findUnique({ where: { id: req.params.id } });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      if (order.status !== 'open') {
        res.status(400).json({ success: false, error: 'Can only void open orders' });
        return;
      }
      const updated = await (prisma as any).posOrder.update({
        where: { id: req.params.id },
        data: { status: 'voided' }
      });
      await logAudit(req.tenantId!, req.userId, 'VOID', 'pos-order', order.id, {}, req.ip || undefined);
      res.json({ success: true, data: updated });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to void order' });
  }
});

// PUT /pos/orders/:id/settle — Cash/UPI settlement
posRouter.put('/orders/:id/settle', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const order = await (prisma as any).posOrder.findUnique({ where: { id: req.params.id } });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      if (order.status !== 'open') {
        res.status(400).json({ success: false, error: 'Can only settle open orders' });
        return;
      }
      const updated = await (prisma as any).posOrder.update({
        where: { id: req.params.id },
        data: { status: 'settled' }
      });
      await logAudit(req.tenantId!, req.userId, 'SETTLE', 'pos-order', order.id, { method: req.body.method || 'cash' }, req.ip || undefined);
      res.json({ success: true, data: updated });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to settle order' });
  }
});

// --- Push POS Order to Room Folio ---
const chargeRoomSchema = z.object({
  bookingId: z.string(),
  roomNumber: z.string().optional()
});

posRouter.post('/orders/:orderId/charge-to-room', authorize('property_owner', 'general_manager', 'fnb_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = chargeRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const orderId = req.params.orderId;
    
    await withTenant(req.tenantId!, async () => {
      const order = await (prisma as any).posOrder.findUnique({
        where: { id: orderId },
        include: { outlet: true }
      });

      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      if (order.status !== 'open') {
        res.status(400).json({ success: false, error: 'Order is already settled or voided' });
        return;
      }

      const booking = await (prisma.booking as any).findUnique({
        where: { id: parsed.data.bookingId },
        include: { bookingGuests: { select: { guestState: true }, take: 1 } }
      });

      if (!booking || booking.status !== 'checked_in') {
        res.status(400).json({ success: false, error: 'Target booking is not actively checked in' });
        return;
      }

      // Determine GST split (CGST+SGST vs IGST) based on guest vs property state
      const tenantInfo = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { state: true }
      });
      const propertyState = tenantInfo?.state || '';
      const guestState = (booking as any).bookingGuests?.[0]?.guestState || '';
      const isInterState = !!(guestState && propertyState && guestState.toLowerCase().trim() !== propertyState.toLowerCase().trim());

      const cgst = isInterState ? 0 : order.taxes / 2;
      const sgst = isInterState ? 0 : order.taxes / 2;
      const igst = isInterState ? order.taxes : 0;

      // Normalize charge date to midnight UTC
      const chargeDate = new Date();
      chargeDate.setUTCHours(0, 0, 0, 0);

      // Finalize the routing
      await prisma.$transaction([
        (prisma as any).posOrder.update({
          where: { id: orderId },
          data: {
            status: 'charged_to_room',
            bookingId: booking.id
          }
        }),
        prisma.folioCharge.create({
          data: {
            tenantId: req.tenantId!,
            bookingId: booking.id,
            description: `F&B: ${order.outlet.name} (Order #${orderId.substring(0,6).toUpperCase()})`,
            sacCode: '996331',
            quantity: 1,
            unitPrice: order.subtotal,
            totalPrice: order.subtotal,
            cgst,
            sgst,
            igst,
            chargeDate,
            category: 'food',
            isAutoGenerated: true
          }
        })
      ]);

      await logAudit(req.tenantId!, req.userId, 'POS_CHARGE_TO_ROOM', 'pos-order', orderId, { bookingId: booking.id }, req.ip || undefined);
    });
    
    res.json({ success: true, message: 'Successfully routed to guest folio' });
  } catch (err) {
    console.error('[POS CHARGE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to charge POS order to room' });
  }
});
