'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhoneLoginModule({ targetRole = 'guest' }: { targetRole?: 'staff' | 'guest' }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input_phone' | 'input_otp'>('input_phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOTP = async () => {
    if (!phoneNumber) return setError('Phone number is required');
    setError('');
    setLoading(true);
    
    // Normalize format for DB schema matching exactly
    const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    try {
      const res = await fetch(`/api/v1/auth/send-whatsapp-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep('input_otp');
        setPhoneNumber(formatted); // Lock format for next request
      } else {
        setError(data.error || 'Failed to trigger WhatsApp engine');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network communication failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) return setError('OTP is required');
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/auth/verify-whatsapp-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: otp, targetRole })
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        // Redirect logic seamlessly
        if (data.data.user.role === 'global_admin') {
          router.push('/dashboard/select-tenant');
        } else if (data.data.user.role !== 'guest') {
          router.push('/dashboard/calendar');
        } else {
          router.push('/guest/portfolio');
        }
      } else {
        setError(data.error || 'Invalid passcode or expired');
      }
    } catch (err: any) {
      console.error(err);
      setError('Verification connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-sm bg-white">
      <h2 className="text-xl font-bold tracking-tight">Login with WhatsApp</h2>
      <p className="text-sm text-gray-500">Fast and secure passwordless authentication over WhatsApp.</p>
      
      {error && <div className="p-3 text-sm rounded bg-red-50 text-red-600 border border-red-200">{error}</div>}

      {step === 'input_phone' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">WhatsApp Number</label>
            <input 
              type="tel" 
              placeholder="9876543210" 
              value={phoneNumber} 
              className="input-field"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} 
            />
            <p className="text-xs text-gray-400">If outside India, prefix your absolute country code (e.g. +1...)</p>
          </div>
          <button className="btn-primary w-full" onClick={sendOTP} disabled={loading}>
            {loading ? 'Routing to WhatsApp...' : 'Get Code on WhatsApp'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
           <div className="space-y-2">
            <label className="text-sm font-medium">Authentication Code</label>
            <input 
              type="text" 
              placeholder="123456" 
              value={otp} 
              className="input-field"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)} 
            />
            <p className="text-xs text-gray-400">Check your WhatsApp messages for the 6-digit code.</p>
          </div>
          <button className="btn-primary w-full" onClick={verifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button className="btn-secondary w-full" onClick={() => setStep('input_phone')}>
            Try different number
          </button>
        </div>
      )}
    </div>
  );
}
