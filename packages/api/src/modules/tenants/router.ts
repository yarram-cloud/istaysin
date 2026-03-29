import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { propertyRegistrationSchema, brandingSchema, staffInviteSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';
import { sendPropertyApprovalEmail } from '../../services/email';
import { getSubdomainUrl, getRootDomain } from '../../services/cloudflare';

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
        propertyType: data.propertyType,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        gstNumber: data.gstNumber || null,
        latitude: data.latitude,
        longitude: data.longitude,
        ownerId: req.userId!,
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
            contactPhone: true, contactEmail: true, createdAt: true,
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
        'defaultCheckInTime', 'defaultCheckOutTime', 'cancellationPolicyHours',
        'lateCheckoutChargePercent', 'timezone', 'gstNumber', 'contactPhone',
        'contactEmail', 'address', 'city', 'state', 'pincode', 'description',
        'brandLogo', 'primaryColor', 'secondaryColor', 'tagline', 'heroImage',
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
        updateData.config = { ...existingConfig, ...req.body.config };
      }

      const tenant = await prisma.tenant.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await logAudit(req.tenantId!, req.userId, 'UPDATE', 'tenant', tenant.id, updateData, req.ip || undefined);

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

      const { role, fullName } = parsed.data;
      const email = parsed.data.email.toLowerCase().trim();

      // Check if user already exists
      let user = await prisma.globalUser.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      if (!user) {
        // Create a stub user with random password (they'll need to reset)
        const bcryptModule = await import('bcryptjs');
        const tempPassword = await bcryptModule.hash(Math.random().toString(36), 10);
        user = await prisma.globalUser.create({
          data: { email, passwordHash: tempPassword, fullName },
        });
      }

      // Check if membership already exists
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

      await logAudit(req.tenantId!, req.userId, 'INVITE_STAFF', 'tenant_membership', user.id, { email, role }, req.ip || undefined);

      res.status(201).json({ success: true, message: `Staff invited: ${email} as ${role}` });
    } catch (err) {
      console.error('[TENANT INVITE ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to invite staff' });
    }
  },
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
      console.log(`[Tenant] Slug changed: ${current?.slug} → ${normalizedSlug} (tenant: ${req.tenantId})`);

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
