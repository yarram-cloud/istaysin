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

    const where: any = {};
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
      }),
      prisma.guestProfile.count({ where }),
    ]);

    res.json({
      success: true,
      data: guests,
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
    };

    // Check if guest profile exists by email or phone
    let guest = null;
    if (guestData.email) {
      guest = await prisma.guestProfile.findFirst({
        where: { email: { equals: guestData.email, mode: 'insensitive' } },
      });
    }
    if (!guest && guestData.phone) {
      guest = await prisma.guestProfile.findFirst({ where: { phone: guestData.phone } });
    }

    if (guest) {
      // Update existing guest profile
      guest = await prisma.guestProfile.update({
        where: { id: guest.id },
        data: guestData,
      });
      res.json({ success: true, data: guest, message: 'Guest profile updated' });
    } else {
      // Create guest profile linked to an optional global user
      // NOTE: We no longer create a GlobalUser stub for walk-in guests.
      // GlobalUser should only be created when the guest registers themselves.
      // This avoids "fake" accounts with temp emails and hashed random passwords.
      guest = await prisma.guestProfile.create({
        data: guestData,
      });
      res.status(201).json({ success: true, data: guest, message: 'Guest profile created' });
    }
  } catch (err) {
    console.error('[GUESTS CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create guest' });
  }
});

// GET /guests/:id
guestsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const guest = await prisma.guestProfile.findUnique({
      where: { id: req.params.id },
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
