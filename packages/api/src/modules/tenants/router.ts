import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import bcrypt from 'bcryptjs';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { propertyRegistrationSchema, brandingSchema, staffInviteSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';
import { sendPropertyApprovalEmail } from '../../services/email';
import { getSubdomainUrl, getRootDomain } from '../../services/cloudflare';
import { invalidateMembership } from '../../middleware/tenant-cache';
import { getPlanFeatures } from '../../config/plan-features';

/**
 * Fire-and-forget revalidation of the public property page after a settings
 * save. Best-effort: a failure here is non-blocking — worst case the owner
 * waits the 60 s ISR window for their changes to appear. Centralised so any
 * future write that affects public-page rendering can call it.
 */
async function triggerPublicRevalidate(slug: string): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  const webUrl = process.env.WEB_URL || process.env.CORS_ORIGIN;
  if (!secret || !webUrl) return; // Feature is opt-in via env

  try {
    await fetch(`${webUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ slug }),
      signal: AbortSignal.timeout(2_000),
    });
  } catch (err) {
    // Don't surface to the user — the save already succeeded. ISR will
    // catch up on the next 60 s window.
    console.warn('[revalidate] trigger failed for', slug, err instanceof Error ? err.message : err);
  }
}

export const tenantsRouter = Router();

// POST /tenants/register-property
tenantsRouter.post('/register-property', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = propertyRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;

    // Generate slug from property name
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const schemaName = `tenant_${slug.replace(/-/g, '_')}`;

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug,
        schemaName,
        status: 'pending_approval',
        plan: data.plan || 'free',
        propertyType: data.propertyType,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        gstNumber: data.gstNumber || null,
        referenceCode: data.referenceCode?.toUpperCase() || null, // normalise to uppercase
        latitude: data.latitude,
        longitude: data.longitude,
        ownerId: req.userId!,
        // Auto-set monthly billing for PG/Hostel properties
        config: ['pg', 'hostel'].includes(data.propertyType)
          ? { defaultBillingMode: 'monthly', billingCycleDay: 1 }
          : { defaultBillingMode: 'nightly' },
      },
    });

    // Create owner membership
    await prisma.tenantMembership.create({
      data: {
        userId: req.userId!,
        tenantId: tenant.id,
        role: 'property_owner',
      },
    });

    // Create initial TenantStats
    await prisma.tenantStats.create({
      data: { tenantId: tenant.id },
    });

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Property registered! Pending admin approval.',
    });
  } catch (err) {
    console.error('[TENANT REGISTER ERROR]', err);
    res.status(500).json({ success: false, error: 'Property registration failed' });
  }
});

// GET /tenants/my-properties
tenantsRouter.get('/my-properties', authenticate, async (req: Request, res: Response) => {
  try {
    const memberships = await prisma.tenantMembership.findMany({
      where: { userId: req.userId!, isActive: true },
      include: {
        tenant: {
          select: {
            id: true, name: true, slug: true, status: true, plan: true,
            propertyType: true, city: true, state: true, brandLogo: true,
            contactPhone: true, contactEmail: true, createdAt: true, config: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: memberships.map((m) => ({
        ...m.tenant,
        role: m.role,
        membershipId: m.id,
        subdomainUrl: m.tenant.status === 'active' ? getSubdomainUrl(m.tenant.slug) : null,
      })),
    });
  } catch (err) {
    console.error('[TENANT MY-PROPERTIES ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
});

// GET /tenants/setup-progress
tenantsRouter.get('/setup-progress', authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const tid = req.tenantId!;

    const [tenant, floorCount, roomTypeCount, roomCount, staffCount] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tid },
        select: {
          name: true, address: true, city: true, state: true,
          contactPhone: true, contactEmail: true,
          gstNumber: true, brandLogo: true, tagline: true, description: true,
          config: true,
        },
      }),
      prisma.floor.count({ where: { tenantId: tid } }),
      prisma.roomType.count({ where: { tenantId: tid } }),
      prisma.room.count({ where: { tenantId: tid } }),
      prisma.tenantMembership.count({ where: { tenantId: tid, isActive: true } }),
    ]);

    if (!tenant) { res.status(404).json({ success: false, error: 'Not found' }); return; }

    const cfg = (tenant.config as Record<string, any>) || {};

    const skippedSteps: string[] = Array.isArray(cfg.skippedSetupSteps) ? cfg.skippedSetupSteps : [];

    const steps = [
      {
        id: 'property_info',
        completed: !!(tenant.address && tenant.city && tenant.state && tenant.contactPhone),
        detail: [
          !tenant.address && 'address',
          !tenant.city && 'city',
          !tenant.state && 'state',
          !tenant.contactPhone && 'contact phone',
        ].filter(Boolean).join(', ') || null,
      },
      {
        id: 'room_inventory',
        completed: floorCount > 0 && roomTypeCount > 0 && roomCount > 0,
        detail: `${floorCount} floor(s), ${roomTypeCount} room type(s), ${roomCount} room(s)`,
      },
      {
        id: 'branding',
        completed: !!(
          (tenant.brandLogo && (tenant.tagline || tenant.description)) ||
          (cfg.websiteBuilder && cfg.websiteBuilder.theme)
        ),
        detail: !tenant.brandLogo && !cfg.websiteBuilder?.theme
          ? 'logo missing'
          : !(tenant.tagline || tenant.description) && !cfg.websiteBuilder?.theme
          ? 'tagline/description missing'
          : cfg.websiteBuilder?.theme ? `Website theme: ${cfg.websiteBuilder.theme}` : null,
      },
      {
        id: 'billing',
        completed: !!(tenant.gstNumber || cfg.gstExempt || cfg.gstEnabled !== undefined),
        detail: tenant.gstNumber ? `GSTIN: ${tenant.gstNumber}` : cfg.gstEnabled === false ? 'GST invoicing disabled' : cfg.gstEnabled ? 'GST enabled — add GSTIN' : 'Not configured yet',
      },
      {
        id: 'compliance',
        completed: !!cfg.policeStationEmail || cfg.complianceEnabled === false || skippedSteps.includes('compliance'),
        detail: cfg.complianceEnabled === false
          ? 'Disabled — not required for this property'
          : skippedSteps.includes('compliance') ? 'Skipped — can configure later'
          : !cfg.policeStationEmail ? 'Police station email not configured' : `Email: ${cfg.policeStationEmail}`,
        skippable: true,
        skipped: skippedSteps.includes('compliance') || cfg.complianceEnabled === false,
      },
      {
        id: 'staff',
        completed: staffCount > 1 || skippedSteps.includes('staff'),
        detail: skippedSteps.includes('staff') ? 'Skipped — can invite later' : `${staffCount} member(s) — ${staffCount > 1 ? 'team configured' : 'invite your first staff member'}`,
        skippable: true,
        skipped: skippedSteps.includes('staff'),
      },
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const percent = Math.round((completedCount / steps.length) * 100);

    res.json({ success: true, data: { percent, completedCount, totalCount: steps.length, steps } });
  } catch (err) {
    console.error('[SETUP PROGRESS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch setup progress' });
  }
});

// POST /tenants/skip-setup-step
const SKIPPABLE_STEPS = ['compliance', 'staff'];
tenantsRouter.post('/skip-setup-step', authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { stepId } = req.body;
    if (!stepId || !SKIPPABLE_STEPS.includes(stepId)) {
      res.status(400).json({ success: false, error: `Step "${stepId}" cannot be skipped` });
      return;
    }
    const tid = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({ where: { id: tid }, select: { config: true } });
    const cfg = (tenant?.config as Record<string, any>) || {};
    const skipped: string[] = Array.isArray(cfg.skippedSetupSteps) ? cfg.skippedSetupSteps : [];
    if (!skipped.includes(stepId)) skipped.push(stepId);
    await prisma.tenant.update({
      where: { id: tid },
      data: { config: { ...cfg, skippedSetupSteps: skipped } },
    });
    res.json({ success: true, message: `Step "${stepId}" skipped` });
  } catch (err) {
    console.error('[SKIP SETUP STEP ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to skip step' });
  }
});

// GET /tenants/:id/settings
tenantsRouter.get('/:id/settings', authenticate, resolveTenant, requireTenant, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: req.userId!, tenantId: req.params.id, isActive: true },
    });

    if (!membership || (membership.role !== 'property_owner' && membership.role !== 'general_manager')) {
      res.status(403).json({ success: false, error: 'Unauthorized to view settings' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { subscriptions: { where: { status: 'active' } } }
    });

    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }

    const saasPlans = await prisma.saasPlan.findMany({
      where: { isActive: true },
      orderBy: { actualPrice: 'asc' }
    });

    let safeConfig = (tenant.config as Record<string, any>) || {};
    const customPlanPricing = safeConfig.customPlanPricing as Record<string, any> | undefined;

    if (safeConfig.razorpaySecret) {
      safeConfig = {
        ...safeConfig,
        razorpaySecret: '••••••••••••••••'
      };
    }

    // Merge per-tenant custom pricing into global plan prices
    const mergedPlans = saasPlans.map((plan: any) => {
      if (customPlanPricing && customPlanPricing[plan.code]) {
        const cp = customPlanPricing[plan.code];
        return {
          ...plan,
          actualPrice: cp.monthlyPrice ?? plan.actualPrice,
          discountMonthly: cp.discountedPrice ?? plan.discountMonthly,
          discountYearly: cp.yearlyPrice ?? plan.discountYearly,
          _hasCustomPricing: true,
        };
      }
      return plan;
    });

    // Remove internal config from response
    delete safeConfig.customPlanPricing;

    res.json({
      success: true,
      data: {
        ...tenant,
        config: safeConfig,
        saasPlans: mergedPlans,
        // Plan-derived feature flags so the dashboard can disable / hide
        // controls without hardcoding plan names. Authoritative on the
        // server — the public endpoint enforces the same flags.
        featureFlags: getPlanFeatures(tenant.plan),
      }
    });
  } catch (err) {
    console.error('[TENANT GET SETTINGS ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PATCH /tenants/:id/settings
tenantsRouter.patch(
  '/:id/settings',
  authenticate,
  resolveTenant,
  requireTenant,
  authorize('property_owner', 'general_manager'),
  async (req: Request, res: Response) => {
    try {
      // Verify the route tenant matches the resolved tenant (prevent cross-tenant editing)
      if (req.params.id !== req.tenantId) {
        res.status(403).json({ success: false, error: 'You can only modify your own property' });
        return;
      }

      const allowedFields = [
        'name', 'defaultCheckInTime', 'defaultCheckOutTime', 'cancellationPolicyHours',
        'lateCheckoutChargePercent', 'timezone', 'gstNumber', 'contactPhone',
        'contactEmail', 'address', 'city', 'state', 'pincode', 'description',
        'brandLogo', 'primaryColor', 'secondaryColor', 'tagline', 'heroImage',
        'latitude', 'longitude', 'competitorRates'
      ];

      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Handle config merging safely
      if (req.body.config && typeof req.body.config === 'object') {
        const existingTenant = await prisma.tenant.findUnique({
          where: { id: req.params.id },
          select: { config: true },
        });
        
        const existingConfig = (existingTenant?.config as Record<string, any>) || {};
        const incomingConfig = { ...req.body.config };
        
        // Preserve masked secret
        if (incomingConfig.razorpaySecret === '••••••••••••••••') {
          incomingConfig.razorpaySecret = existingConfig.razorpaySecret;
        }

        updateData.config = { ...existingConfig, ...incomingConfig };
      }

      const tenant = await prisma.tenant.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'tenant', tenant.id, updateData, req.ip || undefined);

      // Fire-and-forget; do not await — the response should not block on
      // the Next.js round trip. Failures are logged but don't surface.
      void triggerPublicRevalidate(tenant.slug);

      res.json({ success: true, data: tenant });
    } catch (err) {
      console.error('[TENANT SETTINGS ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  },
);

// PATCH /tenants/:id/branding
tenantsRouter.patch(
  '/:id/branding',
  authenticate,
  resolveTenant,
  requireTenant,
  authorize('property_owner', 'general_manager'),
  async (req: Request, res: Response) => {
    try {
      if (req.params.id !== req.tenantId) {
        res.status(403).json({ success: false, error: 'You can only modify your own property' });
        return;
      }

      const parsed = brandingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors[0].message });
        return;
      }

      const tenant = await prisma.tenant.update({
        where: { id: req.params.id },
        data: parsed.data,
      });

      res.json({ success: true, data: tenant });
    } catch (err) {
      console.error('[TENANT BRANDING ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to update branding' });
    }
  },
);

// POST /tenants/:id/invite-staff
tenantsRouter.post(
  '/:id/invite-staff',
  authenticate,
  resolveTenant,
  requireTenant,
  authorize('property_owner', 'general_manager'),
  async (req: Request, res: Response) => {
    try {
      const parsed = staffInviteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors[0].message });
        return;
      }

      const { role, fullName, passcode } = parsed.data;
      const phone = parsed.data.phone.trim();

      let user = await prisma.globalUser.findFirst({
        where: { phone: { equals: phone } },
      });

      const newPasswordHash = await bcrypt.hash(passcode, 12);

      if (!user) {
        user = await prisma.globalUser.create({
          data: { phone, email: `${phone}@istays.local`, passwordHash: newPasswordHash, fullName },
        });
      } else {
        // Option to reset passcode if user exists but owner is re-inviting. For safety, let's update passcode if they are not active or just let it be. We will just update the passcode.
        await prisma.globalUser.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash, fullName }
        });
      }

      const existing = await prisma.tenantMembership.findFirst({
        where: { userId: user.id, tenantId: req.params.id },
      });

      if (existing) {
        res.status(409).json({ success: false, error: 'Staff member already exists for this property' });
        return;
      }

      await prisma.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: req.params.id,
          role,
        },
      });

      // Invalidate so the negative-cached "no membership" entry from earlier
      // attempts (or a denied request) doesn't keep this staff out for 10s.
      invalidateMembership(user.id, req.params.id);

      await logAudit(req.tenantId!, req.userId, 'INVITE_STAFF', 'tenant_membership', user.id, { phone, role }, req.ip || undefined);

      res.status(201).json({ success: true, message: `Staff invited: ${phone} as ${role}` });
    } catch (err: any) {
      console.error('[TENANT INVITE ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to invite staff' });
    }
  },
);

// PUT /tenants/:id/staff/:userId/status
tenantsRouter.put(
  '/:id/staff/:userId/status',
  authenticate,
  resolveTenant,
  requireTenant,
  authorize('property_owner'),
  async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      const membership = await prisma.tenantMembership.findFirst({
        where: { userId: req.params.userId, tenantId: req.tenantId! },
      });

      if (!membership) {
        res.status(404).json({ success: false, error: 'Staff member not found' });
        return;
      }

      if (membership.role === 'property_owner') {
        res.status(400).json({ success: false, error: 'Cannot modify property owner status' });
        return;
      }

      await prisma.tenantMembership.update({
        where: { id: membership.id },
        data: { isActive },
      });

      // Whether activating or deactivating, the cached membership state is now stale.
      invalidateMembership(req.params.userId, req.tenantId!);

      await logAudit(req.tenantId!, req.userId, 'UPDATE_STAFF_STATUS', 'tenant_membership', membership.id, { isActive }, req.ip || undefined);

      res.json({ success: true, message: `Staff status updated` });
    } catch (err) {
      console.error('[TENANT UPDATE STAFF ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to update staff status' });
    }
  }
);

// GET /tenants/staff
tenantsRouter.get('/staff', authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId: req.tenantId!, isActive: true },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user,
        fullName: m.user.fullName,
        email: m.user.email,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('[TENANT STAFF LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

// DELETE /tenants/staff/:userId
tenantsRouter.delete('/staff/:userId', authenticate, resolveTenant, requireTenant, authorize('property_owner'), async (req: Request, res: Response) => {
  try {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: req.params.userId, tenantId: req.tenantId!, isActive: true },
    });

    if (!membership) {
      res.status(404).json({ success: false, error: 'Staff member not found' });
      return;
    }

    if (membership.role === 'property_owner') {
      res.status(400).json({ success: false, error: 'Cannot remove the property owner' });
      return;
    }

    await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    invalidateMembership(req.params.userId, req.tenantId!);

    await logAudit(req.tenantId!, req.userId, 'REMOVE_STAFF', 'tenant_membership', membership.id, { userId: req.params.userId }, req.ip || undefined);

    res.json({ success: true, message: 'Staff member removed' });
  } catch (err) {
    console.error('[TENANT STAFF REMOVE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to remove staff' });
  }
});

// ═══════════════════════════════════════════════════════
// Domain Management
// ═══════════════════════════════════════════════════════

// GET /tenants/domain-status — Get domain settings and verification status
tenantsRouter.get('/domain-status', authenticate, resolveTenant, requireTenant, async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { slug: true, customDomain: true, config: true, status: true },
    });

    if (!tenant) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    const config = (tenant.config as any) || {};
    const rootDomain = getRootDomain();

    res.json({
      success: true,
      data: {
        slug: tenant.slug,
        subdomainUrl: `${tenant.slug}.${rootDomain}`,
        customDomain: tenant.customDomain,
        customDomainVerified: config.domainVerified || false,
        cnameTarget: rootDomain,
        status: tenant.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get domain status' });
  }
});

// PATCH /tenants/slug — Change property subdomain (owner only)
tenantsRouter.patch(
  '/slug',
  authenticate,
  resolveTenant,
  requireTenant,
  authorize('property_owner'),
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.body;

      if (!slug || typeof slug !== 'string') {
        res.status(400).json({ success: false, error: 'New subdomain is required' });
        return;
      }

      const normalizedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');

      // Validate format
      if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(normalizedSlug)) {
        res.status(400).json({
          success: false,
          error: 'Invalid subdomain. Use 3-50 lowercase letters, numbers, and hyphens. Must start and end with a letter or number.',
        });
        return;
      }

      // Check reserved words
      const reserved = ['admin', 'api', 'www', 'app', 'mail', 'blog', 'docs', 'help', 'support', 'dashboard', 'login', 'register', 'property', 'book', 'search'];
      if (reserved.includes(normalizedSlug)) {
        res.status(400).json({ success: false, error: 'This subdomain is reserved. Please choose a different one.' });
        return;
      }

      // Check current slug — no-op if same
      const current = await prisma.tenant.findUnique({
        where: { id: req.tenantId },
        select: { slug: true },
      });
      if (current?.slug === normalizedSlug) {
        res.json({ success: true, data: { slug: normalizedSlug, message: 'Subdomain unchanged' } });
        return;
      }

      // Check availability
      const existing = await prisma.tenant.findUnique({ where: { slug: normalizedSlug }, select: { id: true } });
      if (existing) {
        res.status(409).json({ success: false, error: 'This subdomain is already taken. Please choose a different one.' });
        return;
      }

      // Update slug
      await prisma.tenant.update({
        where: { id: req.tenantId },
        data: { slug: normalizedSlug },
      });

      const rootDomain = getRootDomain();

      await logAudit(req.tenantId!, req.userId, 'CHANGE_SLUG', 'tenant', req.tenantId!, { oldSlug: current?.slug, newSlug: normalizedSlug }, req.ip || undefined);

      res.json({
        success: true,
        data: {
          slug: normalizedSlug,
          subdomainUrl: `${normalizedSlug}.${rootDomain}`,
          oldSlug: current?.slug,
        },
        message: `Subdomain updated! Your property is now at ${normalizedSlug}.${rootDomain}`,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ success: false, error: 'This subdomain is already taken.' });
        return;
      }
      res.status(500).json({ success: false, error: 'Failed to update subdomain' });
    }
  }
);

// POST /tenants/verify-domain — Verify custom domain DNS (CNAME check)
tenantsRouter.post(
  '/verify-domain',
  authenticate,
  resolveTenant,
  requireTenant,
  authorize('property_owner'),
  async (req: Request, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId },
        select: { customDomain: true, config: true },
      });

      if (!tenant?.customDomain) {
        res.status(400).json({
          success: false,
          error: 'No custom domain configured. Set a custom domain first in property settings.',
        });
        return;
      }

      const rootDomain = getRootDomain();

      // Perform DNS CNAME lookup
      let verified = false;
      let dnsResult = 'Could not resolve DNS';
      try {
        const dns = await import('node:dns');
        const records = await dns.promises.resolveCname(tenant.customDomain);
        if (records.some((r: string) => r.toLowerCase().includes(rootDomain.toLowerCase()))) {
          verified = true;
          dnsResult = `CNAME points to ${records[0]}`;
        } else {
          dnsResult = `CNAME points to ${records.join(', ')}, expected ${rootDomain}`;
        }
      } catch (dnsErr: any) {
        if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA') {
          dnsResult = 'No CNAME record found. Please add a CNAME record pointing to ' + rootDomain;
        } else {
          dnsResult = `DNS lookup error: ${dnsErr.message}`;
        }
      }

      // Update verification status in config
      const existingConfig = (tenant.config as any) || {};
      await prisma.tenant.update({
        where: { id: req.tenantId },
        data: {
          config: {
            ...existingConfig,
            domainVerified: verified,
            domainVerifiedAt: verified ? new Date().toISOString() : null,
          },
        },
      });

      res.json({
        success: true,
        data: {
          domain: tenant.customDomain,
          verified,
          dnsResult,
          cnameTarget: rootDomain,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to verify domain' });
    }
  }
);
