import { validateRequest } from '../../middleware/validate';
import { platformApproveSchema, platformRejectSchema } from '@istays/shared';
import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { requireGlobalAdmin } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';
import { sendPropertyApprovalEmail } from '../../services/email';
import { getSubdomainUrl } from '../../services/cloudflare';

export const platformRouter = Router();
platformRouter.use(authenticate, requireGlobalAdmin);

// GET /platform/registrations — pending approvals
platformRouter.get('/registrations', async (req: Request, res: Response) => {
  try {
    const { status = 'pending_approval' } = req.query;
    const tenants = await prisma.tenant.findMany({
      where: { status: status as string },
      include: { owner: { select: { id: true, fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tenants });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

// POST /platform/approve/:id
platformRouter.post('/approve/:id', validateRequest(platformApproveSchema), async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'active' },
      include: { owner: { select: { email: true } } },
    });

    const subdomainUrl = getSubdomainUrl(tenant.slug);
    sendPropertyApprovalEmail(tenant.owner.email || '', { propertyName: tenant.name, status: 'approved', subdomainUrl }).catch(console.error);
    await logAudit(tenant.id, req.userId, 'APPROVE', 'tenant', tenant.id, { subdomainUrl }, req.ip || undefined);

    res.json({ success: true, data: { ...tenant, subdomainUrl }, message: 'Property approved' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to approve property' });
  }
});

// POST /platform/reject/:id
platformRouter.post('/reject/:id', validateRequest(platformRejectSchema), async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'suspended' },
      include: { owner: { select: { email: true } } },
    });

    sendPropertyApprovalEmail(tenant.owner.email || '', { propertyName: tenant.name, status: 'rejected', reason }).catch(console.error);

    res.json({ success: true, data: tenant, message: 'Property rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reject property' });
  }
});

// GET /platform/tenants — all tenants
platformRouter.get('/tenants', async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          owner: { select: { fullName: true, email: true } },
          _count: { select: { rooms: true, bookings: true, memberships: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({ success: true, data: tenants, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

// GET /platform/analytics
platformRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const [totalTenants, activeTenants, pendingApprovals, totalBookings, totalUsers] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.tenant.count({ where: { status: 'pending_approval' } }),
      prisma.booking.count(),
      prisma.globalUser.count(),
    ]);

    const recentRegistrations = await prisma.tenant.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        pendingApprovals,
        totalBookings,
        totalUsers,
        recentRegistrations,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// ── GST Slabs Configuration ──────────────────────────────────────────────────

/**
 * Default Indian GST slabs for hotel room tariffs.
 * Each slab: { maxRate: upper bound (inclusive), gstPercent: tax rate }
 * Slabs are evaluated in order — first matching slab wins.
 * The last slab should have maxRate: Infinity (or a very large number) to catch all.
 */
const DEFAULT_GST_SLABS = [
  { maxRate: 1000,      gstPercent: 0,  label: 'Exempt (up to ₹1,000)' },
  { maxRate: 7500,      gstPercent: 12, label: 'Standard (₹1,001 – ₹7,500)' },
  { maxRate: 99999999,  gstPercent: 18, label: 'Premium (above ₹7,500)' },
];

// GET /platform/gst-slabs — current GST slab configuration
platformRouter.get('/gst-slabs', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'global' } });
    const config = (settings?.config as Record<string, any>) || {};
    const slabs = Array.isArray(config.gstSlabs) ? config.gstSlabs : DEFAULT_GST_SLABS;
    res.json({ success: true, data: { slabs, isDefault: !config.gstSlabs } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch GST slabs' });
  }
});

// PUT /platform/gst-slabs — update GST slab configuration
platformRouter.put('/gst-slabs', async (req: Request, res: Response) => {
  try {
    const { slabs } = req.body;

    // Validate slabs array
    if (!Array.isArray(slabs) || slabs.length === 0) {
      res.status(400).json({ success: false, error: 'slabs must be a non-empty array' });
      return;
    }

    for (const slab of slabs) {
      if (typeof slab.maxRate !== 'number' || typeof slab.gstPercent !== 'number') {
        res.status(400).json({ success: false, error: 'Each slab must have numeric maxRate and gstPercent' });
        return;
      }
      if (slab.gstPercent < 0 || slab.gstPercent > 100) {
        res.status(400).json({ success: false, error: 'gstPercent must be between 0 and 100' });
        return;
      }
    }

    // Sort slabs by maxRate ascending
    const sortedSlabs = slabs
      .map((s: any) => ({ maxRate: s.maxRate, gstPercent: s.gstPercent, label: s.label || '' }))
      .sort((a: any, b: any) => a.maxRate - b.maxRate);

    // Upsert platform settings
    const existing = await prisma.platformSettings.findUnique({ where: { id: 'global' } });
    const existingConfig = (existing?.config as Record<string, any>) || {};

    await prisma.platformSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', config: { ...existingConfig, gstSlabs: sortedSlabs } },
      update: { config: { ...existingConfig, gstSlabs: sortedSlabs } },
    });

    res.json({ success: true, data: { slabs: sortedSlabs }, message: 'GST slabs updated successfully' });
  } catch (err) {
    console.error('[GST SLABS UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update GST slabs' });
  }
});

// POST /platform/gst-slabs/reset — reset to defaults
platformRouter.post('/gst-slabs/reset', async (_req: Request, res: Response) => {
  try {
    const existing = await prisma.platformSettings.findUnique({ where: { id: 'global' } });
    const existingConfig = (existing?.config as Record<string, any>) || {};
    delete existingConfig.gstSlabs;

    await prisma.platformSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', config: existingConfig },
      update: { config: existingConfig },
    });

    res.json({ success: true, data: { slabs: DEFAULT_GST_SLABS }, message: 'GST slabs reset to defaults' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset GST slabs' });
  }
});

// ── SaaS Plan Configuration ──────────────────────────────────────────────────

const DEFAULT_PLANS = [
  { code: 'free',         name: 'Starter',      actualPrice: 0,     discountMonthly: 0,    discountYearly: 0,    features: ['5 Rooms', 'Basic Dashboard', 'Walk-in Bookings'] },
  { code: 'basic',        name: 'Basic',         actualPrice: 2999,  discountMonthly: 1199, discountYearly: 999,  features: ['25 Rooms', 'Online Bookings', 'GST Invoicing', 'Guest CRM', 'Night Audit'] },
  { code: 'professional', name: 'Professional',  actualPrice: 5999,  discountMonthly: 2999, discountYearly: 2499, features: ['Unlimited Rooms', 'Channel Manager', 'Revenue Analytics', 'Custom Domain', 'Rate Comparison Widget'] },
  { code: 'enterprise',   name: 'Enterprise',    actualPrice: 9999,  discountMonthly: 6999, discountYearly: 5999, features: ['Everything in Pro', 'WhatsApp Automation', 'Multi-Property', 'Dedicated Support', 'API Access'] },
];

/** Auto-seed / sync plans — idempotent, never throws on existing records */
async function ensurePlansSeeded() {
  for (const plan of DEFAULT_PLANS) {
    await prisma.saasPlan.upsert({
      where: { code: plan.code },
      update: {}, // never overwrite admin-edited prices on restart
      create: {
        code: plan.code,
        name: plan.name,
        actualPrice: plan.actualPrice,
        discountMonthly: plan.discountMonthly,
        discountYearly: plan.discountYearly,
        features: plan.features,
        isActive: true,
      },
    });
  }
}


// GET /platform/plans — list all SaaS plans
platformRouter.get('/plans', async (_req: Request, res: Response) => {
  try {
    await ensurePlansSeeded();
    const plans = await prisma.saasPlan.findMany({ orderBy: { actualPrice: 'asc' } });
    res.json({ success: true, data: plans });
  } catch (err) {
    console.error('[PLANS GET ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// PUT /platform/plans/:id — update plan pricing
platformRouter.put('/plans/:id', async (req: Request, res: Response) => {
  try {
    const { name, actualPrice, discountMonthly, discountYearly, features, isActive, description } = req.body;

    const plan = await prisma.saasPlan.findUnique({ where: { id: req.params.id } });
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (actualPrice !== undefined) updateData.actualPrice = Number(actualPrice);
    if (discountMonthly !== undefined) updateData.discountMonthly = Number(discountMonthly);
    if (discountYearly !== undefined) updateData.discountYearly = Number(discountYearly);
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.saasPlan.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, data: updated, message: 'Plan updated successfully' });
  } catch (err) {
    console.error('[PLAN UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// PUT /platform/plans/bulk — update all plans at once
platformRouter.put('/plans-bulk', async (req: Request, res: Response) => {
  try {
    const { plans } = req.body;
    if (!Array.isArray(plans) || plans.length === 0) { res.status(400).json({ success: false, error: 'plans must be a non-empty array' }); return; }
    if (plans.length > 10) { res.status(400).json({ success: false, error: 'Too many plans (max 10)' }); return; }

    // Validate each plan's pricing
    for (const p of plans) {
      if (!p.id) { res.status(400).json({ success: false, error: 'Each plan must have an id' }); return; }
      if (p.actualPrice !== undefined && (isNaN(Number(p.actualPrice)) || Number(p.actualPrice) < 0)) {
        res.status(400).json({ success: false, error: `Invalid price for plan ${p.name || p.id}` }); return;
      }
      if (p.discountMonthly !== undefined && Number(p.discountMonthly) < 0) {
        res.status(400).json({ success: false, error: `Invalid discounted price for plan ${p.name || p.id}` }); return;
      }
      if (p.discountYearly !== undefined && Number(p.discountYearly) < 0) {
        res.status(400).json({ success: false, error: `Invalid yearly price for plan ${p.name || p.id}` }); return;
      }
    }

    // Atomic transaction
    const results = await prisma.$transaction(
      plans.map((p: any) => {
        const updateData: any = {};
        if (p.actualPrice !== undefined) updateData.actualPrice = Number(p.actualPrice);
        if (p.discountMonthly !== undefined) updateData.discountMonthly = Number(p.discountMonthly);
        if (p.discountYearly !== undefined) updateData.discountYearly = Number(p.discountYearly);
        if (p.features !== undefined) updateData.features = p.features;
        if (p.name !== undefined) updateData.name = p.name;
        if (p.description !== undefined) updateData.description = p.description;

        return prisma.saasPlan.update({ where: { id: p.id }, data: updateData });
      })
    );

    res.json({ success: true, data: results, message: 'All plans updated' });
  } catch (err) {
    console.error('[PLANS BULK UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update plans' });
  }
});

// ── Per-Tenant Custom Pricing ────────────────────────────────────────────────

// GET /platform/tenants/:tenantId/detail — full tenant info for admin detail page
platformRouter.get('/tenants/:tenantId/detail', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.tenantId },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        subscriptions: { where: { status: 'active' }, take: 1 },
        _count: { select: { rooms: true, bookings: true, memberships: true, roomTypes: true, floors: true } },
      },
    });

    if (!tenant) { res.status(404).json({ success: false, error: 'Tenant not found' }); return; }

    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tenant detail' });
  }
});

// PATCH /platform/tenants/:tenantId/plan — change a tenant's plan tier
//
// Validates the requested plan code against the saasPlan table so admins can't
// drop arbitrary strings into tenant.plan. Mirrors the change onto the active
// subscription row (if any) inside a transaction so the read-side stays consistent.
platformRouter.patch('/tenants/:tenantId/plan', async (req: Request, res: Response) => {
  try {
    const rawPlan = req.body?.plan;
    if (typeof rawPlan !== 'string' || !rawPlan.trim()) {
      res.status(400).json({ success: false, error: 'plan is required' });
      return;
    }
    const plan = rawPlan.trim().toLowerCase();

    // Make sure the plan exists and is enabled before letting it propagate
    await ensurePlansSeeded();
    const planRecord = await prisma.saasPlan.findUnique({ where: { code: plan } });
    if (!planRecord) {
      res.status(400).json({ success: false, error: `Unknown plan code: ${plan}` });
      return;
    }
    if (!planRecord.isActive) {
      res.status(400).json({ success: false, error: `Plan ${plan} is not active` });
      return;
    }

    const existing = await prisma.tenant.findUnique({
      where: { id: req.params.tenantId },
      select: { id: true, plan: true, name: true },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }

    if (existing.plan === plan) {
      res.json({ success: true, data: existing, message: 'Plan unchanged' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.update({
        where: { id: req.params.tenantId },
        data: { plan },
      });
      // Keep the active subscription row in sync so the dashboard's subscription panel matches.
      await tx.subscription.updateMany({
        where: { tenantId: req.params.tenantId, status: 'active' },
        data: { plan },
      });
      return tenant;
    });

    await logAudit(
      updated.id,
      req.userId,
      'UPDATE_PLAN',
      'tenant',
      updated.id,
      { previousPlan: existing.plan, newPlan: plan },
      req.ip || undefined,
    );

    res.json({
      success: true,
      data: updated,
      message: `Plan changed from ${existing.plan} to ${plan}`,
    });
  } catch (err) {
    console.error('[TENANT PLAN UPDATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// GET /platform/tenants/:tenantId/custom-pricing — tenant-specific plan pricing overrides
platformRouter.get('/tenants/:tenantId/custom-pricing', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.tenantId },
      select: { config: true },
    });
    if (!tenant) { res.status(404).json({ success: false, error: 'Tenant not found' }); return; }
    const config = (tenant.config as Record<string, any>) || {};
    res.json({ success: true, data: { customPlanPricing: config.customPlanPricing || null } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch custom pricing' });
  }
});

// PUT /platform/tenants/:tenantId/custom-pricing — set/clear per-tenant plan pricing
platformRouter.put('/tenants/:tenantId/custom-pricing', async (req: Request, res: Response) => {
  try {
    const { customPlanPricing } = req.body;
    // customPlanPricing can be null (to clear) or { planCode: { monthlyPrice, discountedPrice, yearlyPrice, trialDays } }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.tenantId },
      select: { config: true },
    });
    if (!tenant) { res.status(404).json({ success: false, error: 'Tenant not found' }); return; }

    const config = (tenant.config as Record<string, any>) || {};

    if (customPlanPricing === null || customPlanPricing === undefined) {
      delete config.customPlanPricing;
    } else {
      config.customPlanPricing = customPlanPricing;
    }

    await prisma.tenant.update({
      where: { id: req.params.tenantId },
      data: { config },
    });

    res.json({ success: true, message: 'Custom pricing updated', data: { customPlanPricing: config.customPlanPricing || null } });
  } catch (err) {
    console.error('[CUSTOM PRICING ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update custom pricing' });
  }
});

// ── Revenue / Subscriptions Dashboard ────────────────────────────────────────

// GET /platform/revenue — all tenants with their latest subscription + payment info
platformRouter.get('/revenue', async (req: Request, res: Response) => {
  try {
    const {
      plan, billingCycle, paymentStatus, overdue, search,
      page = '1', limit = '20',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const now      = new Date();

    // ── Tenant-level filter ───────────────────────────────────────────────────
    const tenantWhere: any = { status: { not: 'suspended' } };

    if (plan) tenantWhere.plan = plan;

    if (search) {
      tenantWhere.AND = [
        ...(tenantWhere.AND || []),
        {
          OR: [
            { name:         { contains: search as string, mode: 'insensitive' } },
            { slug:         { contains: search as string, mode: 'insensitive' } },
            { contactEmail: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // ── Subscription-level where (pushed to DB where possible) ───────────────
    const subWhere: any = { status: { not: 'cancelled' } };
    if (billingCycle) subWhere.billingCycle = billingCycle;
    if (overdue === 'true') subWhere.currentPeriodEnd = { lt: now };

    if (billingCycle || overdue === 'true') {
      tenantWhere.subscriptions = { some: subWhere };
    }

    // paymentStatus — pushed to DB via Prisma EXISTS/NOT EXISTS (no raw SQL needed)
    if (paymentStatus === 'paid') {
      tenantWhere.platformPayments = { some: { status: 'completed' } };
    } else if (paymentStatus === 'unpaid') {
      tenantWhere.platformPayments = { none: { status: 'completed' } };
    } else if (paymentStatus === 'pending') {
      tenantWhere.platformPayments = { some: { status: 'pending' } };
    }

    await ensurePlansSeeded();
    const [total, tenants, allPlans] = await Promise.all([
      prisma.tenant.count({ where: tenantWhere }),
      prisma.tenant.findMany({
        where: tenantWhere,
        include: {
          owner: { select: { fullName: true, email: true } },
          subscriptions: {
            where:   subWhere,
            orderBy: { createdAt: 'desc' },
            take:    1,
          },
          platformPayments: {
            orderBy: { createdAt: 'desc' },
            take:    1,
            select: { id: true, amount: true, status: true, createdAt: true, receiptNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip:  (pageNum - 1) * limitNum,
        take:  limitNum,
      }),
      prisma.saasPlan.findMany({ where: { isActive: true } }),
    ]);

    // Build a code → plan lookup so we can compute expected amounts without N+1 queries.
    const planByCode = new Map<string, (typeof allPlans)[number]>(
      allPlans.map((p) => [p.code, p]),
    );

    // ── Map tenants → revenue rows ────────────────────────────────────────────
    let rows = tenants.map((t) => {
      const sub     = t.subscriptions[0] ?? null;
      const lastPay = t.platformPayments[0] ?? null;
      const renewsAt = sub?.currentPeriodEnd ?? null;
      const isOverdue = renewsAt ? renewsAt < now && sub?.status === 'active' : false;
      const daysUntilRenewal = renewsAt
        ? Math.ceil((renewsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const billingCycle = (sub?.billingCycle ?? 'monthly') as 'monthly' | 'yearly';

      // Resolve effective plan price: per-tenant override → global SaaS plan → 0.
      // discountedPrice / discountMonthly is the actively marketed monthly rate;
      // yearlyPrice / discountYearly is the per-month rate when paying annually.
      const tenantConfig = ((t.config as Record<string, any>) || {});
      const customPlanPricing = (tenantConfig.customPlanPricing as Record<string, any>) || {};
      const cp = customPlanPricing[t.plan];
      const planRecord = planByCode.get(t.plan) ?? null;

      const effectiveMonthly: number =
        (typeof cp?.discountedPrice === 'number' ? cp.discountedPrice : undefined) ??
        (typeof cp?.monthlyPrice    === 'number' ? cp.monthlyPrice    : undefined) ??
        (planRecord?.discountMonthly ?? planRecord?.actualPrice ?? 0);

      const effectiveYearlyPerMonth: number =
        (typeof cp?.yearlyPrice === 'number' ? cp.yearlyPrice : undefined) ??
        (planRecord?.discountYearly ?? 0);

      const expectedAmount =
        billingCycle === 'yearly'
          ? Math.round(effectiveYearlyPerMonth * 12)
          : Math.round(effectiveMonthly);

      return {
        subscriptionId:     sub?.id ?? null,
        plan:               t.plan,
        billingCycle,
        status:             sub?.status ?? 'no_subscription',
        currentPeriodStart: sub?.currentPeriodStart ?? null,
        renewsAt,
        isOverdue,
        daysUntilRenewal,
        // Effective billing for the current cycle, with override flag for the UI.
        expectedAmount,
        effectiveMonthly:        Math.round(effectiveMonthly),
        effectiveYearlyPerMonth: Math.round(effectiveYearlyPerMonth),
        isCustomPriced:          !!cp,
        tenant: {
          id:           t.id,
          name:         t.name,
          slug:         t.slug,
          contactEmail: t.contactEmail,
          city:         t.city,
          state:        t.state,
          plan:         t.plan,
          tenantStatus: t.status,
          owner:        t.owner,
        },
        lastPayment: lastPay
          ? {
              id:            lastPay.id,
              amount:        lastPay.amount,
              status:        lastPay.status,
              paidAt:        lastPay.createdAt,
              receiptNumber: lastPay.receiptNumber,
            }
          : null,
      };
    });

    // ── Platform-wide summary ─────────────────────────────────────────────────
    const [allPaymentsAgg, overdueCount, activeSubCount] = await Promise.all([
      prisma.platformPayment.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      prisma.subscription.count({ where: { status: { not: 'cancelled' }, currentPeriodEnd: { lt: now } } }),
      prisma.subscription.count({ where: { status: 'active' } }),
    ]);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      summary: {
        totalRevenue:  allPaymentsAgg._sum.amount || 0,
        activeCount:   activeSubCount,
        overdueCount,
        totalCount:    total,
      },
    });
  } catch (err) {
    console.error('[REVENUE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue data' });
  }
});
