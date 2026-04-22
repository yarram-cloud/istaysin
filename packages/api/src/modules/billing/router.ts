import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { folioChargeSchema, paymentSchema } from '@istays/shared';

export const billingRouter = Router();
billingRouter.use(authenticate, resolveTenant, requireTenant);

/**
 * GST calculation per the Sep 2025 slabs.
 * Slab is based on the DECLARED TARIFF (per room per night), NOT the actual charged amount.
 *   ≤ ₹1,000  → exempt (0%)
 *   ₹1,001 – ₹7,500  → 12% (6% CGST + 6% SGST)
 *   > ₹7,500  → 18% (9% CGST + 9% SGST)
 *
 * For non-room charges (food, laundry, etc.), default to 5% GST unless SAC code-specific.
 */
function calculateGst(unitPrice: number, category: string): { rate: number; cgst: number; sgst: number } {
  let rate = 0;

  if (category === 'room' || category === 'room_upgrade') {
    // GST slab based on declared tariff (unit price per room per night)
    if (unitPrice > 7500) {
      rate = 18;
    } else if (unitPrice > 1000) {
      rate = 12;
    }
    // ≤ 1000: exempt
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
    const gst = calculateGst(data.unitPrice, data.category);

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
            include: {
              folioCharges: true
            }
          }
        }
      });

      if (!invoice) {
        res.status(404).json({ success: false, error: 'Invoice not found' });
        return;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
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
