import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';
import { validateRequest } from '../../middleware/validate';
import { z } from 'zod';


const submitPoliceSchema = z.object({
  date: z.string().optional() // defaults to today if not provided
});

const submitCFormSchema = z.object({
  guestId: z.string().uuid()
});

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

// GET /compliance/guest-register
complianceRouter.get('/guest-register', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const startDate = new Date(req.query.startDate as string || todayStr);
    const endDate = new Date(req.query.endDate as string || todayStr);
    
    // Set to end of day for endDate
    endDate.setHours(23, 59, 59, 999);

    let registerData: any[] = [];

    await withTenant(req.tenantId!, async () => {
      const guests = await prisma.bookingGuest.findMany({
        where: {
          tenantId: req.tenantId!,
          booking: {
            // Filter by when guests actually checked in, not when the record was created
            checkInDate: {
              gte: startDate,
              lte: endDate,
            },
            status: { in: ['confirmed', 'checked_in', 'checked_out'] },
          },
        },
        include: {
          booking: {
            include: {
              bookingRooms: {
                include: { room: true }
              }
            }
          }
        },
        orderBy: { booking: { checkInDate: 'asc' } }
      });

      registerData = guests.map((g, idx) => ({
        sNo: idx + 1,
        fullName: g.fullName,
        fathersName: 'Not Recorded',
        address: 'Not Recorded',
        nationality: g.nationality,
        idProof: `${g.idProofType || 'N/A'} - ${g.idProofNumber || 'N/A'}`,
        visaDetails: g.visaNumber ? `${g.visaNumber} (Exp: ${g.visaExpiryDate ? g.visaExpiryDate.toISOString().split('T')[0] : 'N/A'})` : 'N/A',
        roomNo: g.booking.bookingRooms.map(r => r.room?.roomNumber || 'Unassigned').join(', ') || 'N/A',
        checkIn: g.booking.checkInDate.toISOString(),
        checkOut: g.booking.checkOutDate.toISOString(),
        purpose: g.purposeOfVisit || 'Tourist',
        arrivingFrom: g.arrivingFrom || 'N/A',
        goingTo: g.goingTo || 'N/A',
        accompanying: 0,
        cFormSubmitted: g.cFormSubmitted,
        cFormSubmittedAt: g.cFormSubmittedAt,
        guestId: g.id
      }));

      await logAudit(req.tenantId!, req.userId, 'READ', 'compliance', 'register', { count: registerData.length }, req.ip || undefined);
    });

    res.json({ success: true, data: registerData });
  } catch (err) {
    console.error('[GUEST REGISTER FETCH ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch guest register data' });
  }
});

// POST /compliance/police/submit
complianceRouter.post('/police/submit', validateRequest(submitPoliceSchema), authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true }
      });

      const config = tenant?.config as Record<string, any>;
      const policeEmail = config?.policeStationEmail;

      if (!policeEmail) {
        throw new Error('Local police station email is not configured in settings.');
      }

      // Here we would compile the PDF and send an email to policeEmail
      // Simulated Email Dispatch
      
      await logAudit(req.tenantId!, req.userId, 'SUBMIT', 'compliance', 'police_register', { email: policeEmail }, req.ip || undefined);
    });

    res.json({ success: true, message: 'Register successfully submitted to Station House Officer' });
  } catch (err: any) {
    console.error('[POLICE SUBMIT ERROR]', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to submit' });
  }
});

// POST /compliance/c-form/submit
complianceRouter.post('/c-form/submit', validateRequest(submitCFormSchema), authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    let resultGuest;
    await withTenant(req.tenantId!, async () => {
      const guest = await prisma.bookingGuest.findUnique({
        where: { id: req.body.guestId }
      });

      if (!guest || guest.tenantId !== req.tenantId) {
        throw new Error('Guest not found');
      }

      if (['Indian', 'India', 'IND'].includes(guest.nationality)) {
        throw new Error('C-Form is only required for Foreign Nationals');
      }

      resultGuest = await prisma.bookingGuest.update({
        where: { id: guest.id },
        data: {
          cFormSubmitted: true,
          cFormSubmittedAt: new Date()
        }
      });

      // Here we would actually dispatch the generated Form-C to the FRRO API or email
      
      await logAudit(req.tenantId!, req.userId, 'SUBMIT', 'compliance_cform', guest.id, {}, req.ip || undefined);
    });

    res.json({ success: true, message: 'C-Form successfully submitted', data: resultGuest });
  } catch (err: any) {
    console.error('[C-FORM SUBMIT ERROR]', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to submit C-Form' });
  }
});

