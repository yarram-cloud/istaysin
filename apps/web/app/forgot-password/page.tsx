'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Eye, EyeOff, MessageCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/constants';

type Step = 'phone' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const fullPhone = countryCode + phone.replace(/\D/g, '');

  async function handleSendOtp() {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setSending(true);
    try {
      const res = await authApi.sendWhatsappOtp({ phone: fullPhone });
      if (res.success) {
        setDevCode((res as any).devCode ?? null);
        setStep('otp');
        toast.success('OTP sent to your WhatsApp!');
      } else {
        toast.error(res.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Could not send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) { toast.error('Enter the full 6-digit code'); return; }
    setStep('password');
  }

  async function handleResetPassword() {
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setResetting(true);
    try {
      const res = await authApi.resetPassword({ phone: fullPhone, otpCode, newPassword });
      if (res.success) {
        toast.success('Password reset! You can now log in.');
        router.push('/login');
      } else {
        toast.error(res.error || 'Reset failed. OTP may have expired.');
        // If OTP was already consumed by a prior failed attempt, go back to start
        setStep('phone');
        setOtpCode('');
        setDevCode(null);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary-50/60 to-white relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Building2 className="w-10 h-10 text-primary-600" />
            <span className="text-2xl font-display font-bold text-surface-900">istaysin</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Reset your password</h1>
          <p className="text-surface-500 text-sm">We'll send a one-time code to your WhatsApp</p>
        </div>

        <div className="glass-card p-8 space-y-5">

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {(['phone', 'otp', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  step === s ? 'bg-primary-600 text-white' :
                  ['phone', 'otp', 'password'].indexOf(step) > i ? 'bg-emerald-500 text-white' :
                  'bg-surface-100 text-surface-400'
                }`}>
                  {['phone', 'otp', 'password'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                  ['phone', 'otp', 'password'].indexOf(step) > i ? 'bg-emerald-400' : 'bg-surface-100'
                }`} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Phone ── */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  WhatsApp Mobile Number
                </label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                    className="shrink-0 w-[90px] rounded-xl border border-surface-200 bg-surface-50 text-surface-600 text-sm px-2 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="input-field flex-1"
                    autoFocus
                  />
                </div>
              </div>
              <button onClick={handleSendOtp} disabled={sending}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send OTP via WhatsApp'}
              </button>
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-600">
                Enter the 6-digit code sent to <span className="font-semibold text-surface-900">{fullPhone}</span>
              </p>

              {/* Dev hint — only visible locally when no WhatsApp token */}
              {devCode && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-300">
                  <span className="text-lg">🛠️</span>
                  <div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Dev mode — OTP</p>
                    <p className="text-2xl font-black text-amber-800 tracking-[0.3em] mt-0.5">{devCode}</p>
                  </div>
                </div>
              )}

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="input-field w-full tracking-[0.4em] text-center font-bold text-2xl py-4"
                autoFocus
              />

              <button onClick={handleVerifyOtp} disabled={otpCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                <ShieldCheck className="w-4 h-4" /> Verify Code
              </button>

              <button onClick={() => { setStep('phone'); setOtpCode(''); setDevCode(null); }}
                className="w-full text-sm text-surface-400 hover:text-surface-600 text-center py-1">
                ← Change number
              </button>
            </div>
          )}

          {/* ── Step 3: New password ── */}
          {step === 'password' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Number verified — set your new password</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters" className="input-field pr-10" autoFocus />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                    placeholder="Repeat password" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button onClick={handleResetPassword} disabled={resetting || !newPassword || !confirmPassword}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {resetting ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          Remembered it?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
