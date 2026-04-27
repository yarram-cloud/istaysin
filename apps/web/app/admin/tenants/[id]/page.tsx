'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Users, BedDouble, CalendarDays,
  Save, Loader2, IndianRupee, Crown, Zap, Rocket, Gift, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { platformApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface TenantDetail {
  id: string; name: string; slug: string; status: string; plan: string;
  propertyType: string; city?: string; state?: string; contactPhone?: string;
  contactEmail?: string; gstNumber?: string; config: any; createdAt: string;
  owner: { id: string; fullName: string; email: string; phone?: string };
  subscriptions: any[];
  _count: { rooms: number; bookings: number; memberships: number; roomTypes: number; floors: number };
}

interface SaasPlan {
  id: string; code: string; name: string;
  actualPrice: number; discountMonthly: number; discountYearly: number;
}

interface CustomPricing {
  [planCode: string]: {
    monthlyPrice?: number;
    discountedPrice?: number;
    yearlyPrice?: number;
    trialDays?: number;
  };
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Gift, basic: Zap, professional: Rocket, enterprise: Crown,
};
const PLAN_COLORS: Record<string, string> = {
  free: 'text-surface-400', basic: 'text-emerald-400', professional: 'text-blue-400', enterprise: 'text-amber-400',
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [customPricing, setCustomPricing] = useState<CustomPricing | null>(null);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing'>('overview');

  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, plansRes, pricingRes] = await Promise.all([
        platformApi.getTenantDetail(tenantId),
        platformApi.getPlans(),
        platformApi.getTenantCustomPricing(tenantId),
      ]);

      if (tenantRes.success) setTenant(tenantRes.data);
      if (plansRes.success) setPlans(plansRes.data);
      if (pricingRes.success && pricingRes.data.customPlanPricing) {
        setCustomPricing(pricingRes.data.customPlanPricing);
        setCustomEnabled(true);
      }
    } catch { toast.error('Failed to load tenant details'); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateCustomPrice(planCode: string, field: string, value: number) {
    setCustomPricing((prev) => ({
      ...prev,
      [planCode]: { ...(prev?.[planCode] || {}), [field]: value },
    }));
  }

  async function handleSaveCustomPricing() {
    setSaving(true);
    try {
      const payload = customEnabled ? customPricing : null;
      const res = await platformApi.updateTenantCustomPricing(tenantId, payload);
      if (res.success) {
        toast.success(customEnabled ? 'Custom pricing saved!' : 'Custom pricing cleared');
      } else { toast.error(res.error); }
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  function toggleCustomPricing() {
    if (customEnabled) {
      setCustomEnabled(false);
      setCustomPricing(null);
    } else {
      setCustomEnabled(true);
      // Initialize from global plan prices
      const init: CustomPricing = {};
      for (const p of plans) {
        init[p.code] = {
          monthlyPrice: p.actualPrice,
          discountedPrice: p.discountMonthly,
          yearlyPrice: p.discountYearly,
          trialDays: 14,
        };
      }
      setCustomPricing(init);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-400">Tenant not found</p>
        <button onClick={() => router.push('/admin/tenants')} className="mt-4 text-primary-400 hover:text-primary-300 text-sm">
          ← Back to All Properties
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    suspended: 'bg-red-500/15 text-red-300 border-red-500/20',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + Header */}
      <button onClick={() => router.push('/admin/tenants')}
        className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        All Properties
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{tenant.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-surface-400">{tenant.slug}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tenant.status] || ''}`}>
                {tenant.status.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-300 capitalize">{tenant.plan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-800/50 border border-white/[0.06] w-fit">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'pricing' as const, label: 'Custom Pricing' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
            }`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Rooms', value: tenant._count.rooms, icon: BedDouble, color: 'text-blue-400' },
              { label: 'Room Types', value: tenant._count.roomTypes, icon: Building2, color: 'text-purple-400' },
              { label: 'Floors', value: tenant._count.floors, icon: Building2, color: 'text-cyan-400' },
              { label: 'Bookings', value: tenant._count.bookings, icon: CalendarDays, color: 'text-emerald-400' },
              { label: 'Staff', value: tenant._count.memberships, icon: Users, color: 'text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-surface-800/50 border border-white/[0.06]">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-surface-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/[0.06] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Property Info</h3>
              <InfoRow label="Type" value={tenant.propertyType} />
              <InfoRow label="Location" value={[tenant.city, tenant.state].filter(Boolean).join(', ') || '—'} />
              <InfoRow label="Phone" value={tenant.contactPhone || '—'} />
              <InfoRow label="Email" value={tenant.contactEmail || '—'} />
              <InfoRow label="GSTIN" value={tenant.gstNumber || '—'} />
              <InfoRow label="Registered" value={new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            </div>
            <div className="rounded-2xl border border-white/[0.06] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Owner</h3>
              <InfoRow label="Name" value={tenant.owner.fullName} />
              <InfoRow label="Email" value={tenant.owner.email} />
              <InfoRow label="Phone" value={tenant.owner.phone || '—'} />
              {tenant.subscriptions.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider pt-3">Subscription</h3>
                  <InfoRow label="Plan" value={tenant.subscriptions[0].plan} />
                  <InfoRow label="Cycle" value={tenant.subscriptions[0].billingCycle} />
                  <InfoRow label="Status" value={tenant.subscriptions[0].status} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-white/[0.06]">
            <div>
              <h3 className="font-medium">Custom Plan Pricing</h3>
              <p className="text-sm text-surface-400 mt-0.5">
                Override global plan prices for this specific property.
                {!customEnabled && ' Currently using global plan rates.'}
              </p>
            </div>
            <button onClick={toggleCustomPricing} className="shrink-0">
              {customEnabled
                ? <ToggleRight className="w-10 h-10 text-primary-400" />
                : <ToggleLeft className="w-10 h-10 text-surface-600" />
              }
            </button>
          </div>

          {customEnabled && customPricing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {plans.map((plan) => {
                  const Icon = PLAN_ICONS[plan.code] || Zap;
                  const color = PLAN_COLORS[plan.code] || 'text-surface-400';
                  const cp = customPricing[plan.code] || {};
                  const globalRef = plan;

                  return (
                    <div key={plan.id} className="rounded-2xl border border-white/[0.06] bg-surface-800/30 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <h3 className="font-display font-bold">{plan.name}</h3>
                        {plan.code === 'free' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-700 text-surface-300 uppercase tracking-wider">
                            Always Free
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <PriceField label="Monthly Price (₹)" value={cp.monthlyPrice ?? globalRef.actualPrice}
                          globalValue={globalRef.actualPrice}
                          onChange={(v) => updateCustomPrice(plan.code, 'monthlyPrice', v)} />
                        <PriceField label="Discounted Price (₹)" value={cp.discountedPrice ?? globalRef.discountMonthly}
                          globalValue={globalRef.discountMonthly}
                          onChange={(v) => updateCustomPrice(plan.code, 'discountedPrice', v)} />
                        <PriceField label="Yearly Price (₹/month)" value={cp.yearlyPrice ?? globalRef.discountYearly}
                          globalValue={globalRef.discountYearly}
                          onChange={(v) => updateCustomPrice(plan.code, 'yearlyPrice', v)} />
                        <PriceField label="Free Trial (days)" value={cp.trialDays ?? 14}
                          onChange={(v) => updateCustomPrice(plan.code, 'trialDays', v)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveCustomPricing} disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Custom Pricing
                </button>
              </div>
            </>
          )}

          {!customEnabled && (
            <div className="text-center py-12 text-surface-400">
              <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Custom pricing is disabled for this property.</p>
              <p className="text-sm mt-1">Global plan rates are being used. Enable the toggle above to set custom prices.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-surface-400">{label}</span>
      <span className="text-sm font-medium text-white capitalize">{value}</span>
    </div>
  );
}

function PriceField({ label, value, globalValue, onChange }: {
  label: string; value: number; globalValue?: number;
  onChange: (v: number) => void;
}) {
  const isModified = globalValue !== undefined && value !== globalValue;
  return (
    <div>
      <label className="flex items-center justify-between text-xs font-medium text-surface-400 mb-1">
        {label}
        {isModified && (
          <span className="text-amber-400 text-[10px]">Modified (global: ₹{globalValue?.toLocaleString('en-IN')})</span>
        )}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
        min={0}
      />
    </div>
  );
}
