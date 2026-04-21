import Razorpay from 'razorpay';
import crypto from 'crypto';

export async function createRazorpayOrder(amount: number, receiptId: string, keyId: string, keySecret: string) {
  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const options = {
    amount: Math.round(amount * 100), // Razorpay accepts amount in paisa
    currency: "INR",
    receipt: receiptId,
  };

  return await instance.orders.create(options);
}

export function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}
