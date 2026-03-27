import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { optionalAuth } from '../../middleware/auth';

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
        cancellationPolicyHours: true,
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
