import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { propertyRegistrationSchema, brandingSchema, staffInviteSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';
import { sendPropertyApprovalEmail } from '../../services/email';

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
      ];

      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
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
