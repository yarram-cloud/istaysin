import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';
import { z } from 'zod';

export const loyaltyRouter = Router();

// ───── Tier thresholds ─────
const TIER_THRESHOLDS = [
  { tier: 'platinum', minPoints: 50000, multiplier: 2.0 },
  { tier: 'gold', minPoints: 15000, multiplier: 1.5 },
  { tier: 'silver', minPoints: 5000, multiplier: 1.25 },
  { tier: 'bronze', minPoints: 0, multiplier: 1.0 },
];

function resolveTier(totalPoints: number): { tier: string; multiplier: number } {
  for (const t of TIER_THRESHOLDS) {
    if (totalPoints >= t.minPoints) return t;
  }
  return TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

// ───── Guest endpoints (authenticated, no tenant required) ─────

// GET /loyalty/account — guest's loyalty balance
loyaltyRouter.get('/account', authenticate, async (req: Request, res: Response) => {
  try {
    const guestProfile = await prisma.guestProfile.findFirst({
      where: { globalUserId: req.userId },
    });
    if (!guestProfile) {
      res.json({ success: true, data: null, message: 'No guest profile found' });
      return;
    }

    let account = await prisma.loyaltyAccount.findUnique({
      where: { guestProfileId: guestProfile.id },
    });

    // Auto-create loyalty account if none exists
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { guestProfileId: guestProfile.id },
      });
    }

    const { tier, multiplier } = resolveTier(account.totalPoints);

    res.json({
      success: true,
      data: {
        ...account,
        tier,
        multiplier,
        nextTier: TIER_THRESHOLDS.find(t => t.minPoints > account!.totalPoints) || null,
      },
    });
  } catch (err) {
    console.error('[LOYALTY ACCOUNT ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch loyalty account' });
  }
});

// GET /loyalty/transactions — point history
loyaltyRouter.get('/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const guestProfile = await prisma.guestProfile.findFirst({
      where: { globalUserId: req.userId },
    });
    if (!guestProfile) {
      res.json({ success: true, data: [] });
      return;
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where: { guestProfileId: guestProfile.id },
    });
    if (!account) {
      res.json({ success: true, data: [] });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const transactions = await prisma.pointTransaction.findMany({
      where: { loyaltyAccountId: account.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error('[LOYALTY TRANSACTIONS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// ───── Property-scoped endpoints (owner manages rewards) ─────
loyaltyRouter.use('/rewards', authenticate, resolveTenant, requireTenant);

// GET /loyalty/rewards — list rewards for the property
loyaltyRouter.get('/rewards', async (req: Request, res: Response) => {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { pointsCost: 'asc' },
    });
    res.json({ success: true, data: rewards });
  } catch (err) {
    console.error('[LOYALTY REWARDS LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rewards' });
  }
});

const rewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  pointsCost: z.number().int().min(1, 'Points cost must be at least 1'),
  rewardType: z.enum(['discount_percent', 'discount_flat', 'free_night', 'upgrade', 'amenity']),
  rewardValue: z.number().min(0).max(100000),
  maxRedemptions: z.number().int().min(1).optional(),
});

const updateRewardSchema = rewardSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// POST /loyalty/rewards — create a reward (owner only)
loyaltyRouter.post('/rewards', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = rewardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    // Cap discount_percent at 100
    if (parsed.data.rewardType === 'discount_percent' && parsed.data.rewardValue > 100) {
      res.status(400).json({ success: false, error: 'Percentage discount cannot exceed 100%' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const reward = await prisma.loyaltyReward.create({
        data: { tenantId: req.tenantId!, ...parsed.data },
      });
      await logAudit(req.tenantId!, req.userId, 'CREATE', 'loyalty_reward', reward.id, { name: parsed.data.name }, req.ip || undefined);
      res.status(201).json({ success: true, data: reward });
    });
  } catch (err) {
    console.error('[LOYALTY REWARD CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create reward' });
  }
});

// PUT /loyalty/rewards/:id — update a reward
loyaltyRouter.put('/rewards/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const parsed = updateRewardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    // Cap discount_percent at 100
    if (parsed.data.rewardType === 'discount_percent' && parsed.data.rewardValue !== undefined && parsed.data.rewardValue > 100) {
      res.status(400).json({ success: false, error: 'Percentage discount cannot exceed 100%' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.loyaltyReward.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.tenantId !== req.tenantId) {
        res.status(404).json({ success: false, error: 'Reward not found' });
        return;
      }

      const updated = await prisma.loyaltyReward.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'loyalty_reward', updated.id, {}, req.ip || undefined);
      res.json({ success: true, data: updated });
    });
  } catch (err) {
    console.error('[LOYALTY REWARD UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update reward' });
  }
});

// DELETE /loyalty/rewards/:id
loyaltyRouter.delete('/rewards/:id', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const existing = await prisma.loyaltyReward.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.tenantId !== req.tenantId) {
        res.status(404).json({ success: false, error: 'Reward not found' });
        return;
      }
      await prisma.loyaltyReward.delete({ where: { id: req.params.id } });
      await logAudit(req.tenantId!, req.userId, 'DELETE', 'loyalty_reward', req.params.id, {}, req.ip || undefined);
      res.json({ success: true, message: 'Reward deleted' });
    });
  } catch (err) {
    console.error('[LOYALTY REWARD DELETE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to delete reward' });
  }
});

// ───── Redemption endpoint ─────

// POST /loyalty/redeem — guest redeems a reward
loyaltyRouter.post('/redeem', authenticate, resolveTenant, requireTenant, async (req: Request, res: Response) => {
  try {
    const redeemSchema = z.object({
      rewardId: z.string().uuid('Invalid reward ID'),
      bookingId: z.string().uuid().optional(),
    });
    const parsed = redeemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const { rewardId, bookingId } = parsed.data;

    const guestProfile = await prisma.guestProfile.findFirst({
      where: { globalUserId: req.userId },
    });
    if (!guestProfile) {
      res.status(404).json({ success: false, error: 'No guest profile' });
      return;
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where: { guestProfileId: guestProfile.id },
    });
    if (!account) {
      res.status(404).json({ success: false, error: 'No loyalty account' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const reward = await prisma.loyaltyReward.findUnique({ where: { id: rewardId } });
      if (!reward || reward.tenantId !== req.tenantId || !reward.isActive) {
        res.status(404).json({ success: false, error: 'Reward not available' });
        return;
      }

      if (account.currentPoints < reward.pointsCost) {
        res.status(400).json({ success: false, error: `Insufficient points. You have ${account.currentPoints} but need ${reward.pointsCost}.` });
        return;
      }

      if (reward.maxRedemptions && reward.timesRedeemed >= reward.maxRedemptions) {
        res.status(400).json({ success: false, error: 'This reward has reached its maximum redemptions' });
        return;
      }

      // Deduct points + create redemption in transaction
      await prisma.$transaction([
        prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: { currentPoints: { decrement: reward.pointsCost } },
        }),
        prisma.pointTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            tenantId: req.tenantId!,
            bookingId: bookingId || null,
            type: 'redeem',
            points: -reward.pointsCost,
            description: `Redeemed: ${reward.name}`,
          },
        }),
        prisma.rewardRedemption.create({
          data: {
            loyaltyAccountId: account.id,
            rewardId: reward.id,
            bookingId: bookingId || null,
            pointsSpent: reward.pointsCost,
          },
        }),
        prisma.loyaltyReward.update({
          where: { id: reward.id },
          data: { timesRedeemed: { increment: 1 } },
        }),
      ]);

      res.json({ success: true, message: `Successfully redeemed "${reward.name}" for ${reward.pointsCost} points!` });
    });
  } catch (err) {
    console.error('[LOYALTY REDEEM ERROR]', err);
    res.status(500).json({ success: false, error: 'Redemption failed' });
  }
});

// ───── Utility: Credit points (called internally after booking) ─────
export async function creditLoyaltyPoints(
  guestProfileId: string,
  tenantId: string,
  bookingId: string,
  totalAmount: number
): Promise<void> {
  try {
    // Load tenant config for earn rate
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const config = (tenant?.config as any) || {};
    const baseEarnRate = config.loyalty?.earnRate || 10; // points per ₹100

    // Get or create loyalty account
    let account = await prisma.loyaltyAccount.findFirst({
      where: { guestProfileId },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { guestProfileId },
      });
    }

    // Determine tier multiplier
    const { multiplier } = resolveTier(account.totalPoints);
    const points = Math.floor((totalAmount / 100) * baseEarnRate * multiplier);

    if (points <= 0) return;

    // Credit in transaction
    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          currentPoints: { increment: points },
          totalPoints: { increment: points },
          lifetimeBookings: { increment: 1 },
        },
      }),
      prisma.pointTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          tenantId,
          bookingId,
          type: 'earn',
          points,
          description: `Earned from booking (₹${totalAmount.toLocaleString('en-IN')})`,
        },
      }),
    ]);

    // Check tier upgrade
    const updatedAccount = await prisma.loyaltyAccount.findUnique({ where: { id: account.id } });
    if (updatedAccount) {
      const newTier = resolveTier(updatedAccount.totalPoints);
      if (newTier.tier !== updatedAccount.tier) {
        await prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: { tier: newTier.tier },
        });
      }
    }

    console.log(`[LOYALTY] Credited ${points} pts to guest ${guestProfileId} (tier: ${resolveTier(account.totalPoints + points).tier})`);
  } catch (err) {
    console.error('[LOYALTY CREDIT ERROR]', err);
    // Non-blocking — don't throw. Booking should succeed even if loyalty fails.
  }
}
