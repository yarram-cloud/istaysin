'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Building2, Users, CreditCard, Palette, Plus, X, Loader2, Trash2, Save } from 'lucide-react';
import { tenantsApi } from '@/lib/api';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'property', icon: Building2, title: 'Property Details', desc: 'Name, address, type, contact info, check-in/out times' },
    { id: 'staff', icon: Users, title: 'Staff Management', desc: 'Invite and manage staff members with role-based access' },
    { id: 'subscription', icon: CreditCard, title: 'Subscription', desc: 'View and manage your istaysin plan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Settings</h1>
        <p className="text-surface-400">Configure your property and account</p>
      </div>

      {!activeSection ? (
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <button key={section.id} onClick={() => setActiveSection(section.id)}
              className="glass-card p-6 hover:bg-white/[0.08] transition-all cursor-pointer group text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <section.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
                  <p className="text-sm text-surface-400">{section.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : activeSection === 'property' ? (
        <PropertySettings onBack={() => setActiveSection(null)} />
      ) : activeSection === 'staff' ? (
        <StaffSettings onBack={() => setActiveSection(null)} />
      ) : activeSection === 'subscription' ? (
        <SubscriptionSettings onBack={() => setActiveSection(null)} />
      ) : null}
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

  useEffect(() => {
    tenantsApi.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setName(d.name || ''); setAddress(d.address || ''); setCity(d.city || '');
          setState(d.state || ''); setPhone(d.contactPhone || ''); setEmail(d.contactEmail || '');
          setCheckInTime(d.checkInTime || '14:00'); setCheckOutTime(d.checkOutTime || '11:00');
          setSettings(d);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await tenantsApi.updateSettings({
        name, address, city, state,
        contactPhone: phone, contactEmail: email,
        checkInTime, checkOutTime,
      });
      alert('Settings saved!');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="glass-card p-12 text-center animate-pulse"><div className="h-8 bg-white/[0.06] rounded-lg w-48 mx-auto" /></div>;

  return (
    <div>
      <button onClick={onBack} className="text-sm text-primary-400 hover:text-primary-300 mb-4">&larr; Back to Settings</button>
      <div className="glass-card p-6">
        <h2 className="text-lg font-display font-bold mb-6">Property Details</h2>
        <div className="space-y-4 max-w-lg">
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
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 mt-4">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>
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

  async function handleRemove(userId: string) {
    if (!confirm('Remove this staff member?')) return;
    try {
      await tenantsApi.removeStaff(userId);
      setStaff((prev) => prev.filter((s) => s.userId !== userId));
    } catch (err: any) { alert(err.message); }
  }

  const roleLabels: Record<string, string> = {
    property_owner: 'Owner', general_manager: 'Manager', front_desk: 'Front Desk',
    housekeeping: 'Housekeeping', accountant: 'Accountant',
  };

  return (
    <div>
      <button onClick={onBack} className="text-sm text-primary-400 hover:text-primary-300 mb-4">&larr; Back to Settings</button>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Staff Members</h2>
          <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Invite Staff
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

      {showInvite && (
        <InviteStaffModal onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); tenantsApi.getStaff().then((r) => { if (r.success) setStaff(r.data || []); }); }} />
      )}
    </div>
  );
}

function InviteStaffModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('front_desk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      await tenantsApi.inviteStaff({ email: email.trim(), fullName: fullName.trim(), role });
      onInvited();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Invite Staff</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              <option value="general_manager">General Manager</option>
              <option value="front_desk">Front Desk</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Subscription Settings ────────────────────────────────────
function SubscriptionSettings({ onBack }: { onBack: () => void }) {
  const plans = [
    { name: 'Starter', price: 'Free', rooms: '5 rooms', features: ['Basic booking', 'Guest check-in', 'GST billing'] },
    { name: 'Basic', price: '₹999/mo', rooms: '20 rooms', features: ['Everything in Starter', 'Analytics', 'Branded website', 'Email notifications'] },
    { name: 'Professional', price: '₹2,499/mo', rooms: '100 rooms', features: ['Everything in Basic', 'OTA integration', 'Staff management', 'Advanced reports'] },
    { name: 'Enterprise', price: 'Custom', rooms: 'Unlimited', features: ['Everything in Professional', 'Custom integrations', 'Dedicated support', 'SLA guarantee'] },
  ];

  const currentPlan = 'Starter'; // TODO: fetch from API

  return (
    <div>
      <button onClick={onBack} className="text-sm text-primary-400 hover:text-primary-300 mb-4">&larr; Back to Settings</button>
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-display font-bold mb-2">Current Plan</h2>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary-400">{currentPlan}</span>
          <span className="text-sm text-surface-400">(Free tier)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`rounded-xl border p-5 transition-all ${
            plan.name === currentPlan
              ? 'border-primary-500/30 bg-primary-500/5'
              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
          }`}>
            <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
            <p className="text-xl font-bold text-primary-400 mb-1">{plan.price}</p>
            <p className="text-xs text-surface-500 mb-4">{plan.rooms}</p>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-surface-400 flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">&#10003;</span> {f}
                </li>
              ))}
            </ul>
            {plan.name !== currentPlan && plan.name !== 'Enterprise' && (
              <button className="btn-secondary text-sm w-full mt-4">Upgrade</button>
            )}
            {plan.name === 'Enterprise' && (
              <a href="mailto:sales@istaysin.com" className="btn-secondary text-sm w-full mt-4 text-center block">Contact Sales</a>
            )}
            {plan.name === currentPlan && (
              <span className="block text-center text-xs text-primary-400 font-medium mt-4">Current Plan</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
