import { validateRequest } from '../../middleware/validate';
import { Router, Request, Response } from 'express';
import { prisma, withTenant, getLocalDate } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { bookingSchema, bookingGuestSchema, walkInBookingSchema, confirmBookingSchema, cancelBookingSchema, assignRoomSchema, updateBookingSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';
import { sendBookingConfirmation } from '../../services/email';
import { sendWhatsAppMessage } from '../../services/whatsapp';
import { calculatePricing } from '../../services/pricing';
import { pushInventoryUpdate } from '../../services/channel-manager';
import { creditLoyaltyPoints } from '../loyalty/router';

export const bookingsRouter = Router();

bookingsRouter.use(authenticate, resolveTenant, requireTenant);

// Generate unique booking number with optional custom prefix
function generateBookingNumber(prefix?: string): string {
  const pfx = (prefix && prefix.trim()) ? prefix.trim().toUpperCase().slice(0, 6) : 'IS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = require('crypto').randomInt(1000, 9999).toString();
  return `${pfx}-${timestamp}-${random}`;
}

// Clamp pagination values for safety
function clampPagination(page: string | undefined, limit: string | undefined) {
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  return { page: p, limit: l };
}

// POST /bookings
bookingsRouter.post('/', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;

    const result = await withTenant(req.tenantId!, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true, name: true },
      });
      const tenantConfig = (tenant?.config as Record<string, any>) || {};

      const bookingNumber = generateBookingNumber(tenantConfig.bookingPrefix);

      // Calculate nights — anchor dates to noon IST to avoid UTC midnight drift
      const checkInDt = new Date(data.checkInDate + 'T12:00:00+05:30');
      const checkOutDt = new Date(data.checkOutDate + 'T12:00:00+05:30');
      const nights = Math.ceil(
        (checkOutDt.getTime() - checkInDt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (nights <= 0) {
        return { error: 'Check-out must be after check-in', status: 400 };
      }

      // Calculate total from room selections
      let totalAmount = 0;
      const bookingRoomsData = [];
      const folioChargesData: any[] = [];

      const propertyState = tenantConfig.state?.toLowerCase() || '';
      const guestState = data.guestState?.toLowerCase() || '';
      const isInterState = propertyState && guestState && propertyState !== guestState;

      for (const sel of data.roomSelections) {
        const pricing = await calculatePricing(
          req.tenantId!,
          sel.roomTypeId,
          checkInDt,
          checkOutDt,
          sel.extraBeds
        );

        totalAmount += pricing.grandTotal;
        
        // Wait till we get the first night's base rate for the legacy ratePerNight field, 
        // though typically we should save the nightly breakdn. For now, average it or use first night.
        const firstNightRate = pricing.nightlyRates.length > 0 ? pricing.nightlyRates[0].rate : 0;

        bookingRoomsData.push({
          tenantId: req.tenantId!,
          roomId: sel.roomId || null,
          roomTypeId: sel.roomTypeId,
          ratePerNight: firstNightRate, // Used for legacy displays
          extraBeds: sel.extraBeds,
          extraBedCharge: 0, // already included in calculatePricing
        });

        // Automatically generate FolioCharge records — one per night, or one per month for monthly rooms
        const isMonthly = pricing.pricingUnit === 'monthly';
        for (const period of pricing.nightlyRates) {
          const periodDate = new Date(period.date);
          const label = isMonthly
            ? `Monthly rent - ${periodDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}`
            : `Room charge - ${periodDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
          folioChargesData.push({
            tenantId: req.tenantId!,
            chargeDate: periodDate,
            category: 'room',
            description: `${label}${period.ruleApplied ? ` (${period.ruleApplied})` : ''}`,
            sacCode: '996311',
            quantity: 1,
            unitPrice: period.rate,
            totalPrice: period.rate,
            gstRate: period.gstAmount > 0 && period.rate > 0 ? Math.round((period.gstAmount / period.rate) * 100) : 0,
            cgst: isInterState ? 0 : period.gstAmount / 2,
            sgst: isInterState ? 0 : period.gstAmount / 2,
            igst: isInterState ? period.gstAmount : 0,
            isAutoGenerated: true,
          });
        }
      }

      // Handle Promo Code / Coupon
      let discountAmountTotal = 0;
      let couponId: string | null = null;
      if (data.promoCode) {
        const coupon = await prisma.coupon.findUnique({
          where: {
            tenantId_code: {
              tenantId: req.tenantId!,
              code: data.promoCode.toUpperCase(),
            },
          },
        });

        if (coupon && coupon.isActive) {
          const now = new Date();
          const isValidDate = (!coupon.validFrom || new Date(coupon.validFrom) <= now) &&
                              (!coupon.validUntil || new Date(coupon.validUntil) >= now);
          const isUsageLeft = !coupon.maxUses || coupon.currentUses < coupon.maxUses;
          const isMinAmountMet = totalAmount >= coupon.minBookingAmount;
          
          const applicableRoomTypes = (coupon.applicableRoomTypes as string[]) || [];
          const isRoomTypeMatch = applicableRoomTypes.length === 0 || 
                                  data.roomSelections.some(rs => applicableRoomTypes.includes(rs.roomTypeId));

          if (isValidDate && isUsageLeft && isMinAmountMet && isRoomTypeMatch) {
            couponId = coupon.id;
            if (coupon.discountType === 'percentage') {
              discountAmountTotal = Math.round((totalAmount * coupon.discountValue) / 100);
            } else {
              discountAmountTotal = Math.min(coupon.discountValue, totalAmount);
            }

            // Update coupon usage
            await prisma.coupon.update({
              where: { id: coupon.id },
              data: { currentUses: { increment: 1 } },
            });

            // Add negative folio charge for discount
            folioChargesData.push({
              tenantId: req.tenantId!,
              chargeDate: new Date(),
              category: 'other',
              description: `Promo Discount: ${coupon.code}`,
              quantity: 1,
              unitPrice: -discountAmountTotal,
              totalPrice: -discountAmountTotal,
              gstRate: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              isAutoGenerated: true,
            });

            totalAmount -= discountAmountTotal;
          }
        }
      }

      // Pre-fetch linked guest profile to populate compliance data for foreign nationals
      let linkedProfile: { fullName: string; nationality: string | null; idProofType: string | null; idProofNumber: string | null } | null = null;
      if (data.guestProfileId) {
        linkedProfile = await prisma.guestProfile.findUnique({
          where: { id: data.guestProfileId },
          select: { fullName: true, nationality: true, idProofType: true, idProofNumber: true },
        });
      }

      const isForeignGuest = linkedProfile?.nationality &&
        !['indian', 'india'].includes(linkedProfile.nationality.toLowerCase());

      const bookingGuestData = isForeignGuest && linkedProfile ? {
        tenantId: req.tenantId!,
        fullName: linkedProfile.fullName,
        nationality: linkedProfile.nationality!,
        idProofType: linkedProfile.idProofType ?? undefined,
        idProofNumber: linkedProfile.idProofNumber ?? undefined,
      } : {
        tenantId: req.tenantId!,
        fullName: data.guestName || 'Guest',
        ...(data.guestNationality ? { nationality: data.guestNationality } : {}),
      };

      const advancePaid = data.advanceAmount || 0;
      const securityDeposit = data.securityDeposit || 0;
      const paymentMethod = data.paymentMethod || 'cash';

      // Stamp advance + deposit onto the FIRST BookingRoom (single-row UI design)
      const enrichedBookingRoomsData = bookingRoomsData.map((br: any, idx: number) =>
        idx === 0
          ? {
              ...br,
              advanceAmount: advancePaid,
              securityDeposit,
              securityDepositStatus: securityDeposit > 0 ? 'held' : 'none',
            }
          : br
      );

      // Build GuestPayment rows for whatever was actually collected
      const guestPaymentsData: any[] = [];
      if (advancePaid > 0) {
        guestPaymentsData.push({
          tenantId: req.tenantId!,
          amount: advancePaid,
          method: paymentMethod,
          status: 'completed',
          category: 'advance',
          receiptNumber: `BK-${bookingNumber}-ADV`,
        });
      }
      if (securityDeposit > 0) {
        guestPaymentsData.push({
          tenantId: req.tenantId!,
          amount: securityDeposit,
          method: paymentMethod,
          status: 'completed',
          category: 'security_deposit',
          receiptNumber: `BK-${bookingNumber}-DEP`,
        });
      }

      const booking = await prisma.booking.create({
        data: {
          tenantId: req.tenantId!,
          bookingNumber,
          guestProfileId: data.guestProfileId || null,
          guestName: data.guestName,
          guestEmail: data.guestEmail?.toLowerCase() || null,
          guestPhone: data.guestPhone,
          source: data.source,
          checkInDate: checkInDt,
          checkOutDate: checkOutDt,
          numAdults: data.numAdults,
          numChildren: data.numChildren,
          numRooms: data.roomSelections.length,
          status: data.source === 'walkin' ? 'confirmed' : 'pending_confirmation',
          totalAmount,
          advancePaid,
          balanceDue: totalAmount - advancePaid,
          specialRequests: data.specialRequests || null,
          couponId,
          discountAmount: discountAmountTotal,
          createdBy: req.userId,
          bookingRooms: { create: enrichedBookingRoomsData },
          bookingGuests: { create: [bookingGuestData] },
          folioCharges: { create: folioChargesData },
          guestPayments: { create: guestPaymentsData },
        },
        include: { bookingRooms: true, folioCharges: true, guestPayments: true },
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'booking', booking.id, { bookingNumber, totalAmount }, req.ip || undefined);

      // Send confirmation email (async, don't await)
      if (data.guestEmail) {
        sendBookingConfirmation(data.guestEmail, {
          bookingNumber,
          guestName: data.guestName,
          propertyName: tenant?.name || 'Property',
          checkIn: data.checkInDate,
          checkOut: data.checkOutDate,
          totalAmount,
        }).catch(console.error);
      }

      // Send WhatsApp confirmation (async, don't await)
      if (data.guestPhone && tenantConfig.whatsapp?.enabled !== false) {
        sendWhatsAppMessage(
          data.guestPhone,
          {
            name: data.guestName,
            hotel: tenant?.name || 'Our Property',
            bookingRef: bookingNumber,
            checkInDate: new Date(data.checkInDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        ).catch(console.error);
      }

      // Async push inventory to OTAs
      const bookedRoomTypes = Object.fromEntries(
        data.roomSelections.map(r => [r.roomTypeId, true])
      );
      for (const roomTypeId of Object.keys(bookedRoomTypes)) {
        pushInventoryUpdate(req.tenantId!, roomTypeId, data.checkInDate, 0).catch(console.error);
      }

      return { data: booking };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true, data: result.data, message: 'Booking created successfully' });

    // Async: Credit loyalty points (non-blocking)
    if (result.data?.guestProfileId && result.data?.totalAmount) {
      creditLoyaltyPoints(
        result.data.guestProfileId,
        req.tenantId!,
        result.data.id,
        result.data.totalAmount
      ).catch(console.error);
    }
  } catch (err) {
    console.error('[BOOKING CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// GET /bookings
bookingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const { page, limit } = clampPagination(req.query.page as string, req.query.limit as string);

    await withTenant(req.tenantId!, async () => {
      const where: any = { tenantId: req.tenantId! };
      if (status) where.status = status;
      if (startDate) where.checkInDate = { ...(where.checkInDate || {}), gte: new Date(startDate as string) };
      if (endDate) where.checkOutDate = { ...(where.checkOutDate || {}), lte: new Date(endDate as string) };

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            bookingRooms: {
              include: { room: { select: { roomNumber: true } }, roomType: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        success: true,
        data: bookings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    });
  } catch (err) {
    console.error('[BOOKING LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id
bookingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
          bookingRooms: {
            include: {
              room: { select: { id: true, roomNumber: true, floor: { select: { name: true } } } },
              roomType: { select: { id: true, name: true } },
            },
          },
          bookingGuests: true,
          guestProfile: { select: { nationality: true, idProofType: true, idProofNumber: true } },
          folioCharges: { orderBy: { chargeDate: 'asc' } },
          guestPayments: { orderBy: { createdAt: 'desc' } },
          invoices: true,
        },
      });

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      // Resolve nationality on each BookingGuest — GuestProfile is the source of truth
      // for foreign nationals whose BookingGuest row was created before the profile was linked.
      const profileNationality = booking.guestProfile?.nationality;
      const resolvedBookingGuests = booking.bookingGuests.map(bg => {
        const nationality =
          (bg.nationality && bg.nationality !== 'Indian') ? bg.nationality :
          (profileNationality && profileNationality !== 'Indian') ? profileNationality :
          bg.nationality;
        return { ...bg, nationality };
      });

      res.json({ success: true, data: { ...booking, bookingGuests: resolvedBookingGuests } });
    });
  } catch (err) {
    console.error('[BOOKING GET ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// POST /bookings/:id/guests — Add a guest to a booking
bookingsRouter.post('/:id/guests', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const result = await withTenant(req.tenantId!, async () => {
      const parsed = bookingGuestSchema.safeParse(req.body);
      if (!parsed.success) {
        return { error: 'Invalid guest data', status: 400, details: parsed.error.format() };
      }

      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: { guestProfile: { select: { nationality: true, idProofType: true, idProofNumber: true } } },
      });
      if (!booking) return { error: 'Booking not found', status: 404 };

      // Resolve nationality: explicit input wins, then linked profile, then leave blank (not "Indian")
      const resolvedNationality =
        parsed.data.nationality ||
        booking.guestProfile?.nationality ||
        undefined;

      const guest = await prisma.bookingGuest.create({
        data: {
          tenantId: req.tenantId!,
          bookingId: booking.id,
          fullName: parsed.data.fullName,
          ...(resolvedNationality ? { nationality: resolvedNationality } : {}),
          idProofType: parsed.data.idProofType ?? booking.guestProfile?.idProofType ?? undefined,
          idProofNumber: parsed.data.idProofNumber ?? booking.guestProfile?.idProofNumber ?? undefined,
          visaNumber: parsed.data.visaNumber,
          visaExpiryDate: parsed.data.visaExpiryDate ? new Date(parsed.data.visaExpiryDate) : null,
          purposeOfVisit: parsed.data.purposeOfVisit,
          arrivingFrom: parsed.data.arrivingFrom,
          goingTo: parsed.data.goingTo,
        },
      });
      return { data: guest, status: 201 };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }
    res.status(result.status || 201).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal Error' });
  }
});

bookingsRouter.put('/:id/guests/:guestId', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const result = await withTenant(req.tenantId!, async () => {
      const parsed = bookingGuestSchema.safeParse(req.body);
      if (!parsed.success) {
        return { error: 'Invalid guest data', status: 400, details: parsed.error.format() };
      }

      const existing = await prisma.bookingGuest.findUnique({ where: { id: req.params.guestId } });
      if (!existing || existing.bookingId !== req.params.id) return { error: 'Guest not found on this booking', status: 404 };

      const updated = await prisma.bookingGuest.update({
        where: { id: req.params.guestId },
        data: parsed.data
      });
      return { data: updated };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch(err) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// PATCH /bookings/:id/confirm
bookingsRouter.patch('/:id/confirm', validateRequest(confirmBookingSchema), authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const result = await withTenant(req.tenantId!, async () => {
      // Verify booking exists and is in confirmable state
      const existing = await prisma.booking.findUnique({ where: { id: req.params.id }, select: { status: true } });
      if (!existing) return { error: 'Booking not found', status: 404 };
      if (existing.status !== 'pending_confirmation') {
        return { error: `Cannot confirm booking with status: ${existing.status}`, status: 400 };
      }

      const booking = await prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'confirmed' },
      });
      await logAudit(req.tenantId!, req.userId, 'CONFIRM', 'booking', booking.id, {}, req.ip || undefined);
      return { data: booking };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to confirm booking' });
  }
});

// POST /bookings/:id/cancel
bookingsRouter.post('/:id/cancel', validateRequest(cancelBookingSchema), authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const result = await withTenant(req.tenantId!, async () => {
      // Verify booking exists and is cancellable
      const existing = await prisma.booking.findUnique({ where: { id: req.params.id }, select: { status: true } });
      if (!existing) return { error: 'Booking not found', status: 404 };
      if (['checked_out', 'cancelled'].includes(existing.status)) {
        return { error: `Cannot cancel booking with status: ${existing.status}`, status: 400 };
      }

      const booking = await prisma.booking.update({
        where: { id: req.params.id },
        data: {
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by staff',
          cancelledAt: new Date(),
        },
      });

      // Release rooms
      const bookingRooms = await prisma.bookingRoom.findMany({ where: { bookingId: booking.id } });
      for (const br of bookingRooms) {
        if (br.roomId) {
          await prisma.room.update({ where: { id: br.roomId }, data: { status: 'available' } });
        }
      }

      await logAudit(req.tenantId!, req.userId, 'CANCEL', 'booking', booking.id, { reason }, req.ip || undefined);
      return { data: booking };
    });

    if ('error' in result) {
      res.status(result.status || 400).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.data, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// GET /bookings/:id/c-form
// Exports a CSV file for FRRO compliance (only includes Foreign guests)
bookingsRouter.get('/:id/c-form', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
          bookingGuests: true,
          tenant: { select: { name: true, city: true, address: true } }
        },
      });

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      // Filter only non-Indian guests for C-Form
      const foreignGuests = booking.bookingGuests.filter(g => 
        g.nationality && g.nationality.toLowerCase() !== 'indian' && g.nationality.toLowerCase() !== 'india'
      );

      if (foreignGuests.length === 0) {
        res.status(400).json({ success: false, error: 'No foreign guests attached to this booking to generate a C-Form.' });
        return;
      }

      // FRRO standard CSV Headers
      const headers = [
        'Hotel Name', 'Booking Ref', 'Arrival Date', 'Guest Name', 'Nationality', 
        'Passport Number', 'Visa Number', 'Visa Expiry', 'Arriving From', 'Proceeding To', 'Purpose of Visit'
      ];

      const rows = foreignGuests.map(g => {
        return [
          `"${booking.tenant.name}"`,
          `"${booking.bookingNumber}"`,
          `"${new Date(booking.checkInDate).toISOString().split('T')[0]}"`,
          `"${g.fullName}"`,
          `"${g.nationality}"`,
          `"${g.idProofNumber || ''}"`,
          `"${g.visaNumber || ''}"`,
          `"${g.visaExpiryDate ? new Date(g.visaExpiryDate).toISOString().split('T')[0] : ''}"`,
          `"${g.arrivingFrom || ''}"`,
          `"${g.goingTo || ''}"`,
          `"${g.purposeOfVisit || ''}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=c-form-${booking.bookingNumber}.csv`);
      res.status(200).send(csvContent);
      
      // Update compliance flag in background
      await prisma.bookingGuest.updateMany({
        where: { id: { in: foreignGuests.map(fg => fg.id) } },
        data: { cFormSubmitted: true, cFormSubmittedAt: new Date() }
      });
    });
  } catch (err) {
    console.error('[C-FORM GENERATION ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to generate C-Form CSV' });
  }
});

// POST /bookings/walk-in
bookingsRouter.post('/walk-in', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = walkInBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { guestName, guestPhone, roomId, durationValue, durationUnit, paymentMode } = parsed.data;
    const advanceInput = parsed.data.advanceAmount ?? 0;
    const securityDeposit = parsed.data.securityDeposit ?? 0;

    const result = await withTenant(req.tenantId!, async () => {
      // 1. Validate room availability
      const room = await prisma.room.findUnique({
        where: { id: roomId, tenantId: req.tenantId! },
      });
      if (!room || room.status !== 'available') {
        return { error: 'Room is not available for walk-in', status: 400 };
      }

      // 2. Fetch or create guest profile
      let guestProfile = await prisma.guestProfile.findFirst({
        where: { phone: guestPhone, tenantId: req.tenantId! }
      });
      if (!guestProfile) {
        guestProfile = await prisma.guestProfile.create({
          data: {
            tenantId: req.tenantId!,
            fullName: guestName,
            phone: guestPhone,
          }
        });
      }

      // 3. Calculate Check-Out Date and Pricing
      // Use IST (Asia/Kolkata) for all date operations to avoid timezone drift
      const checkInStr = getLocalDate();
      // Anchor to noon IST so Prisma DateTime doesn't drift to previous day in UTC
      const checkInDate = new Date(checkInStr + 'T12:00:00+05:30');
      const checkOutDate = new Date(checkInDate);
      
      if (durationUnit === 'days') {
        checkOutDate.setDate(checkOutDate.getDate() + durationValue);
      } else {
        checkOutDate.setMonth(checkOutDate.getMonth() + durationValue);
      }

      const pricing = await calculatePricing(
        req.tenantId!,
        room.roomTypeId,
        checkInDate,
        checkOutDate,
        0
      );

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true },
      });
      const walkinConfig = (tenant?.config as Record<string, any>) || {};

      const bookingNumber = generateBookingNumber(walkinConfig.bookingPrefix);
      const totalAmount = pricing.grandTotal;
      // Determine advancePaid:
      //   - If caller provided an explicit advanceAmount, use it (PG/Hostel pattern: pay first month + deposit)
      //   - Otherwise fall back to the legacy "paymentMode means pay full" hotel behaviour
      const advancePaid = advanceInput > 0
        ? Math.min(advanceInput, totalAmount)
        : (paymentMode ? totalAmount : 0);

      // 4. Generate automated FolioCharges — pricing service emits one entry per
      // night (hotel) or one per month (PG/Hostel). Either way we map 1:1 to a folio row.
      const folioChargesData: any[] = [];
      const isInterState = false;
      const isMonthly = pricing.pricingUnit === 'monthly';

      for (const period of pricing.nightlyRates) {
        const periodDate = new Date(period.date);
        const description = isMonthly
          ? `Walk-in Monthly rent - ${periodDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}`
          : `Walk-in Room charge - ${period.date}`;
        folioChargesData.push({
          tenantId: req.tenantId!,
          chargeDate: periodDate,
          category: 'room',
          description,
          sacCode: '996311',
          quantity: 1,
          unitPrice: period.rate,
          totalPrice: period.rate,
          gstRate: period.gstAmount > 0 && period.rate > 0 ? Math.round((period.gstAmount / period.rate) * 100) : 0,
          cgst: isInterState ? 0 : period.gstAmount / 2,
          sgst: isInterState ? 0 : period.gstAmount / 2,
          igst: isInterState ? period.gstAmount : 0,
          isAutoGenerated: true,
        });
      }

      // GuestPayment records for walk-in:
      //   - advance payment (categorised as 'advance' if explicit, else 'payment' for legacy "pay full" flow)
      //   - security deposit (separate row, never reduces balance)
      const guestPaymentsData: any[] = [];
      if (advancePaid > 0) {
        guestPaymentsData.push({
          tenantId: req.tenantId!,
          amount: advancePaid,
          method: paymentMode || 'cash',
          status: 'completed',
          category: advanceInput > 0 ? 'advance' : 'payment',
          receiptNumber: `WALKIN-${bookingNumber}`,
        });
      }
      if (securityDeposit > 0) {
        guestPaymentsData.push({
          tenantId: req.tenantId!,
          amount: securityDeposit,
          method: paymentMode || 'cash',
          status: 'completed',
          category: 'security_deposit',
          receiptNumber: `WALKIN-${bookingNumber}-DEP`,
        });
      }

      // 5. Build the massive Transaction block
      const booking = await prisma.booking.create({
        data: {
          tenantId: req.tenantId!,
          bookingNumber,
          guestProfileId: guestProfile.id,
          guestName,
          guestPhone,
          source: 'walkin',
          checkInDate,
          checkOutDate,
          numAdults: 1,
          numChildren: 0,
          numRooms: 1,
          status: 'checked_in', // Check in immediately!
          totalAmount,
          advancePaid,
          balanceDue: totalAmount - advancePaid,
          createdBy: req.userId,
          bookingRooms: {
            create: [{
              tenantId: req.tenantId!,
              roomId: room.id,
              roomTypeId: room.roomTypeId,
              ratePerNight: pricing.nightlyRates.length > 0 ? pricing.nightlyRates[0].rate : 0,
              extraBeds: 0,
              extraBedCharge: 0,
              advanceAmount: advanceInput > 0 ? advanceInput : 0,
              securityDeposit,
              securityDepositStatus: securityDeposit > 0 ? 'held' : 'none',
            }]
          },
          bookingGuests: { create: [{ tenantId: req.tenantId!, fullName: guestName }] },
          folioCharges: { create: folioChargesData },
          guestPayments: { create: guestPaymentsData },
        },
        include: { bookingRooms: true, folioCharges: true, guestPayments: true },
      });

      // Update room status
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'occupied' }
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'booking', booking.id, { bookingNumber, type: 'walkin', paymentMode }, req.ip || undefined);

      return { booking, status: 201 };
    });

    if ('error' in result) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    res.status(result.status || 200).json({ success: true, booking: result.booking });
  } catch (err) {
    console.error('[WALK-IN BOOKING ERROR]', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});


// PUT /bookings/:id/assign-room — One-click room assignment
bookingsRouter.put('/:id/assign-room', validateRequest(assignRoomSchema), authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const { bookingRoomId, roomId } = req.body;
    if (!bookingRoomId || !roomId) {
      res.status(400).json({ success: false, error: 'bookingRoomId and roomId are required' });
      return;
    }

    const result = await withTenant(req.tenantId!, async () => {
      // Verify the booking belongs to this tenant
      const booking = await prisma.booking.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId! },
        include: { bookingRooms: true },
      });
      if (!booking) return { error: 'Booking not found', status: 404 };

      // Verify the bookingRoom belongs to this booking
      const bookingRoom = booking.bookingRooms.find((br: any) => br.id === bookingRoomId);
      if (!bookingRoom) return { error: 'BookingRoom not found in this booking', status: 404 };

      // Verify the room exists, belongs to tenant, and is available
      const room = await prisma.room.findFirst({
        where: { id: roomId, tenantId: req.tenantId!, status: 'available' },
      });
      if (!room) return { error: 'Room is not available or does not exist', status: 400 };

      // Verify room type matches
      if (bookingRoom.roomTypeId !== room.roomTypeId) {
        // Allow assignment even if type differs (staff override), but log it
        console.warn(`[ROOM ASSIGN] Room type mismatch: bookingRoom expects ${bookingRoom.roomTypeId}, assigning ${room.roomTypeId}`);
      }

      // Assign the room
      await prisma.bookingRoom.update({
        where: { id: bookingRoomId },
        data: { roomId },
      });

      // If all bookingRooms now have rooms assigned and booking is pending, auto-confirm
      const updatedBooking = await prisma.booking.findFirst({
        where: { id: req.params.id },
        include: { bookingRooms: { include: { room: true, roomType: true } } },
      });

      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'booking', req.params.id, { action: 'assign_room', roomId, bookingRoomId }, req.ip || undefined);

      return { booking: updatedBooking, status: 200 };
    });

    if ('error' in result) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.booking });
  } catch (err) {
    console.error('[ASSIGN ROOM ERROR]', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});


// PUT /bookings/:id — Update booking details (guest info, dates, notes)
bookingsRouter.put('/:id', validateRequest(updateBookingSchema), authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const { guestName, guestPhone, guestEmail, notes, checkInDate, checkOutDate } = req.body;

    const result = await withTenant(req.tenantId!, async () => {
      const booking = await prisma.booking.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId! },
      });
      if (!booking) return { error: 'Booking not found', status: 404 };

      // Only allow edits on non-cancelled, non-checked-out bookings
      if (['cancelled', 'checked_out', 'no_show'].includes(booking.status)) {
        return { error: 'Cannot edit a completed or cancelled booking', status: 400 };
      }

      const updateData: any = {};
      if (guestName !== undefined) updateData.guestName = guestName.trim();
      if (guestPhone !== undefined) updateData.guestPhone = guestPhone.trim();
      if (guestEmail !== undefined) updateData.guestEmail = guestEmail?.trim()?.toLowerCase() || null;
      if (notes !== undefined) updateData.notes = notes?.trim() || null;
      if (checkInDate !== undefined) updateData.checkInDate = new Date(checkInDate + 'T12:00:00+05:30');
      if (checkOutDate !== undefined) updateData.checkOutDate = new Date(checkOutDate + 'T12:00:00+05:30');

      const updated = await prisma.booking.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          bookingRooms: { include: { room: true, roomType: true } },
        },
      });

      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'booking', req.params.id, updateData, req.ip || undefined);

      return { booking: updated, status: 200 };
    });

    if ('error' in result) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.booking });
  } catch (err) {
    console.error('[BOOKING UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
