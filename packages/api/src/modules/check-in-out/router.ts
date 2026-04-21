import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { checkInSchema, checkOutSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';
import { sendWhatsAppMessage } from '../../services/whatsapp';

export const checkInOutRouter = Router();
checkInOutRouter.use(authenticate, resolveTenant, requireTenant);

// POST /check-in-out/:bookingId/check-in
checkInOutRouter.post('/:bookingId/check-in', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = checkInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! }});
      const tenantConfig = (tenant?.config as Record<string, any>) || {};

      const booking = await prisma.booking.findUnique({
        where: { id: req.params.bookingId },
        include: { bookingRooms: true },
      });

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      if (booking.status !== 'confirmed' && booking.status !== 'pending_confirmation') {
        res.status(400).json({ success: false, error: `Cannot check in booking with status: ${booking.status}` });
        return;
      }

      // Assign rooms if provided
      if (parsed.data.roomAssignments) {
        for (const assignment of parsed.data.roomAssignments) {
          let actualRoomId = assignment.roomId;
          // Check if it looks like a valid UUID, otherwise treat it as roomNumber
          if (actualRoomId.length !== 36) {
            const roomMatch = await prisma.room.findFirst({
              where: { tenantId: req.tenantId!, roomNumber: actualRoomId }
            });
            if (!roomMatch) throw new Error(`Invalid room number: ${actualRoomId}`);
            actualRoomId = roomMatch.id;
          }

          await prisma.bookingRoom.update({
            where: { id: assignment.bookingRoomId },
            data: { roomId: actualRoomId },
          });
          // Mark room as occupied
          await prisma.room.update({
            where: { id: actualRoomId },
            data: { status: 'occupied' },
          });
        }
      } else {
        // Mark existing assigned rooms as occupied
        for (const br of booking.bookingRooms) {
          if (br.roomId) {
            await prisma.room.update({
              where: { id: br.roomId },
              data: { status: 'occupied' },
            });
          }
        }
      }

      // Record guest details for Form-B & C-Form
      if (parsed.data.guestDetails) {
        for (const guest of parsed.data.guestDetails) {
          await prisma.bookingGuest.create({
            data: {
              tenantId: req.tenantId!,
              bookingId: booking.id,
              fullName: guest.fullName,
              idProofType: guest.idProofType,
              idProofNumber: guest.idProofNumber,
              nationality: guest.nationality,
              visaNumber: guest.visaNumber || null,
              visaExpiryDate: guest.visaExpiryDate ? new Date(guest.visaExpiryDate) : null,
              arrivingFrom: guest.arrivingFrom || null,
              goingTo: guest.goingTo || null,
              purposeOfVisit: guest.purposeOfVisit || null,
              isFormBRecorded: true,
            },
          });
        }
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'checked_in', checkedInAt: new Date() },
        include: { bookingRooms: { include: { room: true, roomType: true } }, bookingGuests: true },
      });

      await logAudit(req.tenantId!, req.userId, 'CHECK_IN', 'booking', booking.id, {}, req.ip || undefined);

      if (booking.guestPhone && tenantConfig.whatsapp?.enabled !== false) {
        sendWhatsAppMessage(
          booking.guestPhone,
          {
            name: booking.guestName,
            hotel: tenant?.name || 'Our Property',
            bookingRef: booking.bookingNumber,
            checkInDate: new Date(booking.checkInDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        ).catch(console.error);
      }

      res.json({ success: true, data: updatedBooking, message: 'Guest checked in successfully' });
    });
  } catch (err) {
    console.error('[CHECK-IN ERROR]', err);
    res.status(500).json({ success: false, error: 'Check-in failed' });
  }
});

// POST /check-in-out/:bookingId/check-out
checkInOutRouter.post('/:bookingId/check-out', authorize('property_owner', 'general_manager', 'front_desk'), async (req: Request, res: Response) => {
  try {
    const parsed = checkOutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.bookingId },
        include: { bookingRooms: true, folioCharges: true, guestPayments: true },
      });

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      if (booking.status !== 'checked_in') {
        res.status(400).json({ success: false, error: `Cannot check out booking with status: ${booking.status}` });
        return;
      }

      // Record final payment if provided
      if (parsed.data.settledAmount && parsed.data.paymentMethod) {
        await prisma.guestPayment.create({
          data: {
            tenantId: req.tenantId!,
            bookingId: booking.id,
            amount: parsed.data.settledAmount,
            method: parsed.data.paymentMethod,
            status: 'completed',
          },
        });
      }

      // Release rooms — mark as available but dirty for housekeeping
      for (const br of booking.bookingRooms) {
        if (br.roomId) {
          await prisma.room.update({
            where: { id: br.roomId },
            data: { status: 'available', housekeepingStatus: 'dirty' },
          });

          const defaultChecklist = [
            { id: '1', item: 'Change bed linen', done: false },
            { id: '2', item: 'Replace towels', done: false },
            { id: '3', item: 'Clean bathroom', done: false },
            { id: '4', item: 'Vacuum floor', done: false },
            { id: '5', item: 'Empty trash', done: false },
            { id: '6', item: 'Restock amenities', done: false },
          ];

          // Create housekeeping task
          await prisma.housekeepingTask.create({
            data: {
              tenantId: req.tenantId!,
              roomId: br.roomId,
              taskDate: new Date(),
              status: 'pending',
              taskType: 'cleaning',
              priority: 'high',
              checklist: defaultChecklist,
            },
          });
        }
      }

      // Update booking
      const totalPaid = booking.guestPayments.reduce((sum, p) => sum + p.amount, 0) + (parsed.data.settledAmount || 0);
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'checked_out',
          checkedOutAt: new Date(),
          advancePaid: totalPaid,
          balanceDue: Math.max(0, booking.totalAmount - totalPaid),
          notes: parsed.data.notes ? `${booking.notes || ''}\n${parsed.data.notes}`.trim() : booking.notes,
        },
      });

      // Fetch tenant configuration for GST details
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true, gstNumber: true, name: true },
      });
      const tConfig = (tenant?.config as Record<string, any>) || {};

      // Calculate final invoice sums from folio charges
      const subtotal = booking.folioCharges.reduce((sum, c) => sum + c.totalPrice, 0);
      const totalCgst = booking.folioCharges.reduce((sum, c) => sum + c.cgst, 0);
      const totalSgst = booking.folioCharges.reduce((sum, c) => sum + c.sgst, 0);
      const totalIgst = booking.folioCharges.reduce((sum, c) => sum + c.igst, 0);
      const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;

      // Ensure we don't accidentally duplicate Invoices for the same checkout, create if nil
      const existingInvoice = await prisma.invoice.findFirst({
        where: { bookingId: booking.id, isProforma: false },
      });

      if (!existingInvoice) {
        await prisma.invoice.create({
          data: {
            tenantId: req.tenantId!,
            bookingId: booking.id,
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            guestName: booking.guestName,
            propertyGstin: tenant?.gstNumber,
            placeOfSupply: tConfig.state || '',
            subtotal,
            totalCgst,
            totalSgst,
            totalIgst,
            grandTotal,
            isProforma: false,
          },
        });
      }

      await logAudit(req.tenantId!, req.userId, 'CHECK_OUT', 'booking', booking.id, {}, req.ip || undefined);

      if (booking.guestPhone && tConfig.whatsapp?.enabled !== false) {
        sendWhatsAppMessage(
          booking.guestPhone,
          {
            name: booking.guestName,
            hotel: tenant?.name || 'Our Property',
            bookingRef: booking.bookingNumber,
            checkInDate: new Date(booking.checkInDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        ).catch(console.error);
      }

      res.json({ success: true, data: updatedBooking, message: 'Guest checked out successfully' });
    });
  } catch (err) {
    console.error('[CHECK-OUT ERROR]', err);
    res.status(500).json({ success: false, error: 'Check-out failed' });
  }
});
