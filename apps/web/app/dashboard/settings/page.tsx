'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Building2, Users, CreditCard, Palette, Plus, X, Loader2, Trash2, Save, Globe, Receipt, TrendingUp, FileText, Layers, BedDouble, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { DomainSettings } from './domain-settings';
import { CompetitorRatesSettings } from './competitor-rates';
import { ComplianceSettings } from './compliance';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import SetupNextStepBanner from '@/app/dashboard/_components/setup-next-step-banner';

const LocationPicker = dynamic(() => import('./location-picker'), { ssr: false });

export default function SettingsPage() {
  const t = useTranslations('Dashboard');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-open a section when arriving from the setup guide (?section=xxx&from_setup=1)
  useEffect(() => {
    const section = searchParams.get('section');
    const fromSetup = searchParams.get('from_setup');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const sections = [
    { id: 'property', icon: Building2, title: 'Property Details', desc: 'Name, address, type, contact info, check-in/out times' },
    { id: 'inventory', icon: Building2, title: 'Property Inventory', desc: 'Floors, room types, rooms & pricing — all in one place', href: '/dashboard/settings/inventory' },
    { id: 'domain', icon: Globe, title: 'Domain Settings', desc: 'Subdomain, custom domain, and DNS configuration' },
    { id: 'billing', icon: Receipt, title: 'Billing & Taxes', desc: 'GST settings, invoicing details' },
    { id: 'competitor', icon: TrendingUp, title: 'Rate Comparison', desc: 'Manage your direct booking rate widget (OTA comparisons)' },
    { id: 'compliance', icon: FileText, title: 'Local Compliance', desc: 'Police Register (Sarai Act) and FRRO Settings' },
    { id: 'staff', icon: Users, title: 'Staff Management', desc: 'Invite and manage staff members with role-based access' },
    { id: 'subscription', icon: CreditCard, title: 'Subscription', desc: 'View and manage your istaysin plan' },
  ];

  return (
    <div className="space-y-6">
      <SetupNextStepBanner />
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">{t('settingsPage.title')}</h1>
        <p className="text-surface-400">{t('settingsPage.subtitle')}</p>
      </div>

      {!activeSection ? (
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button key={section.id} onClick={() => {
                  if (section.href) {
                    router.push(section.href);
                  } else {
                    setActiveSection(section.id);
                  }
                }}
                className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-surface-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-surface-500">{section.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 mb-6 group transition-colors">
            <div className="w-6 h-6 rounded-full bg-primary-400/10 flex items-center justify-center group-hover:bg-primary-400/20">
              <Plus className="w-3 h-3 rotate-45" />
            </div>
            Back to Settings
          </button>
          
          {activeSection === 'property' && <PropertySettings onBack={() => setActiveSection(null)} />}
          {activeSection === 'domain' && <DomainSettings />}
          {activeSection === 'staff' && <StaffSettings onBack={() => setActiveSection(null)} />}
          {activeSection === 'billing' && <BillingSettings onBack={() => setActiveSection(null)} />}
          {activeSection === 'competitor' && <CompetitorRatesSettings />}
          {activeSection === 'compliance' && <ComplianceSettings onBack={() => setActiveSection(null)} />}
          {activeSection === 'subscription' && <SubscriptionSettings onBack={() => setActiveSection(null)} />}
        </div>
      )}
    </div>
  );
}


// ── Property Settings ────────────────────────────────────────
function PropertySettings({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [bookingPrefix, setBookingPrefix] = useState('IS');

  const SUPPORTED_LANGS = [
    { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' }, { code: 'te', label: 'Telugu' },
    { code: 'ta', label: 'Tamil' }, { code: 'kn', label: 'Kannada' }, { code: 'mr', label: 'Marathi' },
    { code: 'bn', label: 'Bengali' }, { code: 'gu', label: 'Gujarati' }, { code: 'ml', label: 'Malayalam' }
  ];

  useEffect(() => {
    tenantsApi.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setName(d.name || ''); setAddress(d.address || ''); setCity(d.city || '');
          setState(d.state || ''); setPhone(d.contactPhone || ''); setEmail(d.contactEmail || '');
          setCheckInTime(d.defaultCheckInTime || '14:00'); setCheckOutTime(d.defaultCheckOutTime || '11:00');
          setLat(d.latitude || 20.5937); setLng(d.longitude || 78.9629);
          setLanguages(d.config?.languages || ['en']);
          setBookingPrefix(d.config?.bookingPrefix || 'IS');
          setSettings(d);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await tenantsApi.updateSettings({
        name, address, city, state,
        contactPhone: phone, contactEmail: email,
        defaultCheckInTime: checkInTime, defaultCheckOutTime: checkOutTime,
        latitude: lat, longitude: lng,
        config: { ...settings?.config, languages, bookingPrefix: bookingPrefix.trim().toUpperCase().slice(0, 6) || 'IS' }
      });
      toast.success('Property Settings saved successfully!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save settings'); }
    finally { setSaving(false); }
  }

  function toggleLanguage(code: string) {
    if (languages.includes(code)) {
      if (languages.length > 1) setLanguages(languages.filter(l => l !== code));
    } else {
      setLanguages([...languages, code]);
    }
  }

  if (loading) return <div className="glass-card p-12 text-center animate-pulse"><div className="h-8 bg-white/[0.06] rounded-lg w-48 mx-auto" /></div>;

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="glass-card p-6">
          <h2 className="text-lg font-display font-bold mb-6">Property Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Property Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">State</label>
                <input value={state} onChange={(e) => setState(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Contact Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Contact Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Check-in Time</label>
                <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Check-out Time</label>
                <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Booking ID Prefix (2-6 characters)</label>
              <div className="flex items-center gap-3">
                <input value={bookingPrefix} onChange={(e) => setBookingPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))} maxLength={6} placeholder="IS" className="input-field w-32 uppercase" />
                <span className="text-xs text-surface-400">Preview: <span className="font-mono text-primary-400">{(bookingPrefix || 'IS').toUpperCase()}-MO5GKE-1234</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold mb-2">Location Coordinates</h2>
            <p className="text-surface-400 text-sm mb-4">Click to drop a pin at your property location.</p>
            <LocationPicker lat={lat} lng={lng} onChange={(l, lg) => { setLat(l); setLng(lg); }} />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold mb-2">Website Languages</h2>
            <p className="text-surface-400 text-sm mb-4">Select the languages available on your public booking page.</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => toggleLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${languages.includes(l.code) ? 'bg-primary-500 text-white' : 'bg-white/[0.04] text-surface-300 hover:bg-white/[0.08]'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2 w-full mt-4">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Property Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subscription Settings ─────────────────────────────────────
function SubscriptionSettings({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    tenantsApi.getSettings().then((res) => {
      if (res.success && res.data) {
         setSubscription(res.data.subscriptions?.[0] || null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="glass-card p-12 text-center animate-pulse"><div className="h-8 bg-white/[0.06] rounded-lg w-48 mx-auto" /></div>;

  return (
    <div>
      <div className="glass-card p-6 max-w-2xl">
        <h2 className="text-xl font-display font-bold mb-6">Your Subscription Plan</h2>
        {!subscription ? (
          <div className="p-6 bg-surface-50 text-surface-900 rounded-xl text-center">
            <h3 className="font-bold mb-2">No Active Subscription</h3>
            <p className="text-sm">Please upgrade to a paid plan to unlock features.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-primary-900/40 rounded-xl border border-primary-500/20">
              <div>
                <p className="text-sm text-primary-400">Current Plan</p>
                <p className="text-3xl font-bold font-display uppercase tracking-wider">{subscription.plan}</p>
                <div className="mt-2 text-sm text-surface-300">
                  Renews on: <span className="text-white font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 font-medium rounded-full text-xs uppercase border border-green-500/20">Active</span>
                <p className="mt-4 font-medium text-surface-300 capitalize">{subscription.billingCycle} Billing</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between">
               <div>
                 <h4 className="font-medium text-white mb-1">Looking for more?</h4>
                 <p className="text-sm text-surface-400">Upgrade to unlock WhatsApp automation, custom domain, and advanced analytics.</p>
               </div>
               <button className="btn-primary">View Upgrades</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Staff Settings ────────────────────────────────────────────
function StaffSettings({ onBack }: { onBack: () => void }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    tenantsApi.getStaff()
      .then((res) => { if (res.success) setStaff(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleRemove(userId: string) {
    toast('Remove this staff member?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Confirm',
        onClick: async () => {
          try {
            await tenantsApi.removeStaff(userId);
            setStaff((prev) => prev.filter((s) => s.userId !== userId));
            toast.success('Staff member removed');
          } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to remove staff'); }
        }
      },
      cancel: { label: 'Cancel', onClick: () => {} }
    });
  }

  const roleLabels: Record<string, string> = {
    property_owner: 'Owner', general_manager: 'Manager', front_desk: 'Front Desk',
    housekeeping: 'Housekeeping', accountant: 'Accountant',
  };

  return (
    <div>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Staff Members</h2>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all ${
              showInvite ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'btn-primary'
            }`}
          >
            <Plus className="w-4 h-4" /> {showInvite ? 'Cancel' : 'Invite Staff'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/[0.04] rounded-lg animate-pulse" />)}</div>
        ) : staff.length === 0 ? (
          <p className="text-surface-500 text-sm text-center py-8">No staff members yet. Invite your team to get started.</p>
        ) : (
          <div className="space-y-3">
            {staff.map((member: any) => (
              <div key={member.userId || member.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-sm font-medium text-primary-400">
                    {member.user?.fullName?.[0] || member.fullName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.user?.fullName || member.fullName}</p>
                    <p className="text-xs text-surface-500">{member.user?.email || member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 font-medium">
                    {roleLabels[member.role] || member.role}
                  </span>
                  {member.role !== 'property_owner' && (
                    <button onClick={() => handleRemove(member.userId || member.id)}
                      className="text-surface-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <InviteStaffInline
              onClose={() => setShowInvite(false)}
              onInvited={() => { setShowInvite(false); tenantsApi.getStaff().then((r) => { if (r.success) setStaff(r.data || []); }); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InviteStaffInline({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('front_desk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !fullName.trim()) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      await tenantsApi.inviteStaff({ phone: phone.trim(), fullName: fullName.trim(), role, passcode: '123456' });
      onInvited();
      toast.success('Staff member invited!');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to invite staff'); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{ borderTop: '3px solid #166534' }}>
      <div className="flex items-center justify-between p-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <h3 className="font-display text-base font-bold text-surface-900">Invite Staff Member</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {error && <div className="sm:col-span-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            <option value="general_manager">General Manager</option>
            <option value="front_desk">Front Desk</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="accountant">Accountant</option>
          </select>
        </div>
        <div className="sm:col-span-3 flex gap-3 pt-1 border-t border-surface-100">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Send Invite
          </button>
        </div>
      </form>
    </div>
  );
}


// ── Billing & Taxes Settings ──────────────────────────────────
function BillingSettings({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [legalName, setLegalName] = useState('');
  const [allowPayAtHotel, setAllowPayAtHotel] = useState(true);

  useEffect(() => {
    tenantsApi.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setGstEnabled(d.config?.gstEnabled || false);
          setGstNumber(d.gstNumber || '');
          setLegalName(d.config?.legalName || '');
          setAllowPayAtHotel(d.config?.allowPayAtHotel !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await tenantsApi.updateSettings({
        gstNumber,
        config: { gstEnabled, legalName, allowPayAtHotel }
      });
      toast.success('Billing & Tax settings saved!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save settings'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="glass-card p-12 text-center animate-pulse"><div className="h-8 bg-white/[0.06] rounded-lg w-48 mx-auto" /></div>;

  return (
    <div>
      <div className="glass-card p-6 max-w-2xl">
        <h2 className="text-lg font-display font-bold mb-6">Billing & Tax Configuration</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <p className="font-medium text-white">Enable GST Invoicing</p>
              <p className="text-sm text-surface-400">Automatically calculate and apply standard Indian GST slabs to room operations on checkout invoices.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-surface-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          {gstEnabled && (
            <div className="space-y-4 pt-2 border-t border-surface-100">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">GSTIN (Goods and Services Tax Identification Number)</label>
                <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} className="input-field uppercase" placeholder="e.g. 29ABCDE1234F1Z5" maxLength={15} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Registered Legal Entity Name</label>
                <input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="input-field" placeholder="Name as per GST registration" />
              </div>

              <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 mt-4">
                <h4 className="text-sm font-medium text-primary-700 mb-2">Automated GST Slabs (Hotel Room Tariff)</h4>
                <ul className="text-xs text-primary-600 space-y-1 list-disc pl-4">
                  <li>Up to ₹1,000 / night: <strong>0% GST</strong></li>
                  <li>₹1,001 to ₹7,500 / night: <strong>12% GST</strong></li>
                  <li>Above ₹7,500 / night: <strong>18% GST</strong></li>
                </ul>
                <p className="text-xs text-primary-500 mt-2 italic">Note: The system determines Intra-state vs Inter-state supply based on your Property Address state settings.</p>
              </div>
            </div>
          )}

          {/* Pay at Hotel Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div>
              <p className="font-medium text-surface-900">Allow Pay at Hotel</p>
              <p className="text-sm text-surface-500">Let guests book via your website without making an advance payment. Payment is collected on arrival.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={allowPayAtHotel} onChange={(e) => setAllowPayAtHotel(e.target.checked)} />
              <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2 mt-6 w-full sm:w-auto px-6 py-2.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
