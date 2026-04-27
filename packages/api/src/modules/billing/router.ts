import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { folioChargeSchema, paymentSchema } from '@istays/shared';

export const billingRouter = Router();
billingRouter.use(authenticate, resolveTenant, requireTenant);

/**
 * GST calculation.
 * Room slabs are loaded from PlatformSettings (configurable by global admin).
 * For non-room charges (food, laundry, etc.), rates remain fixed per SAC code.
 */

// Default room GST slabs — fallback when PlatformSettings has no custom config
const DEFAULT_ROOM_GST_SLABS = [
  { maxRate: 1000,      gstPercent: 0 },
  { maxRate: 7500,      gstPercent: 12 },
  { maxRate: 99999999,  gstPercent: 18 },
];

async function loadRoomGstSlabs(): Promise<{ maxRate: number; gstPercent: number }[]> {
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'global' } });
    const config = (settings?.config as Record<string, any>) || {};
    if (Array.isArray(config.gstSlabs) && config.gstSlabs.length > 0) {
      return config.gstSlabs
        .map((s: any) => ({ maxRate: Number(s.maxRate), gstPercent: Number(s.gstPercent) }))
        .sort((a: any, b: any) => a.maxRate - b.maxRate);
    }
  } catch (err) {
    console.error('[BILLING GST SLABS] Failed to load from DB, using defaults', err);
  }
  return DEFAULT_ROOM_GST_SLABS;
}

async function calculateGst(unitPrice: number, category: string): Promise<{ rate: number; cgst: number; sgst: number }> {
  let rate = 0;

  if (category === 'room' || category === 'room_upgrade') {
    // GST slab based on declared tariff — loaded from PlatformSettings
    const slabs = await loadRoomGstSlabs();
    let matched = false;
    for (const slab of slabs) {
      if (unitPrice <= slab.maxRate) { rate = slab.gstPercent; matched = true; break; }
    }
    // If rate exceeds ALL slabs, use the last slab's rate as catch-all
    if (!matched && slabs.length > 0) {
      rate = slabs[slabs.length - 1].gstPercent;
    }
  } else if (category === 'food' || category === 'beverage') {
    rate = 5; // Restaurant services in hotels: 5% without ITC
  } else {
    // Other services (laundry, spa, etc.)
    rate = 18;
  }

  const gstAmount = (unitPrice * rate) / 100;
  return { rate, cgst: gstAmount / 2, sgst: gstAmount / 2 };
}

// SAC codes for hotel services (hardcoded but correct as per Indian GST specification)
const SAC_CODES: Record<string, string> = {
  room: '996311',
  room_upgrade: '996311',
  food: '996331',
  beverage: '996331',
  laundry: '998971',
  spa: '999711',
  other: '999799',
};

// GET /billing/:bookingId/folio
billingRouter.get('/:bookingId/folio', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const charges = await prisma.folioCharge.findMany({
        where: { bookingId: req.params.bookingId, tenantId: req.tenantId! },
        orderBy: { chargeDate: 'asc' },
      });
      const payments = await prisma.guestPayment.findMany({
        where: { bookingId: req.params.bookingId, tenantId: req.tenantId! },
        orderBy: { createdAt: 'desc' },
      });

      const totalCharges = charges.reduce((sum, c) => sum + c.totalPrice + c.cgst + c.sgst + c.igst, 0);
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

      res.json({ success: true, data: { charges, payments, totalCharges, totalPayments, balance: totalCharges - totalPayments } });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch folio' });
  }
});

// POST /billing/charge
billingRouter.post('/charge', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    const parsed = folioChargeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;
    const totalPrice = data.quantity * data.unitPrice;
    const gst = await calculateGst(data.unitPrice, data.category);

    const result = await withTenant(req.tenantId!, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true },
      });
      const tenantConfig = (tenant?.config as Record<string, any>) || {};
      const propertyState = tenantConfig.state?.toLowerCase() || '';

      // Verify booking exists and belongs to this tenant
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        select: { id: true, status: true, guestProfile: { select: { state: true } } },
      });
      if (!booking) return { error: 'Booking not found', status: 404 };

      const guestState = booking.guestProfile?.state?.toLowerCase() || '';
      const isInterState = propertyState && guestState && propertyState !== guestState;

      let cgst = 0, sgst = 0, igst = 0, rate = 0;
      if (tenantConfig.gstEnabled) {
        rate = gst.rate;
        if (isInterState) {
          igst = gst.cgst + gst.sgst;
        } else {
          cgst = gst.cgst;
          sgst = gst.sgst;
        }
      }
      
      const totalGst = (cgst + sgst + igst) * data.quantity;

      const charge = await prisma.folioCharge.create({
        data: {
          tenantId: req.tenantId!,
          bookingId: data.bookingId,
          chargeDate: new Date(data.chargeDate),
          category: data.category,
          description: data.description,
          sacCode: data.sacCode || SAC_CODES[data.category] || SAC_CODES.other,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalPrice,
          gstRate: rate,
          cgst: cgst * data.quantity,
          sgst: sgst * data.quantity,
          igst: igst * data.quantity,
        },
      });

      // Update booking balance
      await prisma.booking.update({
        where: { id: data.bookingId },
        data: {
          totalAmount: { increment: totalPrice + totalGst },
          balanceDue: { increment: totalPrice + totalGst },
        },
      });

      return { data: charge };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (err) {
    console.error('[BILLING CHARGE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to add charge' });
  }
});

// POST /billing/payment
billingRouter.post('/payment', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const result = await withTenant(req.tenantId!, async () => {
      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: parsed.data.bookingId },
        select: { id: true, balanceDue: true },
      });
      if (!booking) return { error: 'Booking not found', status: 404 };

      const payment = await prisma.guestPayment.create({
        data: {
          tenantId: req.tenantId!,
          bookingId: parsed.data.bookingId,
          amount: parsed.data.amount,
          method: parsed.data.method,
          status: 'completed',
        },
      });

      // Update booking payment tracking
      await prisma.booking.update({
        where: { id: parsed.data.bookingId },
        data: {
          advancePaid: { increment: parsed.data.amount },
          balanceDue: { decrement: parsed.data.amount },
        },
      });

      return { data: payment };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

// GET /billing/invoices
billingRouter.get('/invoices', authorize('property_owner', 'general_manager', 'accountant'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const invoices = await prisma.invoice.findMany({
        where: { tenantId: req.tenantId! },
        include: { booking: { select: { bookingNumber: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: invoices });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// GET /billing/invoices/:id/pdf
billingRouter.get('/invoices/:id/pdf', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id, tenantId: req.tenantId! },
        include: {
          booking: {
            select: {
              checkInDate: true,
              checkOutDate: true,
              folioCharges: {
                orderBy: { chargeDate: 'asc' as const },
              },
            },
          },
        },
      });

      if (!invoice) {
        res.status(404).json({ success: false, error: 'Invoice not found' });
        return;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: {
          name: true, address: true, city: true, state: true,
          pincode: true, gstNumber: true, contactPhone: true, contactEmail: true,
        },
      });

      // Lazy import the generator so we don't block API boot unnecessarily
      const { buildInvoicePdf } = await import('../../services/pdf-generator');
      
      const pdfBuffer = await buildInvoicePdf(
        invoice, 
        invoice.booking?.folioCharges || [], 
        tenant || {}
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});
