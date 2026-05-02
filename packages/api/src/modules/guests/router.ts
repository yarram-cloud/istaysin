import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { guestSchema } from '@istays/shared';

export const guestsRouter = Router();
guestsRouter.use(authenticate, resolveTenant, requireTenant);

// Clamp pagination values for safety
function clampPagination(page: string | undefined, limit: string | undefined) {
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  return { page: p, limit: l };
}

// GET /guests — search guests
guestsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const { page, limit } = clampPagination(req.query.page as string, req.query.limit as string);
    const tenantId = req.tenantId!;

    const where: any = { tenantId };
    if (search) {
      const searchStr = (search as string).trim();
      if (searchStr) {
        where.OR = [
          { fullName: { contains: searchStr, mode: 'insensitive' } },
          { email: { contains: searchStr, mode: 'insensitive' } },
          { phone: { contains: searchStr } },
        ];
      }
    }

    const [guests, total] = await Promise.all([
      prisma.guestProfile.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              bookings: { where: { status: 'checked_out' } },
            },
          },
          bookings: {
            where: { status: 'checked_out' },
            orderBy: { checkOutDate: 'desc' },
            take: 1,
            select: { checkOutDate: true },
          },
        },
      }),
      prisma.guestProfile.count({ where }),
    ]);

    // Map to include totalStays and lastVisit
    const enriched = guests.map((g: any) => ({
      ...g,
      totalStays: g._count?.bookings || 0,
      lastVisit: g.bookings?.[0]?.checkOutDate || null,
      _count: undefined,
      bookings: undefined,
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GUESTS LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch guests' });
  }
});

// POST /guests
guestsRouter.post('/', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = guestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const guestData = {
      ...parsed.data,
      email: parsed.data.email?.toLowerCase() || undefined,
      tenantId: req.tenantId!,
    };

    await withTenant(req.tenantId!, async () => {
      // Check if guest profile exists by email or phone FOR THIS TENANT
      let guest = null;
      if (guestData.email) {
        guest = await prisma.guestProfile.findFirst({
          where: { tenantId: req.tenantId!, email: { equals: guestData.email, mode: 'insensitive' } },
        });
      }
      if (!guest && guestData.phone) {
        guest = await prisma.guestProfile.findFirst({ where: { tenantId: req.tenantId!, phone: guestData.phone } });
      }

      if (guest) {
        // Update existing guest profile
        guest = await prisma.guestProfile.update({
          where: { id: guest.id },
          data: guestData,
        });
        res.json({ success: true, data: guest, message: 'Guest profile updated' });
      } else {
        guest = await prisma.guestProfile.create({
          data: guestData,
        });
        res.status(201).json({ success: true, data: guest, message: 'Guest profile created' });
      }
    });
  } catch (err) {
    console.error('[GUESTS CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create guest' });
  }
});

// GET /guests/:id
guestsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const guest = await prisma.guestProfile.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });

    if (!guest) {
      res.status(404).json({ success: false, error: 'Guest not found' });
      return;
    }

    res.json({ success: true, data: guest });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch guest' });
  }
});

// PUT /guests/:id — update guest profile
guestsRouter.put('/:id', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const guest = await prisma.guestProfile.findFirst({
        where: { id: req.params.id, tenantId: req.tenantId! },
      });

      if (!guest) {
        res.status(404).json({ success: false, error: 'Guest not found' });
        return;
      }

      // Whitelist updatable fields
      const { fullName, phone, email, nationality, dateOfBirth, gender, idProofType, idProofNumber, address, city, state, pincode } = req.body;
      const data: Record<string, any> = {};
      if (fullName !== undefined) data.fullName = fullName.trim();
      if (phone !== undefined) data.phone = phone.trim() || null;
      if (email !== undefined) data.email = email.trim().toLowerCase() || null;
      if (nationality !== undefined) data.nationality = nationality;
      if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (gender !== undefined) data.gender = gender || null;
      if (idProofType !== undefined) data.idProofType = idProofType || null;
      if (idProofNumber !== undefined) data.idProofNumber = idProofNumber.trim() || null;
      if (address !== undefined) data.address = address.trim() || null;
      if (city !== undefined) data.city = city.trim() || null;
      if (state !== undefined) data.state = state.trim() || null;
      if (pincode !== undefined) data.pincode = pincode.trim() || null;

      const updated = await prisma.guestProfile.update({
        where: { id: guest.id },
        data,
      });

      res.json({ success: true, data: updated, message: 'Guest profile updated' });
    });
  } catch (err) {
    console.error('[GUESTS UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update guest' });
  }
});
