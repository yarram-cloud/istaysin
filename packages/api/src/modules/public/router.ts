import { validateRequest } from '../../middleware/validate';
import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { optionalAuth } from '../../middleware/auth';
import { bookingSchema, createReviewSchema, createRazorpayOrderSchema, verifyRazorpayOrderSchema } from '@istays/shared';
import { calculatePricing } from '../../services/pricing';
import { sendBookingConfirmation } from '../../services/email';
import { dispatchBookingConfirmation } from '../../services/whatsapp';
import { logAudit } from '../../middleware/audit-log';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../services/razorpay';
import { publicHintsLimiter } from '../../middleware/rate-limit';
import { getPlanFeatures } from '../../config/plan-features';
export const publicRouter = Router();

// GET /public/plans — public plan pricing (no auth required)
publicRouter.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.saasPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        actualPrice: true,
        discountMonthly: true,
        discountYearly: true,
        features: true,
        description: true,
      },
      orderBy: { actualPrice: 'asc' },
    });
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error('[PUBLIC PLANS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// GET /public/properties — public property directory
publicRouter.get('/properties', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { city, state, type, search, minPrice, maxPrice, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { status: 'active' };
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    if (type) where.propertyType = type;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { tagline: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        select: {
          id: true, name: true, slug: true, propertyType: true,
          city: true, state: true, brandLogo: true, heroImage: true,
          tagline: true, description: true, latitude: true, longitude: true,
          primaryColor: true,
          roomTypes: {
            where: { isActive: true },
            select: { baseRate: true, name: true },
            orderBy: { baseRate: 'asc' },
            take: 1,
          },
          reviews: {
            where: { isPublished: true },
            select: { rating: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.tenant.count({ where }),
    ]);

    // Calculate average rating and starting price
    const enriched = properties.map((p) => ({
      ...p,
      startingPrice: p.roomTypes[0]?.baseRate || 0,
      avgRating: p.reviews.length > 0 ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length : 0,
      reviewCount: p.reviews.length,
      roomTypes: undefined,
      reviews: undefined,
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[PUBLIC PROPERTIES ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
});

// GET /public/properties/:slug — single property detail
publicRouter.get('/properties/:slug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const property = await prisma.tenant.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, name: true, slug: true, propertyType: true, plan: true,
        address: true, city: true, state: true, pincode: true,
        contactPhone: true, contactEmail: true,
        latitude: true, longitude: true, brandLogo: true, heroImage: true,
        primaryColor: true, secondaryColor: true, tagline: true, description: true,
        defaultCheckInTime: true, defaultCheckOutTime: true,
        cancellationPolicyHours: true, config: true,
        roomTypes: {
          where: { isActive: true },
          include: {
            photos: { orderBy: { sortOrder: 'asc' } },
            _count: { select: { rooms: true } },
          },
          orderBy: { baseRate: 'asc' },
        },
        reviews: {
          where: { isPublished: true },
          select: { id: true, rating: true, text: true, ownerReply: true, createdAt: true, guestProfile: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!property) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    // SECURITY PATCH: Strip sensitive configuration data from the public unauthenticated output
    const rawConfig = (property.config as Record<string, any>) || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { razorpaySecret, twilioToken, customPlanPricing, domainVerified, ...safeConfig } = rawConfig;

    // Plan-gate the website-builder fields that inject tenant-controlled HTML/JS/CSS.
    // The dashboard saves these for any plan, but they are only RENDERED on the
    // public page when the plan permits — fail closed if the plan is unknown.
    const features = getPlanFeatures(property.plan);
    if (safeConfig.websiteBuilder?.components) {
      const components = { ...safeConfig.websiteBuilder.components };
      if (!features.customScripts && components.scripts) {
        components.scripts = { head: '', body: '' };
      }
      if (!features.customCss && components.advanced) {
        components.advanced = { ...components.advanced, customCss: '' };
      }
      safeConfig.websiteBuilder = { ...safeConfig.websiteBuilder, components };
    }

    const data = {
      ...property,
      config: safeConfig,
      hasOnlinePayment: !!rawConfig.razorpayKeyId && !!rawConfig.razorpaySecret,
      allowPayAtHotel: rawConfig.allowPayAtHotel !== false, // default true
      featureFlags: features,
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error('[PUBLIC PROPERTY DETAIL ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
  }
});

// GET /public/properties/:slug/rate-comparison — OTA Competitor Rates
publicRouter.get('/properties/:slug/rate-comparison', async (req: Request, res: Response) => {
  try {
    const property = await prisma.tenant.findUnique({
      where: { slug: req.params.slug },
      select: { competitorRates: true }
    });

    if (!property) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    const rates = (property.competitorRates as Record<string, any>) || { enabled: false };
    
    // Only return data if it's explicitly enabled by the property owner
    if (!rates.enabled) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({ success: true, data: rates });
  } catch (err) {
    console.error('[PUBLIC RATE COMPARISON ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rate comparisons' });
  }
});

// GET /public/properties/:slug/availability-hints — urgency triggers
publicRouter.get('/properties/:slug/availability-hints', publicHintsLimiter, async (req: Request, res: Response) => {
  try {
    const property = await prisma.tenant.findUnique({
      where: { slug: req.params.slug },
      select: { id: true }
    });

    if (!property) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    const tenantId = property.id;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [roomsLeftToday, recentBookings, dynamicPricingCount] = await Promise.all([
      prisma.room.count({
        where: { tenantId, status: 'available', isActive: true }
      }),
      prisma.booking.count({
        where: { tenantId, createdAt: { gte: last24h }, status: { not: 'cancelled' } }
      }),
      prisma.pricingRule.count({
        where: { tenantId, isActive: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        roomsLeftToday,
        recentBookings,
        dynamicPricingActive: dynamicPricingCount > 0
      }
    });
  } catch (err) {
    console.error('[AVAILABILITY HINTS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hints' });
  }
});

// GET /public/search — search with filters
publicRouter.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { q, checkIn, checkOut, guests, city } = req.query;

    const where: any = { status: 'active' };
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { city: { contains: q as string, mode: 'insensitive' } },
        { state: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    const properties = await prisma.tenant.findMany({
      where,
      select: {
        id: true, name: true, slug: true, propertyType: true,
        city: true, state: true, brandLogo: true, heroImage: true, tagline: true,
        latitude: true, longitude: true,
        roomTypes: {
          where: { isActive: true },
          select: { baseRate: true },
          orderBy: { baseRate: 'asc' },
          take: 1,
        },
      },
      take: 50,
    });

    const results = properties.map((p) => ({
      ...p,
      startingPrice: p.roomTypes[0]?.baseRate || 0,
      roomTypes: undefined,
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// GET /public/resolve-domain?domain=www.myproperty.com — Resolve custom domain to tenant slug
publicRouter.get('/resolve-domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
      res.status(400).json({ success: false, error: 'domain query parameter is required' });
      return;
    }

    const normalizedDomain = domain.toLowerCase().replace(/\.$/, '');

    const tenant = await prisma.tenant.findFirst({
      where: {
        customDomain: normalizedDomain,
        status: 'active',
      },
      select: { slug: true, name: true },
    });

    if (!tenant) {
      res.status(404).json({ success: false, error: 'Domain not found' });
      return;
    }

    res.json({ success: true, data: { slug: tenant.slug, name: tenant.name } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to resolve domain' });
  }
});

// GET /public/check-slug/:slug — Check if subdomain is available
publicRouter.get('/check-slug/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();

    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
      res.json({ success: true, data: { available: false, reason: 'Invalid format. Use 3-50 lowercase letters, numbers, and hyphens.' } });
      return;
    }

    const reserved = ['admin', 'api', 'www', 'app', 'mail', 'blog', 'docs', 'help', 'support', 'dashboard', 'login', 'register', 'property', 'book', 'search'];
    if (reserved.includes(slug)) {
      res.json({ success: true, data: { available: false, reason: 'This subdomain is reserved.' } });
      return;
    }

    const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    res.json({ success: true, data: { available: !existing, reason: existing ? 'This subdomain is already taken.' : null } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check slug' });
  }
});

// POST /public/reviews — Guest submits a review
publicRouter.post('/reviews', validateRequest(createReviewSchema), async (req: Request, res: Response) => {
  try {
    const { bookingNumber, email, rating, text } = req.body;

    if (!bookingNumber || !email || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'Invalid review payload. Check booking number, email, and rating.' });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber: bookingNumber.trim(),
        guestProfile: { email: { equals: email.trim(), mode: 'insensitive' } }
      },
      include: { guestProfile: true }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found or email does not match the reservation.' });
      return;
    }

    const existingReview = await prisma.review.findUnique({
      where: { bookingId: booking.id }
    });

    if (existingReview) {
      res.status(400).json({ success: false, error: 'A review has already been submitted for this booking.' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        tenantId: booking.tenantId,
        bookingId: booking.id,
        guestProfileId: booking.guestProfileId!,
        rating,
        text,
        isPublished: true, // auto-publish by default
      }
    });

    res.json({ success: true, data: review, message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('[PUBLIC REVIEW ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

// GET /public/check-availability
publicRouter.get('/check-availability', async (req: Request, res: Response) => {
  try {
    const { tenantId, roomTypeId, checkIn, checkOut, extraBeds } = req.query;

    if (!tenantId || !roomTypeId || !checkIn || !checkOut) {
      res.status(400).json({ success: false, error: 'Missing required parameters' });
      return;
    }

    const pricing = await calculatePricing(
      tenantId as string,
      roomTypeId as string,
      new Date(checkIn as string),
      new Date(checkOut as string),
      parseInt(extraBeds as string || '0', 10)
    );

    // TODO: Verify actual inventory constraints here if needed by fetching remaining rooms
    const totalRooms = await prisma.room.count({ where: { roomTypeId: roomTypeId as string, tenantId: tenantId as string } });
    if (totalRooms === 0) {
      res.json({ success: true, data: { available: false, pricing: null, reason: 'No rooms of this type exist.' } });
      return;
    }

    res.json({ success: true, data: { available: true, pricing } });
  } catch (err) {
    console.error('[PUBLIC AVAILABILITY ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
});

// POST /public/bookings
publicRouter.post('/bookings', async (req: Request, res: Response) => {
  try {
    const { tenantId, ...body } = req.body;
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'tenantId is required' });
      return;
    }

    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;
    const nights = Math.ceil((new Date(data.checkOutDate).getTime() - new Date(data.checkInDate).getTime()) / 86400000);
    if (nights <= 0) {
      res.status(400).json({ success: false, error: 'Check-out must be after check-in' });
      return;
    }

    const bookingNumber = `IS-${Date.now().toString(36).toUpperCase()}-${require('crypto').randomInt(1000, 9999)}`;
    let totalAmount = 0;
    const bookingRoomsData = [];
    const folioChargesData: any[] = [];

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true, name: true }
    });
    const tenantConfig = (tenant?.config as Record<string, any>) || {};
    const propertyState = tenantConfig.state?.toLowerCase() || '';
    const guestState = data.guestState?.toLowerCase() || '';

    // Pay at Hotel validation
    const isPayAtHotel = data.paymentMode === 'pay_at_hotel';
    if (isPayAtHotel && tenantConfig.allowPayAtHotel === false) {
      res.status(400).json({ success: false, error: 'Pay at Hotel is not available for this property' });
      return;
    }

    // Anti-abuse: max 2 active pay_at_hotel bookings per phone per tenant
    if (isPayAtHotel && data.guestPhone) {
      const activePayAtHotelCount = await prisma.booking.count({
        where: {
          tenantId,
          guestPhone: data.guestPhone,
          status: { in: ['confirmed', 'pending_confirmation'] },
          advancePaid: 0,
        },
      });
      const maxPayAtHotel = tenantConfig.maxPayAtHotelPerPhone ?? 2;
      if (activePayAtHotelCount >= maxPayAtHotel) {
        res.status(400).json({
          success: false,
          error: `Maximum ${maxPayAtHotel} active reservations without advance payment allowed per phone number. Please complete or cancel an existing booking first.`,
        });
        return;
      }
    }

    // Auto-expiry: pay_at_hotel bookings expire 6h after check-in time if guest doesn't show up
    const payAtHotelExpiryHours = tenantConfig.payAtHotelExpiryHours ?? 6;
    const payAtHotelExpiryAt = isPayAtHotel
      ? new Date(new Date(data.checkInDate).getTime() + payAtHotelExpiryHours * 3600000)
      : null;

    const isInterState = propertyState && guestState && propertyState !== guestState;

    for (const sel of data.roomSelections) {
      const pricing = await calculatePricing(
        tenantId,
        sel.roomTypeId,
        new Date(data.checkInDate),
        new Date(data.checkOutDate),
        sel.extraBeds
      );

      totalAmount += pricing.grandTotal;
      const firstNightRate = pricing.nightlyRates[0]?.rate || 0;

      bookingRoomsData.push({
        tenantId,
        roomTypeId: sel.roomTypeId,
        ratePerNight: firstNightRate,
        extraBeds: sel.extraBeds,
        extraBedCharge: 0,
      });

      for (const night of pricing.nightlyRates) {
        folioChargesData.push({
          tenantId,
          chargeDate: new Date(night.date),
          category: 'room',
          description: `Room charge - ${new Date(night.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} ${night.ruleApplied ? `(${night.ruleApplied})` : ''}`,
          sacCode: '996311',
          quantity: 1,
          unitPrice: night.rate,
          totalPrice: night.rate,
          gstRate: night.gstAmount > 0 && night.rate > 0 ? Math.round((night.gstAmount / night.rate) * 100) : 0,
          cgst: isInterState ? 0 : night.gstAmount / 2,
          sgst: isInterState ? 0 : night.gstAmount / 2,
          igst: isInterState ? night.gstAmount : 0,
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
            tenantId,
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
            tenantId,
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

    // Identity Merge Logic - Ensure GuestProfile exists
    let guestProfileId = null;
    if (data.guestEmail) {
      const emailLower = data.guestEmail.toLowerCase();
      let guest = await prisma.guestProfile.findFirst({
        where: { email: emailLower },
      });
      if (!guest && data.guestPhone) {
         guest = await prisma.guestProfile.findFirst({
           where: { phone: data.guestPhone }
         });
      }

      if (guest) {
         // Update existing
         guest = await prisma.guestProfile.update({
           where: { id: guest.id },
           data: {
             fullName: data.guestName,
             phone: data.guestPhone || guest.phone
           }
         });
         guestProfileId = guest.id;
      } else {
         // Create new
         const newGuest = await prisma.guestProfile.create({
           data: {
             fullName: data.guestName,
             email: emailLower,
             phone: data.guestPhone || ''
           }
         });
         guestProfileId = newGuest.id;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        bookingNumber,
        guestName: data.guestName,
        guestEmail: data.guestEmail?.toLowerCase() || null,
        guestPhone: data.guestPhone,
        source: 'website',
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        numAdults: data.numAdults,
        numChildren: data.numChildren,
        numRooms: data.roomSelections.length,
        status: isPayAtHotel ? 'confirmed' : 'pending_confirmation',
        totalAmount,
        advancePaid: 0,
        balanceDue: totalAmount,
        specialRequests: data.specialRequests || null,
        couponId,
        discountAmount: discountAmountTotal,
        notes: isPayAtHotel ? JSON.stringify({ paymentMode: 'pay_at_hotel', expiresAt: payAtHotelExpiryAt?.toISOString() }) : null,
        createdBy: 'public_website',
        guestProfileId,
        bookingRooms: { create: bookingRoomsData },
        folioCharges: { create: folioChargesData },
        bookingGuests: { create: [{ tenantId, fullName: data.guestName || 'Guest' }] },
      },
    });

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

    if (data.guestPhone) {
      dispatchBookingConfirmation(
        data.guestPhone, 
        {
          name: data.guestName,
          hotel: tenant?.name || 'Our Property',
          bookingRef: bookingNumber,
          checkInDate: new Date(data.checkInDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
          ...(isPayAtHotel ? { paymentNote: `Payment of ₹${totalAmount} due at check-in` } : {})
        }
      ).catch(console.error);
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    console.error('[PUBLIC BOOKING ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

/**
 * POST /public/payments/razorpay/order
 * Secures a checkout session for a guest without authentication.
 */
publicRouter.post('/payments/razorpay/order', validateRequest(createRazorpayOrderSchema), async (req: Request, res: Response) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      res.status(400).json({ success: false, error: 'bookingId and amount are required' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tenant: { select: { config: true } } }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Ensure the booking isn't fully paid or already confirmed
    if (booking.status !== 'pending_confirmation') {
      res.status(400).json({ success: false, error: `Invalid booking status for advance payment: ${booking.status}` });
      return;
    }

    const config = (booking.tenant.config as Record<string, string>) || {};
    const { razorpayKeyId, razorpaySecret } = config;

    if (!razorpayKeyId || !razorpaySecret) {
      throw new Error('Razorpay gateway is not configured for this property.');
    }

    // Create Razorpay Order
    const receiptId = `rect_pub_${booking.bookingNumber.substring(0, 8)}_${Date.now().toString().substring(8, 12)}`;
    const order = await createRazorpayOrder(Number(amount), receiptId, razorpayKeyId, razorpaySecret);

    res.json({ 
      success: true, 
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId
      }
    });
  } catch (err: any) {
    console.error('[PUBLIC RAZORPAY ORDER ERROR]', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to create Razorpay order' });
  }
});

/**
 * POST /public/payments/razorpay/verify
 * Guest verifies an advance deposit to secure the reservation
 */
publicRouter.post('/payments/razorpay/verify', validateRequest(verifyRazorpayOrderSchema), async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, paymentId, orderId, signature } = req.body;
    if (!bookingId || !amount || !paymentId || !orderId || !signature) {
      res.status(400).json({ success: false, error: 'Missing required parameters' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tenant: { select: { config: true } } }
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    const config = (booking.tenant.config as Record<string, string>) || {};
    const { razorpaySecret } = config;

    if (!razorpaySecret) {
      throw new Error('Razorpay gateway is not configured.');
    }

    const isValid = verifyRazorpayPayment(orderId, paymentId, signature, razorpaySecret);
    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Record the successful payment
    await prisma.guestPayment.create({
      data: {
        tenantId: booking.tenantId,
        bookingId,
        amount: Number(amount),
        method: 'razorpay',
        status: 'completed',
        gatewayPaymentId: paymentId,
      }
    });

    // Directly upgrade to 'confirmed' since advance was paid
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        advancePaid: booking.advancePaid + Number(amount),
        balanceDue: Math.max(0, booking.balanceDue - Number(amount))
      }
    });

    res.json({ success: true, data: { verified: true, paymentId } });
  } catch (err: any) {
    console.error('[PUBLIC RAZORPAY VERIFY ERROR]', err);
    res.status(400).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});
