'use client';

import { useState, useEffect } from 'react';
import { publicApi } from '@/lib/api';
import { CreditCard, Loader2 } from 'lucide-react';

interface PublicRazorpayCheckoutProps {
  bookingId: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  buttonText?: string;
  className?: string;
}

export function PublicRazorpayCheckoutButton({
  bookingId,
  amount,
  onSuccess,
  onError,
  buttonText = 'Pay via Razorpay',
  className = 'w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all',
}: PublicRazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => onError('Failed to load Razorpay Checkout');
    document.body.appendChild(script);
  }, [onError]);

  const handlePayment = async () => {
    if (!scriptLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
      onError('Payment gateway is not ready yet. Please wait a moment.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Public Order
      const orderRes = await publicApi.createRazorpayOrder({ bookingId, amount });
      if (!orderRes.success) throw new Error(orderRes.error || 'Failed to initialize payment');

      const { orderId, amount: rzpAmount, currency, keyId } = orderRes.data;

      // 2. Open Razorpay Widget
      const options = {
        key: keyId,
        amount: rzpAmount,
        currency: currency,
        name: 'Secure Online Booking',
        description: 'Advance Deposit Payment',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await publicApi.verifyRazorpayPayment({
              bookingId,
              amount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            if (!verifyRes.success) throw new Error(verifyRes.error || 'Payment verification failed');
            
            onSuccess(response.razorpay_payment_id);
          } catch (err: any) {
            onError(err.message || 'Payment verification failed');
          }
        },
        theme: {
          color: '#4f46e5' // Indigo
        }
      };

      const rzpModal = new (window as any).Razorpay(options);
      rzpModal.on('payment.failed', function (response: any) {
        onError(response.error.description || 'Payment Failed');
      });
      rzpModal.open();

    } catch (err: any) {
      onError(err.message || 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className={`${className} ${loading || !scriptLoaded ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          {buttonText}
        </>
      )}
    </button>
  );
}
