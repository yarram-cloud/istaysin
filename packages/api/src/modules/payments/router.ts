import { validateRequest } from '../../middleware/validate';
import { createRazorpayOrderSchema, verifyRazorpayOrderSchema } from '@istays/shared';
import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { generateUpiQrCode } from '../../services/payments';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../services/razorpay';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';

export const paymentsRouter = Router();

/**
 * GET /payments/upi/qr
 * Generates a UPI QR code for a specific booking / folio.
 * Query Params: ?bookingId=uuid
 */
paymentsRouter.get('/upi/qr', authenticate, resolveTenant, requireTenant, async (req: Request, res: Response) => {
  try {
    const bookingId = req.query.bookingId as string;
    if (!bookingId) {
      res.status(400).json({ success: false, error: 'bookingId is required' });
      return;
    }

    const qrResult = await withTenant(req.tenantId!, async () => {
      // Get the tenant config to find their configured UPI ID
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { name: true, config: true }
      });

      if (!tenant) throw new Error('Tenant not found');

      // The config field is JSON, try to extract upiId
      const config = tenant.config as { upiId?: string };
      const upiId = config?.upiId;

      if (!upiId) {
        throw new Error('UPI ID is not configured for this property. Please update settings.');
      }

      // Fetch booking details for the transaction ID and amount
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { bookingNumber: true, balanceDue: true }
      });

      if (!booking) throw new Error('Booking not found');

      if (booking.balanceDue <= 0) {
        throw new Error('Booking has no pending balance. Amount must be > 0 to generate a payment QR.');
      }

      const transactionId = `${booking.bookingNumber}-${Date.now().toString().substring(8)}`;

      return await generateUpiQrCode(upiId, tenant.name, booking.balanceDue, transactionId);
    });

    res.json({
      success: true,
      data: qrResult
    });

  } catch (err: any) {
    console.error('[UPI QR Error]', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to generate QR code' });
  }
});

/**
 * POST /payments/razorpay/order
 * Creates a Razorpay Order for a Booking
 */
paymentsRouter.post('/razorpay/order', validateRequest(createRazorpayOrderSchema), authenticate, resolveTenant, requireTenant, async (req: Request, res: Response) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      res.status(400).json({ success: false, error: 'bookingId and amount are required' });
      return;
    }
    const result = await withTenant(req.tenantId!, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true }
      });
      const config = (tenant?.config as Record<string, string>) || {};
      const { razorpayKeyId, razorpaySecret } = config;

      if (!razorpayKeyId || !razorpaySecret) {
        throw new Error('Razorpay gateway is not configured for this property.');
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { bookingNumber: true, balanceDue: true, advancePaid: true }
      });

      if (!booking) throw new Error('Booking not found');

      // Create Razorpay Order
      const receiptId = `rect_${booking.bookingNumber.substring(0, 8)}_${Date.now().toString().substring(8, 12)}`;
      const order = await createRazorpayOrder(Number(amount), receiptId, razorpayKeyId, razorpaySecret);

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId
      };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[RAZORPAY ORDER ERROR]', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to create Razorpay order' });
  }
});

/**
 * POST /payments/razorpay/verify
 * Verifies a Razorpay payment signature and records the payment
 */
paymentsRouter.post('/razorpay/verify', validateRequest(verifyRazorpayOrderSchema), authenticate, resolveTenant, requireTenant, async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, paymentId, orderId, signature } = req.body;
    if (!bookingId || !amount || !paymentId || !orderId || !signature) {
      res.status(400).json({ success: false, error: 'Missing required parameters' });
      return;
    }

    const result = await withTenant(req.tenantId!, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: { config: true }
      });
      const config = (tenant?.config as Record<string, string>) || {};
      const { razorpaySecret } = config;

      if (!razorpaySecret) {
        throw new Error('Razorpay gateway is not configured.');
      }

      const isValid = verifyRazorpayPayment(orderId, paymentId, signature, razorpaySecret);
      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      // Record the successful payment
      await prisma.guestPayment.create({
        data: {
          tenantId: req.tenantId!,
          bookingId,
          amount: Number(amount),
          method: 'razorpay',
          status: 'completed',
          gatewayPaymentId: paymentId,
        }
      });

      // Update Booking balance
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            advancePaid: booking.advancePaid + Number(amount),
            balanceDue: Math.max(0, booking.balanceDue - Number(amount))
          }
        });
      }

      return { verified: true, paymentId };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[RAZORPAY VERIFY ERROR]', err);
    res.status(400).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});
