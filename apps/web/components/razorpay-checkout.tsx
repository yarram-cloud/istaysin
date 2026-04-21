'use client';

import { useState, useEffect } from 'react';
import { paymentsApi } from '@/lib/api';
import { CreditCard, Loader2 } from 'lucide-react';

interface RazorpayCheckoutProps {
  bookingId: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  buttonText?: string;
  className?: string;
}

export function RazorpayCheckoutButton({
  bookingId,
  amount,
  onSuccess,
  onError,
  buttonText = 'Pay via Razorpay',
  className = 'btn-primary w-full h-12',
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Razorpay script
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }

    const loadScript = () => {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => onError('Failed to load Razorpay SDK');
      document.body.appendChild(script);
    };

    loadScript();
  }, [onError]);

  const handlePayment = async () => {
    if (!scriptLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
      onError('Razorpay SDK not loaded');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Order on Backend
      const orderRes = await paymentsApi.createRazorpayOrder({ bookingId, amount });
      if (!orderRes.success) throw new Error(orderRes.error || 'Failed to create order');

      const { orderId, amount: rzpAmount, currency, keyId } = orderRes.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: keyId,
        amount: rzpAmount,
        currency: currency,
        name: 'iStays Checkout',
        description: `Booking Folio Settlement`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await paymentsApi.verifyRazorpayPayment({
              bookingId,
              amount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            if (!verifyRes.success) throw new Error(verifyRes.error || 'Verification failed');
            
            onSuccess(response.razorpay_payment_id);
          } catch (err: any) {
            onError(err.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: '', // Can be populated from booking data if passed
          email: '',
          contact: ''
        },
        theme: {
          color: '#0f172a' // Slate 900
        }
      };

      const rzpStart = new (window as any).Razorpay(options);
      rzpStart.on('payment.failed', function (response: any) {
        onError(response.error.description || 'Payment Failed');
      });
      rzpStart.open();

    } catch (err: any) {
      onError(err.message || 'An error occurred initiating payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      ) : (
        <span className="flex items-center gap-2 justify-center">
          <CreditCard className="w-5 h-5" />
          {buttonText}
        </span>
      )}
    </button>
  );
}
