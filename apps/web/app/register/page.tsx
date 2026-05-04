'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false, loading: () => <div className="h-[280px] rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 text-sm">Loading map...</div> });

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, Eye, EyeOff, Loader2, ChevronRight, CheckCircle2,
  Sparkles, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRY_CODES } from '@/lib/constants';
import { authApi, tenantsApi, saveAuthData } from '@/lib/api';

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'resort', label: 'Resort' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'guest_house', label: 'Guest House' },
  { value: 'pg', label: 'PG / Paying Guest' },
  { value: 'hostel', label: 'Hostel' },
];

const PLANS = [
  { id: 'free', name: 'Starter', price: 'Free', features: '5 rooms • Basic Dashboard • Branded Page', highlight: true },
  { id: 'starter', name: 'Basic', price: '₹999/mo', features: '20 rooms • Staff Management • GST Billing', highlight: false },
  { id: 'professional', name: 'Professional', price: '₹2,999/mo', features: '100 rooms • Custom Domain • Analytics', highlight: false },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: 'Unlimited • OTA Integration • Dedicated Support', highlight: false },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to error banner whenever an error is set
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  // Property fields
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('hotel');
  const [propertyCountryCode, setPropertyCountryCode] = useState('+91');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(20.5937);
  const [longitude, setLongitude] = useState<number | undefined>(78.9629);

  // Owner account fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [ownerCountryCode, setOwnerCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fullPhone = ownerCountryCode + phone.replace(/\D/g, '');

  const handleLocationSelect = useCallback((result: { address: string; city: string; state: string; pincode: string; lat: number; lng: number }) => {
    setAddress(result.address);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    if (result.pincode) setPincode(result.pincode);
    setLatitude(result.lat);
    setLongitude(result.lng);
  }, []);

  async function handleSendOtp() {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number first');
      return;
    }
    setOtpSending(true);
    try {
      const res = await authApi.sendWhatsappOtp({ phone: fullPhone });
      if (res.success) {
        setOtpSent(true);
        setOtpCode('');
        setDevCode((res as any).devCode ?? null);
        toast.success('OTP sent to your WhatsApp!', { duration: 4000 });
      } else {
        toast.error(res.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Could not send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!phone || phone.replace(/\D/g, '').length < 10) { setError('Enter a valid mobile number'); return; }
    if (!otpSent || otpCode.length !== 6) { setError('Please enter the 6-digit OTP sent to your WhatsApp'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!/^\d{6}$/.test(pincode)) { setError('Pincode must be exactly 6 digits'); return; }
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      setError('Invalid GST number format'); return;
    }

    setLoading(true);
    try {
      const authRes = await authApi.register({
        phone: fullPhone,
        password,
        fullName,
        email: email || undefined,
        otpCode,
      });

      if (!authRes.success) throw new Error(authRes.error || 'Account creation failed');

      saveAuthData({
        accessToken: authRes.data.accessToken,
        refreshToken: authRes.data.refreshToken,
        user: authRes.data.user,
      });

      const propRes = await tenantsApi.registerProperty({
        name: propertyName,
        propertyType,
        address,
        city,
        state,
        pincode,
        contactPhone: propertyCountryCode + contactPhone.replace(/\D/g, ''),
        contactEmail: contactEmail || email || `${phone}@hotel.local`,
        gstNumber: gstNumber || undefined,
        referenceCode: referenceCode || undefined,
        latitude,
        longitude,
        plan: selectedPlan,
      });

      if (!propRes.success) throw new Error(propRes.error || 'Property registration failed');

      // Re-login to get a fresh JWT that embeds the new tenantId in the payload.
      // Wrapped in its own try-catch — a network failure here must not mask the
      // successful registration. The fallback writes tenantId directly to localStorage
      // so the dashboard still resolves correctly via the x-tenant-id header.
      
      const newMembership = {
        id: 'temp-' + Date.now(),
        tenantId: propRes.data.id,
        role: 'property_owner',
        tenant: propRes.data
      };

      try {
        const loginRes = await authApi.login({ identifier: fullPhone, password });
        if (loginRes.success) {
          saveAuthData({
            accessToken: loginRes.data.accessToken,
            refreshToken: loginRes.data.refreshToken,
            user: loginRes.data.user,
            tenantId: loginRes.data.memberships?.[0]?.tenantId ?? propRes.data.id,
            memberships: loginRes.data.memberships?.length ? loginRes.data.memberships : [newMembership],
          });
        } else if (propRes.data?.id) {
          const currentToken = localStorage.getItem('accessToken');
          if (currentToken) {
            saveAuthData({
              accessToken: currentToken,
              refreshToken: localStorage.getItem('refreshToken') || '',
              user: JSON.parse(localStorage.getItem('user') || '{}'),
              tenantId: propRes.data.id,
              memberships: [newMembership]
            });
          } else {
            localStorage.setItem('tenantId', propRes.data.id);
            localStorage.setItem('tenant_id', propRes.data.id);
            localStorage.setItem('memberships', JSON.stringify([newMembership]));
          }
        }
      } catch {
        if (propRes.data?.id) {
          const currentToken = localStorage.getItem('accessToken');
          if (currentToken) {
            saveAuthData({
              accessToken: currentToken,
              refreshToken: localStorage.getItem('refreshToken') || '',
              user: JSON.parse(localStorage.getItem('user') || '{}'),
              tenantId: propRes.data.id,
              memberships: [newMembership]
            });
          } else {
            localStorage.setItem('tenantId', propRes.data.id);
            localStorage.setItem('tenant_id', propRes.data.id);
            localStorage.setItem('memberships', JSON.stringify([newMembership]));
          }
        }
      }

      toast.success('Property registered! You will be notified once your property is approved.');
      router.push('/pending-approval');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg, { duration: 6000 });
      // scrolling is handled by the useEffect on `error`
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/60 to-white pb-16">
      {/* Header */}
      <div className="text-center pt-10 pb-8 px-4">
        <Link href="/" className="inline-flex items-center gap-2 mb-5">
          <Building2 className="w-10 h-10 text-primary-600" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-surface-900 mb-1">
          Register Your Property
        </h1>
        <p className="text-surface-500 text-sm">
          Create your account and get online in 24 hours
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 space-y-6">
        {/* Error */}
        {error && (
          <div ref={errorRef} className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm transition-all duration-300">
            {error}
          </div>
        )}

        {/* ═══ CHOOSE YOUR PLAN ═══ */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-surface-800">Choose Your Plan</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLANS.map((plan) => (
              <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.id
                    ? 'border-primary-500 bg-primary-50/50'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}>
                {selectedPlan === plan.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary-600 absolute top-2 right-2" />
                )}
                <p className="font-semibold text-surface-800 text-sm">{plan.name}</p>
                <p className="text-primary-600 font-bold text-sm">{plan.price}</p>
                <p className="text-[11px] text-surface-400 mt-1 leading-tight">{plan.features}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-surface-400 mt-3 text-center">
            Great for getting started! You can upgrade anytime from your dashboard.
          </p>
        </div>

        {/* ═══ SECTION 1: PROPERTY DETAILS ═══ */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">1</span>
            <h2 className="font-semibold text-surface-800">Property Details</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Property Name <span className="text-red-400">*</span>
                </label>
                <input id="propertyName" type="text" required value={propertyName} onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. Sunrise Hill Resort" className="input-field" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Property Type <span className="text-red-400">*</span>
                </label>
                <select id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="input-field">
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {(propertyType === 'pg' || propertyType === 'hostel') && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
                <span className="text-base mt-0.5">💡</span>
                <span>Monthly billing will be enabled by default for {propertyType === 'pg' ? 'PG' : 'Hostel'} properties.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Property Phone <span className="text-red-400">*</span>
                </label>
                <div className="flex">
                  <select value={propertyCountryCode} onChange={(e) => setPropertyCountryCode(e.target.value)}
                    className="shrink-0 w-[90px] rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 text-surface-600 text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input id="contactPhone" type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="98765 43210" className="input-field rounded-l-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Property Email</label>
                <input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@yourhotel.com" className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Property Location <span className="text-red-400">*</span>
              </label>
              <LocationMap lat={latitude ?? 20.5937} lng={longitude ?? 78.9629} onLocationSelect={handleLocationSelect} />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-surface-700 mb-1">
                Street Address <span className="text-red-400">*</span>
              </label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Click the map or search above to auto-fill"
                className="input-field"
              />
            </div>

            {(city || state || pincode) && (
              <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-200/50">
                <p className="text-xs text-surface-500 mb-2 font-medium">📍 Detected Location</p>
                <div className="flex flex-wrap gap-2">
                  {city && <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700">🏙️ {city}</span>}
                  {state && <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700">📍 {state}</span>}
                  {pincode && <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700">📮 {pincode}</span>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">City</label>
                <input id="city" type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="City" className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">State</label>
                <input id="state" type="text" required value={state} onChange={(e) => setState(e.target.value)}
                  placeholder="State" className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Pincode</label>
                <input id="pincode" type="text" required value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="522549" maxLength={6} className="input-field text-sm py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                GST Number <span className="text-surface-400 font-normal">(optional)</span>
              </label>
              <input id="gstNumber" type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5" className="input-field" />
            </div>

            {/* Reference / Promo Code — optional, for campaign tracking */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Reference / Promo Code
                <span className="text-surface-400 font-normal"> (optional — enter if you were referred by a partner or campaign)</span>
              </label>
              <input
                id="referenceCode"
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 50))}
                placeholder="e.g. PARTNER2024 or YOUTUBE50"
                className="input-field font-mono tracking-wider"
                autoComplete="off"
              />
              {referenceCode && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <span>✓</span> Code <strong>{referenceCode}</strong> will be applied to your registration
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: OWNER ACCOUNT ═══ */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">2</span>
            <h2 className="font-semibold text-surface-800">Owner Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input id="ownerName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Rajesh Kumar" className="input-field" />
            </div>

            {/* Mobile — primary identifier */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                WhatsApp Mobile <span className="text-red-400">*</span>
                <span className="ml-1.5 text-xs font-normal text-surface-400">(used to log in)</span>
              </label>
              <div className="flex gap-2">
                <div className="flex flex-1">
                  <select value={ownerCountryCode} onChange={(e) => { setOwnerCountryCode(e.target.value); setOtpSent(false); setOtpCode(''); setDevCode(null); }}
                    className="shrink-0 w-[90px] rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 text-surface-600 text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input id="ownerPhone" type="tel" required value={phone}
                    onChange={(e) => { setPhone(e.target.value); setOtpSent(false); setOtpCode(''); setDevCode(null); }}
                    placeholder="98765 43210" className="input-field rounded-l-none" />
                </div>
                <button type="button" onClick={handleSendOtp} disabled={otpSending}
                  className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all min-w-[110px] justify-center bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
                  {otpSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><MessageCircle className="w-4 h-4" /> {otpSent ? 'Resend' : 'Send OTP'}</>
                  }
                </button>
              </div>
            </div>

            {/* OTP input — shown after send */}
            {otpSent && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Enter the 6-digit code sent to your WhatsApp
                </p>
                {devCode && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-300 mb-3">
                    <span className="text-lg">🛠️</span>
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Dev mode — OTP</p>
                      <p className="text-2xl font-black text-amber-800 tracking-[0.3em] mt-0.5">{devCode}</p>
                    </div>
                  </div>
                )}
                <input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="input-field w-full tracking-[0.4em] text-center font-bold text-lg"
                  autoFocus
                />
                <p className="text-xs text-emerald-600 mt-2">Didn&apos;t receive it? Click Resend above.</p>
              </div>
            )}

            {/* Email — optional */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Email <span className="text-surface-400 font-normal">(optional — for booking confirmations)</span>
              </label>
              <input id="ownerEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input id="ownerPassword" type={showPassword ? 'text' : 'password'} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input id="ownerConfirmPassword" type={showConfirm ? 'text' : 'password'} required
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        {!otpSent && (
          <p className="text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Send OTP to your WhatsApp number before submitting
          </p>
        )}

        <button type="submit" disabled={loading || !otpSent || otpCode.length !== 6}
          className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? 'Registering your property...' : 'Register Property'}
          {!loading && <ChevronRight className="w-5 h-5" />}
        </button>

        <p className="text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
