'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

// Dynamically import map to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false, loading: () => <div className="h-[280px] rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 text-sm">Loading map...</div> });

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, Eye, EyeOff, Loader2, ChevronRight, CheckCircle2,
  Phone, Mail, Sparkles,
} from 'lucide-react';
import { COUNTRY_CODES } from '@/lib/constants';
import { authApi, tenantsApi, saveAuthData } from '@/lib/api';

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'resort', label: 'Resort' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'guest_house', label: 'Guest House' },
];

const PLANS = [
  { id: 'free', name: 'Starter', price: 'Free', features: '5 rooms \u2022 Basic Dashboard \u2022 Branded Page', highlight: true },
  { id: 'starter', name: 'Basic', price: '\u20B9999/mo', features: '20 rooms \u2022 Staff Management \u2022 GST Billing', highlight: false },
  { id: 'professional', name: 'Professional', price: '\u20B92,999/mo', features: '100 rooms \u2022 Custom Domain \u2022 Analytics', highlight: false },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: 'Unlimited \u2022 OTA Integration \u2022 Dedicated Support', highlight: false },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [propertyCountryCode, setPropertyCountryCode] = useState('+91');
  const [ownerCountryCode, setOwnerCountryCode] = useState('+91');
  const [selectedPlan, setSelectedPlan] = useState('free');

  // Property fields
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('hotel');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(20.5937);
  const [longitude, setLongitude] = useState<number | undefined>(78.9629);

  // Owner account fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLocationSelect = useCallback((result: { address: string; city: string; state: string; pincode: string; lat: number; lng: number }) => {
    setAddress(result.address);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    if (result.pincode) setPincode(result.pincode);
    setLatitude(result.lat);
    setLongitude(result.lng);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validations
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number'); return; }
    if (!/^\d{6}$/.test(pincode)) { setError('Pincode must be exactly 6 digits'); return; }
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      setError('Invalid GST number format'); return;
    }

    setLoading(true);
    try {
      // 1. Create account
      const authRes = await authApi.register({
        email,
        password,
        fullName,
        phone: phone || '',
        otpCode: '000000',
      });

      if (authRes.success) {
        saveAuthData({
          accessToken: authRes.data.accessToken,
          refreshToken: authRes.data.refreshToken,
          user: authRes.data.user,
        });
      }

      // 2. Register property
      const propRes = await tenantsApi.registerProperty({
        name: propertyName,
        propertyType,
        address,
        city,
        state,
        pincode,
        contactPhone: propertyCountryCode + contactPhone,
        contactEmail: contactEmail || email,
        gstNumber: gstNumber || undefined,
        latitude,
        longitude,
      });

      if (propRes.success && propRes.data?.id) {
        localStorage.setItem('tenantId', propRes.data.id);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
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
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.id
                    ? 'border-primary-500 bg-primary-50/50'
                    : 'border-surface-200 hover:border-surface-300 bg-white'
                }`}
              >
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
                <label htmlFor="propertyName" className="block text-sm font-medium text-surface-700 mb-1">
                  Property Name <span className="text-red-400">*</span>
                </label>
                <input id="propertyName" type="text" required value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. Sunrise Hill Resort" className="input-field" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="propertyType" className="block text-sm font-medium text-surface-700 mb-1">
                  Property Type <span className="text-red-400">*</span>
                </label>
                <select id="propertyType" value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="input-field">
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-surface-700 mb-1">
                  Contact Phone <span className="text-red-400">*</span>
                </label>
                <div className="flex">
                  <select value={propertyCountryCode} onChange={(e) => setPropertyCountryCode(e.target.value)}
                    className="shrink-0 w-[90px] rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 text-surface-600 text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input id="contactPhone" type="tel" required value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="98765 43210" className="input-field rounded-l-none" />
                </div>
              </div>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-surface-700 mb-1">
                  Property Email
                </label>
                <input id="contactEmail" type="email" value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@yourhotel.com" className="input-field" />
              </div>
            </div>

            {/* Location Search + Map */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Property Location <span className="text-red-400">*</span>
              </label>
              <LocationMap
                lat={latitude ?? 20.5937}
                lng={longitude ?? 78.9629}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Auto-filled location details */}
            {(city || state || pincode) && (
              <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-200/50">
                <p className="text-xs text-surface-500 mb-2 font-medium">📍 Detected Location</p>
                <div className="flex flex-wrap gap-2">
                  {city && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700">
                      🏙️ {city}
                    </span>
                  )}
                  {state && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700">
                      📍 {state}
                    </span>
                  )}
                  {pincode && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700">
                      📮 {pincode}
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-400 mt-2">
                  City, state, and pincode are auto-filled. You can edit them below if needed.
                </p>
              </div>
            )}

            {/* Editable overrides (collapsed by default, shown inline) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="city" className="block text-xs font-medium text-surface-500 mb-1">City</label>
                <input id="city" type="text" required value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City" className="input-field text-sm py-2" />
              </div>
              <div>
                <label htmlFor="state" className="block text-xs font-medium text-surface-500 mb-1">State</label>
                <input id="state" type="text" required value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State" className="input-field text-sm py-2" />
              </div>
              <div>
                <label htmlFor="pincode" className="block text-xs font-medium text-surface-500 mb-1">Pincode</label>
                <input id="pincode" type="text" required value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="522549" maxLength={6} className="input-field text-sm py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                GST Number <span className="text-surface-400 font-normal">(optional)</span>
              </label>
              <input type="text" value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5" className="input-field" />
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
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input id="fullName" type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rajesh Kumar" className="input-field" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input-field" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-surface-700 mb-1">
                  Phone
                </label>
                <div className="flex">
                  <select value={ownerCountryCode} onChange={(e) => setOwnerCountryCode(e.target.value)}
                    className="shrink-0 w-[90px] rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 text-surface-600 text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input id="phone" type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210" className="input-field rounded-l-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 mb-1">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} required
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
        <button type="submit" disabled={loading}
          className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-2">
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
