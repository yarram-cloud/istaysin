import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { z } from 'zod';

export const guestPortalRouter = Router();

/**
 * GET /guest-portal/my-bookings
 * Fetch all bookings linked to the authenticated guest (via phone or email).
 */
guestPortalRouter.get('/my-bookings', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.globalUser.findUnique({
      where: { id: req.userId },
      select: { email: true, phone: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Find guest profile linked to this user
    const guestProfile = await prisma.guestProfile.findFirst({
      where: {
        OR: [
          { globalUserId: req.userId },
          ...(user.email ? [{ email: user.email }] : []),
          ...(user.phone ? [{ phone: user.phone }] : [])
        ]
      }
    });

    if (!guestProfile) {
      res.json({ success: true, data: [] });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { guestProfileId: guestProfile.id },
      include: {
        bookingRooms: {
          include: {
            roomType: { select: { name: true } },
            room: { select: { roomNumber: true } }
          }
        },
        tenant: {
          select: {
            name: true, slug: true, contactPhone: true, contactEmail: true,
            address: true, city: true, state: true, brandLogo: true,
            defaultCheckInTime: true, defaultCheckOutTime: true
          }
        }
      },
      orderBy: { checkInDate: 'desc' },
      take: 50
    });

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[GUEST PORTAL] my-bookings error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

/**
 * GET /guest-portal/booking/:bookingId
 * Fetch detailed booking info including folio charges for invoice.
 */
guestPortalRouter.get('/booking/:bookingId', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        bookingRooms: {
          include: {
            roomType: { select: { name: true, amenities: true } },
            room: { select: { roomNumber: true } }
          }
        },
        bookingGuests: true,
        folioCharges: { orderBy: { chargeDate: 'asc' } },
        guestPayments: { orderBy: { createdAt: 'asc' } },
        invoices: true,
        tenant: {
          select: {
            name: true, slug: true, gstNumber: true,
            address: true, city: true, state: true, pincode: true,
            contactPhone: true, contactEmail: true, brandLogo: true,
            defaultCheckInTime: true, defaultCheckOutTime: true
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Verify the requesting user is the guest on this booking
    const user = await prisma.globalUser.findUnique({
      where: { id: req.userId },
      select: { email: true, phone: true }
    });

    const isOwner =
      booking.guestEmail?.toLowerCase() === user?.email?.toLowerCase() ||
      booking.guestPhone === user?.phone;

    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Not authorized to view this booking' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    console.error('[GUEST PORTAL] booking detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch booking details' });
  }
});

/**
 * GET /guest-portal/invoice/:bookingId
 * Generate a GST-compliant invoice summary (JSON) for business travelers.
 */
guestPortalRouter.get('/invoice/:bookingId', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        folioCharges: { orderBy: { chargeDate: 'asc' } },
        guestPayments: true,
        invoices: true,
        tenant: {
          select: {
            name: true, gstNumber: true,
            address: true, city: true, state: true, pincode: true
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Auth check
    const user = await prisma.globalUser.findUnique({
      where: { id: req.userId },
      select: { email: true, phone: true }
    });
    const isOwner =
      booking.guestEmail?.toLowerCase() === user?.email?.toLowerCase() ||
      booking.guestPhone === user?.phone;
    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Compute invoice totals
    const subtotal = booking.folioCharges.reduce((sum, c) => sum + c.totalPrice, 0);
    const totalCgst = booking.folioCharges.reduce((sum, c) => sum + c.cgst, 0);
    const totalSgst = booking.folioCharges.reduce((sum, c) => sum + c.sgst, 0);
    const totalIgst = booking.folioCharges.reduce((sum, c) => sum + c.igst, 0);
    const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;
    const totalPaid = booking.guestPayments.reduce((sum, p) => sum + p.amount, 0);

    const invoice = {
      propertyName: booking.tenant.name,
      propertyGstin: booking.tenant.gstNumber,
      propertyAddress: [booking.tenant.address, booking.tenant.city, booking.tenant.state, booking.tenant.pincode].filter(Boolean).join(', '),
      bookingNumber: booking.bookingNumber,
      guestName: booking.guestName,
      checkInDate: booking.checkInDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      checkOutDate: booking.checkOutDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      lineItems: booking.folioCharges.map(c => ({
        date: c.chargeDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
        description: c.description,
        sacCode: c.sacCode,
        amount: c.totalPrice,
        cgst: c.cgst,
        sgst: c.sgst,
        igst: c.igst
      })),
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst,
      grandTotal,
      totalPaid,
      balanceDue: grandTotal - totalPaid
    };

    res.json({ success: true, data: invoice });
  } catch (err) {
    console.error('[GUEST PORTAL] invoice error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate invoice' });
  }
});

/**
 * POST /guest-portal/pre-checkin/:bookingId
 * Guest submits ID proof and preferences before arrival.
 */
const preCheckinSchema = z.object({
  idProofType: z.enum(['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id']),
  idProofNumber: z.string().min(4),
  guestState: z.string().optional(),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional()
});

guestPortalRouter.post('/pre-checkin/:bookingId', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = preCheckinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      select: { id: true, guestEmail: true, guestPhone: true, status: true, tenantId: true }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'confirmed' && booking.status !== 'pending_confirmation') {
      res.status(400).json({ success: false, error: 'Pre-check-in is only available for confirmed bookings' });
      return;
    }

    // Auth check
    const user = await prisma.globalUser.findUnique({
      where: { id: req.userId },
      select: { email: true, phone: true, fullName: true }
    });
    const isOwner =
      booking.guestEmail?.toLowerCase() === user?.email?.toLowerCase() ||
      booking.guestPhone === user?.phone;
    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Create or update booking guest record with pre-check-in data
    const existingGuest = await prisma.bookingGuest.findFirst({
      where: { bookingId: booking.id }
    });

    if (existingGuest) {
      await (prisma.bookingGuest as any).update({
        where: { id: existingGuest.id },
        data: {
          idProofType: parsed.data.idProofType,
          idProofNumber: parsed.data.idProofNumber,
          guestState: parsed.data.guestState
        }
      });
    } else {
      await (prisma.bookingGuest as any).create({
        data: {
          tenantId: booking.tenantId,
          bookingId: booking.id,
          fullName: user?.fullName || 'Guest',
          idProofType: parsed.data.idProofType,
          idProofNumber: parsed.data.idProofNumber,
          guestState: parsed.data.guestState
        }
      });
    }

    // Update special requests on booking
    if (parsed.data.specialRequests) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { specialRequests: parsed.data.specialRequests }
      });
    }

    res.json({ success: true, message: 'Pre-check-in information saved successfully' });
  } catch (err) {
    console.error('[GUEST PORTAL] pre-checkin error:', err);
    res.status(500).json({ success: false, error: 'Failed to save pre-check-in data' });
  }
});

/**
 * GET /guest-portal/lookup?bookingRef=XXX&phone=YYY
 * Public lookup (no auth required) — guest can find their booking by ref + phone.
 */
guestPortalRouter.get('/lookup', async (req: Request, res: Response) => {
  try {
    const { bookingRef, phone } = req.query;
    if (!bookingRef || !phone) {
      res.status(400).json({ success: false, error: 'bookingRef and phone are required' });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber: bookingRef as string,
        guestPhone: { contains: phone as string }
      },
      include: {
        tenant: { select: { name: true, slug: true, contactPhone: true, defaultCheckInTime: true, defaultCheckOutTime: true } },
        bookingRooms: { include: { roomType: { select: { name: true } } } }
      }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found. Please check your reference number and phone.' });
      return;
    }

    // Return limited info for unauthenticated lookup
    res.json({
      success: true,
      data: {
        bookingNumber: booking.bookingNumber,
        guestName: booking.guestName,
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numRooms: booking.numRooms,
        totalAmount: booking.totalAmount,
        propertyName: booking.tenant.name,
        propertySlug: booking.tenant.slug,
        roomTypes: booking.bookingRooms.map(br => br.roomType.name),
        checkInTime: booking.tenant.defaultCheckInTime,
        checkOutTime: booking.tenant.defaultCheckOutTime
      }
    });
  } catch (err) {
    console.error('[GUEST PORTAL] lookup error:', err);
    res.status(500).json({ success: false, error: 'Lookup failed' });
  }
});
