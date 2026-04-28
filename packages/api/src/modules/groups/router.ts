import { validateRequest } from '../../middleware/validate';
import { createGroupBlockSchema } from '@istays/shared';
import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';

export const groupsRouter = Router();

groupsRouter.use(authenticate, resolveTenant, requireTenant);

// POST /groups/blocks
groupsRouter.post('/blocks', validateRequest(createGroupBlockSchema), authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    // Read only Zod-validated fields — req.body is already sanitised by validateRequest()
    const { blockCode, name, companyName } = req.body as {
      blockCode?: string;
      name: string;
      companyName?: string;
    };
    // Auto-generate a short unique code if the client did not provide one
    const resolvedBlockCode = blockCode || `GRP-${Date.now().toString(36).toUpperCase()}`;

    const block = await withTenant(req.tenantId!, async () => {
      const newBlock = await prisma.groupBlock.create({
        data: {
          tenantId: req.tenantId!,
          blockCode: resolvedBlockCode,
          name,
          companyName,
          status: 'held',
        },
      });
      await logAudit(req.tenantId!, req.userId, 'CREATE', 'group_block', newBlock.id, { blockCode: resolvedBlockCode }, req.ip || undefined);
      return newBlock;
    });

    res.status(201).json({ success: true, data: block });
  } catch (err) {
    console.error('[GROUP BLOCK ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create group block' });
  }
});

// GET /groups/blocks/:id/master-folio
groupsRouter.get('/blocks/:id/master-folio', authorize('property_owner', 'general_manager', 'front_desk', 'accountant'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const block = await prisma.groupBlock.findUnique({
        where: { id: req.params.id },
        include: {
          bookings: {
            include: { folioCharges: true, guestPayments: true },
          },
        },
      });

      if (!block) return res.status(404).json({ success: false, error: 'Block not found' });

      // Aggregate master folio metrics
      let totalCharges = 0;
      let totalPayments = 0;
      const chargeDetails: any[] = [];
      const paymentDetails: any[] = [];

      for (const booking of block.bookings) {
        booking.folioCharges.forEach((charge) => {
          totalCharges += charge.unitPrice * charge.quantity;
          chargeDetails.push({ ...charge, sourceBooking: booking.bookingNumber });
        });
        booking.guestPayments.forEach((payment) => {
          totalPayments += payment.amount;
          paymentDetails.push({ ...payment, sourceBooking: booking.bookingNumber });
        });
      }

      res.json({
        success: true,
        data: {
          blockMeta: { name: block.name, code: block.blockCode, company: block.companyName },
          balance: totalCharges - totalPayments,
          totalCharges,
          totalPayments,
          breakdown: { charges: chargeDetails, payments: paymentDetails },
        },
      });
    });
  } catch (err) {
    console.error('[MASTER FOLIO ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve master folio' });
  }
});
