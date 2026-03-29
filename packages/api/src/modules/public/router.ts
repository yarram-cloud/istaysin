import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { optionalAuth } from '../../middleware/auth';
import { bookingSchema } from '@istays/shared';
import { calculatePricing } from '../../services/pricing';
import { sendBookingConfirmation } from '../../services/email';
export const publicRouter = Router();

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
        id: true, name: true, slug: true, propertyType: true,
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

    res.json({ success: true, data: property });
  } catch (err) {
    console.error('[PUBLIC PROPERTY DETAIL ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
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
publicRouter.post('/reviews', async (req: Request, res: Response) => {
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

    const bookingNumber = `IS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
          description: `Room charge - ${new Date(night.date).toLocaleDateString()} ${night.ruleApplied ? `(${night.ruleApplied})` : ''}`,
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
        status: 'pending_confirmation',
        totalAmount,
        advancePaid: 0,
        balanceDue: totalAmount,
        specialRequests: data.specialRequests || null,
        createdBy: 'public_website',
        bookingRooms: { create: bookingRoomsData },
        folioCharges: { create: folioChargesData },
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

    res.json({ success: true, data: booking });
  } catch (err) {
    console.error('[PUBLIC BOOKING ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});
