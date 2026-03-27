import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { checkInSchema, checkOutSchema } from '@istays/shared';
import { logAudit } from '../../middleware/audit-log';

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
          await prisma.bookingRoom.update({
            where: { id: assignment.bookingRoomId },
            data: { roomId: assignment.roomId },
          });
          // Mark room as occupied
          await prisma.room.update({
            where: { id: assignment.roomId },
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

      // Record guest details for Form-B
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

      // Release rooms — mark as dirty for housekeeping
      for (const br of booking.bookingRooms) {
        if (br.roomId) {
          await prisma.room.update({
            where: { id: br.roomId },
            data: { status: 'dirty' },
          });

          // Create housekeeping task
          await prisma.housekeepingTask.create({
            data: {
              tenantId: req.tenantId!,
              roomId: br.roomId,
              taskDate: new Date(),
              status: 'pending',
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

      await logAudit(req.tenantId!, req.userId, 'CHECK_OUT', 'booking', booking.id, {}, req.ip || undefined);

      res.json({ success: true, data: updatedBooking, message: 'Guest checked out successfully' });
    });
  } catch (err) {
    console.error('[CHECK-OUT ERROR]', err);
    res.status(500).json({ success: false, error: 'Check-out failed' });
  }
});
