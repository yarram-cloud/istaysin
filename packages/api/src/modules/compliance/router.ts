import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';

export const complianceRouter = Router();

// Secure ALL compliance operations under strict tenant constraints
complianceRouter.use(authenticate, resolveTenant, requireTenant);

// GET /compliance/c-form/export
complianceRouter.get('/c-form/export', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    let exportData: any[] = [];
    
    await withTenant(req.tenantId!, async () => {
      // Find all booking guests where nationality is NOT Indian/India, who checked in recent hours
      const foreignGuests = await prisma.bookingGuest.findMany({
        where: {
          tenantId: req.tenantId!,
          NOT: {
            nationality: { in: ['Indian', 'India', 'IND'] }
          },
          createdAt: { gte: sinceDate }
        },
        include: {
          booking: {
            select: { bookingNumber: true, checkInDate: true, checkOutDate: true }
          }
        }
      });

      exportData = foreignGuests.map(g => ({
        FullName: g.fullName,
        Nationality: g.nationality,
        PassportNumber: g.idProofNumber || 'Missing',
        VisaNumber: g.visaNumber || 'Missing',
        VisaExpiry: g.visaExpiryDate ? g.visaExpiryDate.toISOString().split('T')[0] : 'Missing',
        ArrivingFrom: g.arrivingFrom || 'Missing',
        GoingTo: g.goingTo || 'Missing',
        PurposeOfVisit: g.purposeOfVisit || 'Tourist',
        BookingReference: g.booking.bookingNumber,
        CheckInDate: g.booking.checkInDate.toISOString().split('T')[0]
      }));

      await logAudit(req.tenantId!, req.userId, 'READ', 'compliance_cform', 'export', { range: `${hours} hours`, count: exportData.length }, req.ip || undefined);
    });

    res.json({ success: true, data: exportData });
  } catch (err) {
    console.error('[FRRO COMPLIANCE EXPORT ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to generate C-Form Export' });
  }
});
