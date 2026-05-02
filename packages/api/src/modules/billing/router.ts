import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { folioChargeSchema, paymentSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';

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
    const tenantId = req.tenantId!;
    const charges = await prisma.folioCharge.findMany({
      where: { bookingId: req.params.bookingId, tenantId },
      orderBy: { chargeDate: 'asc' },
    });
    const payments = await prisma.guestPayment.findMany({
      where: { bookingId: req.params.bookingId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const totalCharges = charges.reduce((sum, c) => sum + c.totalPrice + c.cgst + c.sgst + c.igst, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ success: true, data: { charges, payments, totalCharges, totalPayments, balance: totalCharges - totalPayments } });
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
      // Read state from top-level tenant column (not config JSON) — fixes inter-state IGST split
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true, state: true },
      });
      const tenantConfig = (tenant?.config as Record<string, any>) || {};
      const propertyState = (tenant?.state ?? '').toLowerCase();

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

// DELETE /billing/charge/:chargeId — remove a mistaken folio charge
billingRouter.delete('/charge/:chargeId', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    const result = await withTenant(req.tenantId!, async () => {
      const charge = await prisma.folioCharge.findUnique({
        where: { id: req.params.chargeId },
        include: { booking: { select: { id: true, status: true, tenantId: true } } },
      });

      if (!charge) return { error: 'Charge not found', status: 404 };
      if (charge.tenantId !== req.tenantId) return { error: 'Not authorised', status: 403 };
      // Allow deletion on checked_in bookings; also allow for checked_out if user is owner/manager
      // (accountants may need to void charges after checkout for invoice corrections)
      const allowedStatuses = ['checked_in', 'confirmed'];
      const isOwnerOrManager = ['property_owner', 'general_manager', 'accountant'].includes(req.user?.role || '');
      if (!allowedStatuses.includes(charge.booking.status) && !isOwnerOrManager) {
        return { error: 'Cannot delete charge on a checked-out or cancelled booking', status: 400 };
      }

      const chargeTotal = charge.totalPrice + charge.cgst + charge.sgst + charge.igst;

      await prisma.$transaction([
        prisma.folioCharge.delete({ where: { id: req.params.chargeId } }),
        prisma.booking.update({
          where: { id: charge.bookingId },
          data: {
            totalAmount: { decrement: chargeTotal },
            balanceDue:  { decrement: chargeTotal },
          },
        }),
      ]);

      return { data: { deleted: true } };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('[BILLING DELETE CHARGE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete charge' });
  }
});

// PATCH /billing/charge/:chargeId — edit description, amount, quantity, category, or chargeDate
billingRouter.patch('/charge/:chargeId', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    const { description, unitPrice, quantity, category, chargeDate } = req.body;

    // Validate chargeDate if provided
    if (chargeDate && !/^\d{4}-\d{2}-\d{2}$/.test(chargeDate)) {
      res.status(400).json({ success: false, error: 'chargeDate must be YYYY-MM-DD format' });
      return;
    }

    // At least one editable field required
    if (!description && unitPrice === undefined && quantity === undefined && !category && !chargeDate) {
      res.status(400).json({ success: false, error: 'No editable fields provided' });
      return;
    }

    const result = await withTenant(req.tenantId!, async () => {
      const charge = await prisma.folioCharge.findUnique({
        where: { id: req.params.chargeId },
        include: { booking: { select: { id: true, status: true, tenantId: true } } },
      });

      if (!charge) return { error: 'Charge not found', status: 404 };
      if (charge.tenantId !== req.tenantId) return { error: 'Not authorised', status: 403 };

      const newUnitPrice  = typeof unitPrice === 'number' && unitPrice > 0  ? unitPrice  : charge.unitPrice;
      const newQty        = typeof quantity  === 'number' && quantity  >= 1  ? Math.floor(quantity) : charge.quantity;
      const newCategory   = category || charge.category;
      const newDesc       = description?.trim() || charge.description;
      const newTotalPrice = newUnitPrice * newQty;

      // Recalculate GST for new values
      const gst = await calculateGst(newUnitPrice, newCategory);
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! }, select: { config: true } });
      const tenantConfig = (tenant?.config as Record<string, any>) || {};
      let cgst = 0, sgst = 0, igst = 0, rate = 0;
      if (tenantConfig.gstEnabled) {
        rate = gst.rate;
        // Reuse existing inter-state flag from original charge
        if (charge.igst > 0 && charge.cgst === 0) {
          igst = (gst.cgst + gst.sgst) * newQty;
        } else {
          cgst = gst.cgst * newQty;
          sgst = gst.sgst * newQty;
        }
      }

      const oldTotal = charge.totalPrice + charge.cgst + charge.sgst + charge.igst;
      const newTotal = newTotalPrice + cgst + sgst + igst;
      const balanceDelta = newTotal - oldTotal;

      const [updated] = await prisma.$transaction([
        prisma.folioCharge.update({
          where: { id: req.params.chargeId },
          data: {
            description: newDesc,
            category:    newCategory,
            unitPrice:   newUnitPrice,
            quantity:    newQty,
            totalPrice:  newTotalPrice,
            gstRate:     rate,
            cgst,
            sgst,
            igst,
            // Only update chargeDate if a valid value was provided
            ...(chargeDate ? { chargeDate: new Date(chargeDate) } : {}),
          },
        }),
        prisma.booking.update({
          where: { id: charge.bookingId },
          data: {
            totalAmount: { increment: balanceDelta },
            balanceDue:  { increment: balanceDelta },
          },
        }),
      ]);

      return { data: updated };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('[BILLING PATCH CHARGE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update charge' });
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

    // Resolve paidOn: user-supplied date (date-only or ISO datetime) → Date, else now.
    // Reject future dates — payments can be backdated, never forward-dated.
    const now = new Date();
    let paidOn = now;
    if (parsed.data.paidOn) {
      const raw = parsed.data.paidOn;
      // Date-only strings ("YYYY-MM-DD") are parsed as UTC midnight by JS;
      // anchor them to noon IST so they don't drift to the previous day in displays.
      paidOn = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(`${raw}T06:30:00.000Z`) // 12:00 IST = 06:30 UTC
        : new Date(raw);
      if (Number.isNaN(paidOn.getTime())) {
        res.status(400).json({ success: false, error: 'Invalid paidOn date' });
        return;
      }
      if (paidOn.getTime() > now.getTime() + 60_000) {
        res.status(400).json({ success: false, error: 'Payment date cannot be in the future' });
        return;
      }
    }

    const result = await withTenant(req.tenantId!, async () => {
      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: parsed.data.bookingId },
        select: { id: true, balanceDue: true },
      });
      if (!booking) return { error: 'Booking not found', status: 404 };

      // Build the allocation plan
      // - explicit allocations from request, OR
      // - FIFO auto-allocation across unpaid folio charges (oldest first)
      type Alloc = { chargeId: string; amount: number };
      let allocations: Alloc[] = [];

      if (parsed.data.chargeAllocations && parsed.data.chargeAllocations.length > 0) {
        // Validate each chargeId belongs to this booking and tenant; cap per-charge amount at remaining unpaid
        const chargeIds = parsed.data.chargeAllocations.map((a) => a.chargeId);
        const charges = await prisma.folioCharge.findMany({
          where: { id: { in: chargeIds }, bookingId: booking.id, tenantId: req.tenantId! },
          select: { id: true, totalPrice: true, paidAmount: true },
        });
        const chargeMap = new Map(charges.map((c) => [c.id, c]));
        for (const a of parsed.data.chargeAllocations) {
          const c = chargeMap.get(a.chargeId);
          if (!c) return { error: `Invalid chargeId: ${a.chargeId}`, status: 400 };
          const remainingOnCharge = Math.max(0, c.totalPrice - c.paidAmount);
          allocations.push({ chargeId: a.chargeId, amount: Math.min(a.amount, remainingOnCharge) });
        }
        const allocatedSum = allocations.reduce((s, a) => s + a.amount, 0);
        if (allocatedSum > parsed.data.amount + 0.001) {
          return { error: 'Allocations exceed payment amount', status: 400 };
        }
      } else {
        // FIFO over unpaid charges, oldest first
        const unpaid = await prisma.folioCharge.findMany({
          where: { bookingId: booking.id, tenantId: req.tenantId! },
          orderBy: { chargeDate: 'asc' },
          select: { id: true, totalPrice: true, paidAmount: true },
        });
        let remaining = parsed.data.amount;
        for (const c of unpaid) {
          if (remaining <= 0) break;
          const owed = Math.max(0, c.totalPrice - c.paidAmount);
          if (owed <= 0) continue;
          const apply = Math.min(remaining, owed);
          allocations.push({ chargeId: c.id, amount: apply });
          remaining -= apply;
        }
        // Note: if `remaining > 0` after loop, the leftover is treated as a credit
        // on the booking (Booking.advancePaid increments by full amount below).
      }

      const payment = await prisma.guestPayment.create({
        data: {
          tenantId: req.tenantId!,
          bookingId: parsed.data.bookingId,
          amount: parsed.data.amount,
          method: parsed.data.method,
          status: 'completed',
          category: 'payment',
          notes: parsed.data.notes || null,
          paidOn,
        },
      });

      // Apply allocations to FolioCharge.paidAmount + paidAt.
      // Stamp paidAt with the user-entered paidOn so the folio history reflects the
      // actual collection date, not the system-record timestamp.
      for (const a of allocations) {
        const cur = await prisma.folioCharge.findUnique({
          where: { id: a.chargeId },
          select: { totalPrice: true, paidAmount: true },
        });
        if (!cur) continue;
        const newPaid = cur.paidAmount + a.amount;
        await prisma.folioCharge.update({
          where: { id: a.chargeId },
          data: {
            paidAmount: newPaid,
            // Stamp paidAt only when fully cleared (within rounding tolerance)
            paidAt: newPaid + 0.001 >= cur.totalPrice ? paidOn : null,
          },
        });
      }

      // Update booking running totals
      await prisma.booking.update({
        where: { id: parsed.data.bookingId },
        data: {
          advancePaid: { increment: parsed.data.amount },
          balanceDue: { decrement: parsed.data.amount },
        },
      });

      return { data: { ...payment, allocations } };
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

// GET /billing/rent-roll
// Returns active checked-in residents with per-month folio charges and computed status.
// Primarily used by the PG/Hostel rent-roll dashboard, but works for any property type.
billingRouter.get('/rent-roll', authorize('property_owner', 'general_manager', 'accountant', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { rentGracePeriodDays: true, propertyType: true },
    });
    const graceDays = tenant?.rentGracePeriodDays ?? 5;
    const now = new Date();

    const bookings = await prisma.booking.findMany({
      where: { tenantId, status: 'checked_in' },
      select: {
        id: true,
        bookingNumber: true,
        guestName: true,
        guestPhone: true,
        checkInDate: true,
        checkOutDate: true,
        totalAmount: true,
        advancePaid: true,
        balanceDue: true,
        billingMode: true,
        monthlyRate: true,
        bookingRooms: {
          select: { id: true, room: { select: { roomNumber: true } }, roomType: { select: { name: true } } },
        },
        folioCharges: {
          orderBy: { chargeDate: 'asc' },
          select: {
            id: true, chargeDate: true, category: true, description: true,
            totalPrice: true, paidAmount: true, paidAt: true,
          },
        },
      },
      orderBy: { checkInDate: 'asc' },
    });

    // Compute status for each charge + group by month (YYYY-MM)
    const data = bookings.map((b) => {
      const monthMap = new Map<string, {
        period: string; // "YYYY-MM"
        charges: any[];
        totalDue: number;
        totalPaid: number;
        status: 'paid' | 'partial' | 'due' | 'overdue';
      }>();

      for (const c of b.folioCharges) {
        const dt = new Date(c.chargeDate);
        const period = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
        const remaining = Math.max(0, c.totalPrice - c.paidAmount);
        const fullyPaid = remaining <= 0.001;
        const partiallyPaid = !fullyPaid && c.paidAmount > 0;
        const overdueThreshold = new Date(dt);
        overdueThreshold.setDate(overdueThreshold.getDate() + graceDays);
        const isOverdue = !fullyPaid && now > overdueThreshold;

        const chargeStatus = fullyPaid
          ? 'paid'
          : isOverdue
            ? 'overdue'
            : partiallyPaid
              ? 'partial'
              : 'due';

        if (!monthMap.has(period)) {
          monthMap.set(period, { period, charges: [], totalDue: 0, totalPaid: 0, status: 'due' });
        }
        const m = monthMap.get(period)!;
        m.charges.push({ ...c, status: chargeStatus, remaining });
        m.totalDue += c.totalPrice;
        m.totalPaid += c.paidAmount;
      }

      // Roll up monthly status from the rows in that month (worst status wins)
      const months = Array.from(monthMap.values()).map((m) => {
        const rowStatuses = m.charges.map((c: any) => c.status);
        const status: 'paid' | 'partial' | 'due' | 'overdue' = rowStatuses.includes('overdue')
          ? 'overdue'
          : rowStatuses.every((s: string) => s === 'paid')
            ? 'paid'
            : rowStatuses.some((s: string) => s === 'partial' || s === 'paid')
              ? 'partial'
              : 'due';
        return { ...m, status };
      });
      months.sort((a, b) => a.period.localeCompare(b.period));

      return {
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalAmount: b.totalAmount,
        advancePaid: b.advancePaid,
        balanceDue: b.balanceDue,
        billingMode: b.billingMode,
        monthlyRate: b.monthlyRate,
        rooms: b.bookingRooms.map((br) => ({
          number: br.room?.roomNumber || null,
          type: br.roomType?.name || null,
        })),
        months,
      };
    });

    res.json({
      success: true,
      data: {
        residents: data,
        graceDays,
        propertyType: tenant?.propertyType,
      },
    });
  } catch (err) {
    console.error('[BILLING RENT ROLL ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rent roll' });
  }
});

// GET /billing/invoices
billingRouter.get('/invoices', authorize('property_owner', 'general_manager', 'accountant'), async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.tenantId! },
      include: { booking: { select: { bookingNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// GET /billing/invoices/:id/pdf
billingRouter.get('/invoices/:id/pdf', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id, tenantId },
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
      where: { id: tenantId },
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
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /billing/gstr1?month=YYYY-MM
// Returns a GSTR-1 B2C summary CSV for the given month.
//
// Each row = one folio charge line with SAC code, taxable value, CGST/SGST/IGST.
// Accountants upload this directly to the GST portal or import into Tally/Excel.
//
// Date boundaries are computed in IST (Asia/Kolkata UTC+5:30) to avoid
// truncating the first 5.5 hours of data on UTC-hosted servers.
// ─────────────────────────────────────────────────────────────────────────────
billingRouter.get('/gstr1', authorize('property_owner', 'general_manager', 'accountant'), async (req: Request, res: Response) => {
  try {
    // month param: YYYY-MM (defaults to current IST calendar month)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(Date.now() + IST_OFFSET_MS);
    const defaultMonth = nowIst.toISOString().slice(0, 7); // "YYYY-MM"
    const monthParam = (req.query.month as string) || defaultMonth;

    // Strict format validation: must be YYYY-MM
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
      res.status(400).json({ success: false, error: 'Invalid month param. Use YYYY-MM format (e.g. 2026-04).' });
      return;
    }

    const [year, month] = monthParam.split('-').map(Number);

    // IST-aware date boundaries:
    // from = 1st of month at 00:00 IST  → subtract IST offset to get UTC
    // to   = last day of month at 23:59:59 IST
    const fromIst = new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);
    const toIst   = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - IST_OFFSET_MS);

    {
      const tenantId = req.tenantId!;
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, gstNumber: true, state: true },
      });

      // Pull all folio charges for the period with their booking context.
      // Discount/reversal lines (totalPrice <= 0) are excluded from GST report.
      const charges = await prisma.folioCharge.findMany({
        where: {
          tenantId: req.tenantId!,
          chargeDate: { gte: fromIst, lte: toIst },
          totalPrice: { gt: 0 },
        },
        include: {
          booking: {
            select: {
              bookingNumber: true,
              guestName: true,
              guestPhone: true,
              // Primary guest state used for CGST/SGST vs IGST classification
              bookingGuests: {
                select: { guestState: true },
                take: 1,
                orderBy: { createdAt: 'asc' },
              },
              invoices: {
                select: { invoiceNumber: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: [{ chargeDate: 'asc' }, { createdAt: 'asc' }],
      }) as any[];

      // ── CSV Header (18 columns) ────────────────────────────────────────────
      const HEADERS = [
        'Invoice No',          // 1
        'Invoice Date',        // 2
        'Booking No',          // 3
        'Guest Name',          // 4
        'Guest Phone',         // 5
        'Place of Supply',     // 6
        'SAC Code',            // 7
        'Category',            // 8
        'Description',         // 9
        'Qty',                 // 10
        'Unit Price (Rs)',      // 11
        'Taxable Value (Rs)',   // 12
        'GST Rate (%)',         // 13
        'CGST (Rs)',            // 14
        'SGST (Rs)',            // 15
        'IGST (Rs)',            // 16
        'Total (Rs)',           // 17
        'Supply Type',         // 18
      ];

      // RFC 4180-compliant CSV escape: wrap in quotes, double inner quotes
      const esc = (s: string | null | undefined): string =>
        `"${(s ?? '').toString().replace(/"/g, '""')}"`;

      const csvLines: string[] = [HEADERS.join(',')];

      // ── Aggregate totals ───────────────────────────────────────────────────
      let sumTaxable = 0, sumCgst = 0, sumSgst = 0, sumIgst = 0, sumTotal = 0;

      for (const charge of charges) {
        const invoice       = charge.booking?.invoices?.[0];
        const invoiceNo     = invoice?.invoiceNumber ?? '';
        // Use IST-formatted date for all date columns (consistent for Indian accountants)
        const invoiceDate   = new Date(
          invoice?.createdAt ? invoice.createdAt : charge.chargeDate
        ).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
        const chargeDate    = new Date(charge.chargeDate)
          .toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });

        const placeOfSupply = charge.booking?.bookingGuests?.[0]?.guestState ?? '';
        const supplyType    = charge.igst > 0 ? 'Inter-State' : 'Intra-State';
        const lineTotal     = charge.totalPrice + charge.cgst + charge.sgst + charge.igst;

        sumTaxable += charge.totalPrice;
        sumCgst    += charge.cgst;
        sumSgst    += charge.sgst;
        sumIgst    += charge.igst;
        sumTotal   += lineTotal;

        csvLines.push([
          esc(invoiceNo),                           // 1
          invoiceDate,                              // 2
          esc(charge.booking?.bookingNumber),       // 3
          esc(charge.booking?.guestName),           // 4
          esc(charge.booking?.guestPhone),          // 5
          esc(placeOfSupply),                       // 6
          charge.sacCode ?? '',                     // 7
          charge.category,                          // 8
          esc(charge.description),                  // 9
          charge.quantity,                          // 10
          charge.unitPrice.toFixed(2),              // 11
          charge.totalPrice.toFixed(2),             // 12
          (charge.gstRate ?? 0).toFixed(0),         // 13
          charge.cgst.toFixed(2),                   // 14
          charge.sgst.toFixed(2),                   // 15
          charge.igst.toFixed(2),                   // 16
          lineTotal.toFixed(2),                     // 17
          supplyType,                               // 18
        ].join(','));
      }

      // ── Summary row (same 18 columns, blanks where N/A) ───────────────────
      csvLines.push('');  // blank separator row
      csvLines.push([
        esc('PERIOD SUMMARY'),  // 1
        monthParam,             // 2
        '',                     // 3
        '',                     // 4
        '',                     // 5
        '',                     // 6
        '',                     // 7
        '',                     // 8
        esc(`${charges.length} charge lines`), // 9
        '',                     // 10
        '',                     // 11
        sumTaxable.toFixed(2),  // 12 Taxable Value total
        '',                     // 13
        sumCgst.toFixed(2),     // 14 CGST total
        sumSgst.toFixed(2),     // 15 SGST total
        sumIgst.toFixed(2),     // 16 IGST total
        sumTotal.toFixed(2),    // 17 Grand total
        '',                     // 18
      ].join(','));

      // Property info header block prepended before data
      const metaBlock = [
        `"GSTIN: ${tenant?.gstNumber ?? 'Not Set'}"`,
        `"Property: ${tenant?.name ?? ''}"`,
        `"State: ${tenant?.state ?? ''}"`,
        `"Report Period: ${monthParam}"`,
        '',
      ].join('\r\n');

      const safeName = (tenant?.name ?? 'Property').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `GSTR1_${safeName}_${monthParam}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // BOM required for Excel to correctly detect UTF-8
      res.send('\uFEFF' + metaBlock + '\r\n' + csvLines.join('\r\n'));

      // Audit log after response — guarded so it never breaks the response
      try {
        await logAudit(
          req.tenantId!, req.userId,
          'EXPORT_GSTR1', 'billing', req.tenantId!,
          { month: monthParam, rows: charges.length },
          req.ip || undefined
        );
      } catch (auditErr) {
        console.error('[GSTR1 AUDIT LOG FAILED]', auditErr);
      }
    }
  } catch (err) {
    console.error('[GSTR1 EXPORT ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to generate GSTR-1 export' });
  }
});
