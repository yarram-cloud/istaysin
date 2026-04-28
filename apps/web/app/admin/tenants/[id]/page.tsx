'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Users, BedDouble, CalendarDays,
  Save, Loader2, IndianRupee, Crown, Zap, Rocket, Gift,
  ToggleLeft, ToggleRight, ExternalLink, ArrowRight, Sparkles, AlertTriangle,
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

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const { id: tenantId } = params;
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [customPricing, setCustomPricing] = useState<CustomPricing | null>(null);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing'>('overview');
  const [planDraft, setPlanDraft] = useState<string>('');
  const [changingPlan, setChangingPlan] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  function viewAsTenant() {
    if (!tenant) return;
    // Pass the tenant ID as a URL param — no localStorage mutation needed.
    // The dashboard layout reads this param and fetches tenant data via the admin token.
    window.open(`/dashboard?admin_preview=${tenant.id}`, '_blank');
  }

  const fetchData = useCallback(async () => {
    try {
      const [tenantRes, plansRes, pricingRes] = await Promise.all([
        platformApi.getTenantDetail(tenantId),
        platformApi.getPlans(),
        platformApi.getTenantCustomPricing(tenantId),
      ]);

      if (tenantRes.success) {
        setTenant(tenantRes.data);
        setPlanDraft(tenantRes.data.plan || '');
      }
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

  async function performPlanChange(nextPlan: string) {
    if (!tenant) return;
    setChangingPlan(true);
    try {
      const res = await platformApi.updateTenantPlan(tenantId, nextPlan);
      if (res.success) {
        toast.success(res.message || `Plan changed to ${nextPlan}`);
        await fetchData();
      } else {
        toast.error(res.error || 'Failed to change plan');
        setPlanDraft(tenant.plan);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change plan');
      setPlanDraft(tenant.plan);
    } finally {
      setChangingPlan(false);
    }
  }

  function handleChangePlan() {
    if (!tenant || !planDraft || planDraft === tenant.plan || changingPlan) return;
    setShowPlanModal(true);
  }

  async function confirmPlanChange() {
    setShowPlanModal(false);
    await performPlanChange(planDraft);
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

  const planBg: Record<string, string> = {
    free: 'from-surface-700/60 to-surface-800/40 border-surface-600/30',
    basic: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/25',
    professional: 'from-blue-500/20 to-blue-600/5 border-blue-500/25',
    enterprise: 'from-amber-500/20 to-amber-600/5 border-amber-500/25',
  };

  return (
    <div className="space-y-5 max-w-5xl pb-10">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <button onClick={() => router.push('/admin/tenants')}
        className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        All Properties
      </button>

      {/* Header card */}
      <div className={`rounded-2xl border bg-gradient-to-br p-5 sm:p-6 ${planBg[tenant.plan] || planBg.free}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/30 border border-white/[0.10] flex items-center justify-center shrink-0">
              {(() => { const I = PLAN_ICONS[tenant.plan] || Building2; return <I className={`w-7 h-7 ${PLAN_COLORS[tenant.plan] || 'text-surface-400'}`} />; })()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">{tenant.name}</h1>
              <p className="text-sm text-white/40 mt-0.5 font-mono">{tenant.slug}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${statusColors[tenant.status] || ''}`}>
                  {tenant.status.replace(/_/g, ' ')}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold capitalize ${
                  tenant.plan === 'enterprise' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  tenant.plan === 'professional' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                  tenant.plan === 'basic' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  'bg-surface-700/80 text-surface-400 border-surface-600/40'
                }`}>{tenant.plan}</span>
                <span className="text-xs text-white/30 capitalize">{tenant.propertyType}</span>
              </div>
            </div>
          </div>
          <button onClick={viewAsTenant}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/50 text-emerald-300 text-sm font-semibold border border-emerald-500/25 hover:border-emerald-500/40 transition-all shrink-0 self-start">
            <ExternalLink className="w-4 h-4" /> Preview Dashboard
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-900/80 border border-white/[0.06] w-fit">
        {[{ id: 'overview' as const, label: 'Overview' }, { id: 'pricing' as const, label: 'Custom Pricing' }].map((tab) => (
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
          {/* Subscription Plan — admin can change tier */}
          {(() => {
            const CurrentIcon = PLAN_ICONS[tenant.plan] || Sparkles;
            const currentColor = PLAN_COLORS[tenant.plan] || 'text-surface-300';
            const dirty = planDraft !== '' && planDraft !== tenant.plan;
            return (
              <div className="rounded-2xl border border-white/[0.06] bg-surface-800/30 p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl bg-surface-900/80 border border-white/[0.06] flex items-center justify-center shrink-0 ${currentColor}`}>
                      <CurrentIcon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Subscription Plan</h3>
                      <p className="text-2xl font-display font-bold text-white capitalize">{tenant.plan || 'free'}</p>
                      <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                        Plan controls feature limits and billing tier. Changes apply immediately and are mirrored onto the active subscription record.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full lg:w-auto">
                    <label htmlFor="plan-select" className="sr-only">Change plan</label>
                    <select
                      id="plan-select"
                      value={planDraft}
                      onChange={(e) => setPlanDraft(e.target.value)}
                      disabled={changingPlan || plans.length === 0}
                      className="min-h-[44px] w-full sm:w-64 px-3 py-2 rounded-xl bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {plans.length === 0 && <option value="">Loading plans…</option>}
                      {plans.map(p => (
                        <option key={p.code} value={p.code}>
                          {p.name} {p.actualPrice > 0 ? `· ₹${p.actualPrice.toLocaleString('en-IN')}/mo` : '· Free'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleChangePlan}
                      disabled={!dirty || changingPlan}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      {changingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {changingPlan ? 'Changing…' : 'Change Plan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Stats Grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Rooms',      value: tenant._count.rooms,       icon: BedDouble,    bg: 'from-blue-500/20 to-blue-600/5',      border: 'border-blue-500/20',    color: 'text-blue-400' },
              { label: 'Room Types', value: tenant._count.roomTypes,   icon: Building2,    bg: 'from-violet-500/20 to-violet-600/5',  border: 'border-violet-500/20',  color: 'text-violet-400' },
              { label: 'Floors',     value: tenant._count.floors,      icon: Building2,    bg: 'from-cyan-500/20 to-cyan-600/5',      border: 'border-cyan-500/20',    color: 'text-cyan-400' },
              { label: 'Bookings',   value: tenant._count.bookings,    icon: CalendarDays, bg: 'from-emerald-500/20 to-emerald-600/5',border: 'border-emerald-500/20', color: 'text-emerald-400' },
              { label: 'Staff',      value: tenant._count.memberships, icon: Users,        bg: 'from-amber-500/20 to-amber-600/5',    border: 'border-amber-500/20',   color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className={`p-4 rounded-2xl border bg-gradient-to-br ${s.bg} ${s.border}`}>
                <div className={`w-8 h-8 rounded-xl bg-black/20 border border-white/[0.06] flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-display font-black text-white">{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Info Grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Info */}
            <div className="rounded-2xl border border-white/[0.08] bg-surface-900/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest">Property Info</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <InfoRow label="Type"       value={tenant.propertyType} />
                <InfoRow label="Location"   value={[tenant.city, tenant.state].filter(Boolean).join(', ') || '—'} />
                <InfoRow label="Phone"      value={tenant.contactPhone || '—'} />
                <InfoRow label="Email"      value={tenant.contactEmail || '—'} />
                <InfoRow label="GSTIN"      value={tenant.gstNumber || '—'} />
                <InfoRow label="Registered" value={new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
              </div>
            </div>

            {/* Owner + Subscription */}
            <div className="rounded-2xl border border-white/[0.08] bg-surface-900/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest">Owner</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <InfoRow label="Name"  value={tenant.owner.fullName} />
                <InfoRow label="Email" value={tenant.owner.email} />
                <InfoRow label="Phone" value={tenant.owner.phone || '—'} />
              </div>
              {tenant.subscriptions.length > 0 && (
                <>
                  <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                    <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest">Active Subscription</h3>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <InfoRow label="Plan"   value={tenant.subscriptions[0].plan} />
                    <InfoRow label="Cycle"  value={tenant.subscriptions[0].billingCycle} />
                    <InfoRow label="Status" value={tenant.subscriptions[0].status} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-surface-900/60 border border-white/[0.08]">
            <div>
              <h3 className="font-semibold text-white">Custom Plan Pricing</h3>
              <p className="text-sm text-surface-500 mt-0.5">
                Override global prices for this property.
                {!customEnabled && ' Using global plan rates.'}
              </p>
            </div>
            <button onClick={toggleCustomPricing} className="shrink-0 ml-4">
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

      {/* ── Plan Change Confirmation Modal ───────────────────────────────────── */}
      {showPlanModal && tenant && (() => {
        const fromPlan = plans.find(p => p.code === tenant.plan);
        const toPlan   = plans.find(p => p.code === planDraft);
        const FromIcon = PLAN_ICONS[tenant.plan] || Gift;
        const ToIcon   = PLAN_ICONS[planDraft]   || Gift;
        const fromColor = PLAN_COLORS[tenant.plan]   || 'text-surface-400';
        const toColor   = PLAN_COLORS[planDraft]     || 'text-surface-400';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-surface-900/95 backdrop-blur shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Change Subscription Plan</h2>
                    <p className="text-xs text-surface-500">For {tenant.name}</p>
                  </div>
                </div>
              </div>

              {/* Plan Comparison */}
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-4">
                  {/* From */}
                  <div className="flex-1 p-4 rounded-xl bg-surface-800/60 border border-white/[0.06] text-center">
                    <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-2">Current</p>
                    <FromIcon className={`w-6 h-6 ${fromColor} mx-auto mb-1.5`} />
                    <p className={`text-base font-bold capitalize ${fromColor}`}>
                      {fromPlan?.name || tenant.plan}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-primary-500/15 border border-primary-500/25 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary-400" />
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex-1 p-4 rounded-xl bg-surface-800/60 border border-primary-500/25 text-center ring-1 ring-primary-500/20">
                    <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-2">New Plan</p>
                    <ToIcon className={`w-6 h-6 ${toColor} mx-auto mb-1.5`} />
                    <p className={`text-base font-bold capitalize ${toColor}`}>
                      {toPlan?.name || planDraft}
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Feature limits and billing tier will update <strong className="text-amber-300">immediately</strong>.
                    Any active subscription record will be re-tagged with the new plan code.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowPlanModal(false); setPlanDraft(tenant.plan); }}
                  disabled={changingPlan}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.05] disabled:opacity-40 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlanChange}
                  disabled={changingPlan}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:opacity-90 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all"
                >
                  {changingPlan
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                    : <><Crown className="w-4 h-4" /> Confirm Change</>
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <span className="text-sm text-surface-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-white text-right capitalize break-all">{value}</span>
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
