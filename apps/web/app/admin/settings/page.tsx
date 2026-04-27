'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, RotateCcw, Save, Loader2, IndianRupee,
  AlertTriangle, Zap, Crown, Rocket, Gift, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { platformApi } from '@/lib/api';

interface GstSlab { maxRate: number; gstPercent: number; label: string; }
interface SaasPlan {
  id: string; code: string; name: string; description?: string;
  actualPrice: number; discountMonthly: number; discountYearly: number;
  features: string[]; isActive: boolean;
}

const PLAN_THEME: Record<string, {
  color: string; border: string; bg: string; glow: string;
  icon: React.ElementType; badge: string;
}> = {
  free:         { color: 'text-slate-300',   border: 'border-slate-600/40',   bg: 'from-slate-800/80 to-slate-900/60',     glow: '',                          icon: Gift,   badge: 'bg-slate-700 text-slate-300' },
  basic:        { color: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'from-emerald-950/80 to-emerald-900/20', glow: 'shadow-emerald-500/5',      icon: Zap,    badge: 'bg-emerald-500/20 text-emerald-300' },
  professional: { color: 'text-blue-300',    border: 'border-blue-500/30',    bg: 'from-blue-950/80 to-blue-900/20',       glow: 'shadow-blue-500/5',         icon: Rocket, badge: 'bg-blue-500/20 text-blue-300' },
  enterprise:   { color: 'text-amber-300',   border: 'border-amber-500/30',   bg: 'from-amber-950/60 to-amber-900/10',     glow: 'shadow-amber-500/5',        icon: Crown,  badge: 'bg-amber-500/20 text-amber-300' },
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'gst'>('plans');

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Platform Settings
        </h1>
        <p className="text-surface-400 text-sm mt-1.5">
          Global configuration for the iStays platform
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1.5 rounded-2xl bg-surface-900/80 border border-white/[0.06] w-fit backdrop-blur">
        {[
          { id: 'plans' as const, label: 'Plan Pricing & Trials', icon: Zap },
          { id: 'gst'   as const, label: 'GST Tax Slabs',         icon: IndianRupee },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-surface-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && <PlanConfigSection />}
      {activeTab === 'gst'   && <GstSlabsSection />}
    </div>
  );
}

// ── Plan Config Section ───────────────────────────────────────────────────────

function PlanConfigSection() {
  const [plans, setPlans]         = useState<SaasPlan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original, setOriginal]   = useState<SaasPlan[]>([]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await platformApi.getPlans();
      if (res.success) {
        setPlans(res.data);
        setOriginal(JSON.parse(JSON.stringify(res.data)));
        setHasChanges(false);
      }
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  function updatePlan(index: number, field: string, value: any) {
    const updated = [...plans];
    (updated[index] as any)[field] = value;
    setPlans(updated);
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = plans.map((p) => ({
        id: p.id, name: p.name,
        actualPrice:     Number(p.actualPrice),
        discountMonthly: Number(p.discountMonthly),
        discountYearly:  Number(p.discountYearly),
        features: p.features,
      }));
      const res = await platformApi.updatePlansBulk(payload);
      if (res.success) {
        toast.success('Plan pricing saved successfully!');
        setOriginal(JSON.parse(JSON.stringify(plans)));
        setHasChanges(false);
      } else {
        toast.error(res.error || 'Failed to save');
      }
    } catch { toast.error('Failed to save plans'); }
    finally { setSaving(false); }
  }

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Plan Pricing & Trials</h2>
          <p className="text-sm text-surface-400 mt-0.5">
            Configure monthly pricing, discounted rates, and free trial durations for each plan.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Unsaved warning */}
      {hasChanges && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">You have unsaved changes.</p>
          <button
            onClick={() => { setPlans(JSON.parse(JSON.stringify(original))); setHasChanges(false); }}
            className="text-xs text-surface-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
          >
            Discard
          </button>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((plan, idx) => {
          const theme = PLAN_THEME[plan.code] || PLAN_THEME.basic;
          const Icon = theme.icon;
          const discountPct = plan.actualPrice > 0 && plan.discountMonthly < plan.actualPrice
            ? Math.round((1 - plan.discountMonthly / plan.actualPrice) * 100) : 0;
          const yearlySavings = plan.discountMonthly > 0 && plan.discountYearly < plan.discountMonthly
            ? Math.round((1 - plan.discountYearly / plan.discountMonthly) * 100) : 0;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.bg} p-5 space-y-5 shadow-xl ${theme.glow}`}
            >
              {/* Plan header */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-black/30 border ${theme.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${theme.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-lg text-white leading-tight">{plan.name}</h3>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.badge}`}>
                    {plan.code === 'free' ? 'Always Free' : plan.code}
                  </span>
                </div>
                {plan.code !== 'free' && discountPct > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    −{discountPct}% off
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* Price Fields */}
              <div className="space-y-4">
                <PriceField
                  label="Monthly Price (₹)"
                  value={plan.actualPrice}
                  onChange={(v) => updatePlan(idx, 'actualPrice', v)}
                  disabled={plan.code === 'free'}
                  hint={plan.code === 'free' ? 'Always ₹0' : undefined}
                />
                <PriceField
                  label="Discounted / Offer Price (₹)"
                  value={plan.discountMonthly}
                  onChange={(v) => updatePlan(idx, 'discountMonthly', v)}
                  disabled={plan.code === 'free'}
                  hint={discountPct > 0 ? `${discountPct}% off list price` : undefined}
                  hintColor="text-emerald-400"
                />
                <PriceField
                  label="Yearly Price (₹ / month)"
                  value={plan.discountYearly}
                  onChange={(v) => updatePlan(idx, 'discountYearly', v)}
                  disabled={plan.code === 'free'}
                  hint={yearlySavings > 0 ? `${yearlySavings}% cheaper vs monthly` : undefined}
                  hintColor="text-cyan-400"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriceField({
  label, value, onChange, disabled, hint, hintColor = 'text-surface-500',
}: {
  label: string; value: number; onChange: (v: number) => void;
  disabled?: boolean; hint?: string; hintColor?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm font-medium">₹</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-white text-sm font-mono
            focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/10 focus:outline-none
            disabled:opacity-40 disabled:cursor-not-allowed transition-all placeholder-surface-600"
          min={0}
        />
      </div>
      {hint && <p className={`text-xs mt-1 ${hintColor}`}>{hint}</p>}
    </div>
  );
}

// ── GST Slabs Section ─────────────────────────────────────────────────────────

function GstSlabsSection() {
  const [slabs, setSlabs]           = useState<GstSlab[]>([]);
  const [isDefault, setIsDefault]   = useState(true);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSlabs, setOriginalSlabs] = useState<GstSlab[]>([]);

  const fetchSlabs = useCallback(async () => {
    try {
      const data = await platformApi.getGstSlabs();
      if (data.success) {
        setSlabs(data.data.slabs);
        setOriginalSlabs(data.data.slabs);
        setIsDefault(data.data.isDefault);
        setHasChanges(false);
      }
    } catch { toast.error('Failed to load GST slabs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSlabs(); }, [fetchSlabs]);

  function updateSlab(index: number, field: keyof GstSlab, value: string | number) {
    const updated = [...slabs];
    if (field === 'maxRate' || field === 'gstPercent') {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value as string;
    }
    setSlabs(updated);
    setHasChanges(true);
  }

  function addSlab() {
    const lastMax = slabs.length > 0 ? slabs[slabs.length - 1].maxRate : 0;
    setSlabs([...slabs, { maxRate: lastMax + 5000, gstPercent: 18, label: '' }]);
    setHasChanges(true);
  }

  function removeSlab(index: number) {
    if (slabs.length <= 1) { toast.error('At least one slab is required'); return; }
    setSlabs(slabs.filter((_, i) => i !== index));
    setHasChanges(true);
  }

  async function handleSave() {
    for (let i = 0; i < slabs.length; i++) {
      if (slabs[i].maxRate <= 0) { toast.error(`Slab ${i + 1}: Max rate must be > 0`); return; }
      if (slabs[i].gstPercent < 0 || slabs[i].gstPercent > 100) { toast.error(`Slab ${i + 1}: GST % must be 0–100`); return; }
      if (i > 0 && slabs[i].maxRate <= slabs[i - 1].maxRate) { toast.error(`Slab ${i + 1}: Max rate must exceed slab ${i}`); return; }
    }
    setSaving(true);
    try {
      const data = await platformApi.updateGstSlabs(slabs);
      if (data.success) {
        toast.success('GST slabs saved!');
        setOriginalSlabs(data.data.slabs);
        setSlabs(data.data.slabs);
        setIsDefault(false);
        setHasChanges(false);
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const data = await platformApi.resetGstSlabs();
      if (data.success) {
        toast.success('Reset to Government defaults');
        setSlabs(data.data.slabs);
        setOriginalSlabs(data.data.slabs);
        setIsDefault(true);
        setHasChanges(false);
      }
    } catch { toast.error('Failed to reset'); }
    finally { setResetting(false); }
  }

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-display font-bold text-white">GST Slabs</h2>
              {isDefault && !hasChanges && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Govt. Defaults
                </span>
              )}
              {!isDefault && !hasChanges && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-wider">
                  Custom
                </span>
              )}
            </div>
            <p className="text-sm text-surface-400 mt-0.5">Configure tax rates based on per-night room tariff</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={resetting || isDefault}
            className="flex items-center gap-2 text-sm text-surface-400 hover:text-white px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
        <span className="text-blue-400 mt-0.5 shrink-0 text-base">ℹ</span>
        <p className="text-sm text-blue-300/90 leading-relaxed">
          <strong className="text-blue-200">How it works:</strong> Each slab defines the GST rate for rooms with tariff{' '}
          <strong className="text-blue-200">up to</strong> the max rate. These rates apply across{' '}
          <strong className="text-blue-200">all properties</strong> on the platform.
        </p>
      </div>

      {/* Slabs Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-surface-900/50 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_100px_1fr_44px] gap-0 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          {['Slab Range', 'Max Rate (₹)', 'GST %', 'Label', ''].map((h) => (
            <span key={h} className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {slabs.map((slab, index) => {
            const prevMax = index > 0 ? slabs[index - 1].maxRate : 0;
            const isLast  = index === slabs.length - 1;
            const gstColor = slab.gstPercent === 0 ? 'text-emerald-400' : slab.gstPercent <= 12 ? 'text-blue-400' : 'text-amber-400';

            return (
              <div
                key={index}
                className="grid grid-cols-[1fr_140px_100px_1fr_44px] gap-0 px-5 py-3.5 items-center group hover:bg-white/[0.02] transition-colors"
              >
                {/* Range label */}
                <span className={`text-xs font-mono ${gstColor} font-semibold`}>
                  ₹{prevMax.toLocaleString('en-IN')} → {isLast && slab.maxRate >= 9999999 ? '∞' : `₹${slab.maxRate.toLocaleString('en-IN')}`}
                </span>

                {/* Max Rate input */}
                <input
                  type="number"
                  value={slab.maxRate}
                  onChange={(e) => updateSlab(index, 'maxRate', e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-white text-sm font-mono focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:outline-none transition-all"
                  min={1}
                />

                {/* GST % input */}
                <input
                  type="number"
                  value={slab.gstPercent}
                  onChange={(e) => updateSlab(index, 'gstPercent', e.target.value)}
                  className="w-16 px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-white text-sm font-mono focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:outline-none transition-all"
                  min={0} max={100} step={0.5}
                />

                {/* Label input */}
                <input
                  type="text"
                  value={slab.label}
                  onChange={(e) => updateSlab(index, 'label', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-white text-sm focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:outline-none transition-all"
                  placeholder={slab.gstPercent === 0 ? 'e.g. Exempt' : `e.g. ${slab.gstPercent}% GST Slab`}
                />

                {/* Delete */}
                <button
                  onClick={() => removeSlab(index)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-600 hover:text-red-400 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add slab */}
        <div className="px-5 py-3.5 border-t border-white/[0.04]">
          <button
            onClick={addSlab}
            className="flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add GST Slab
          </button>
        </div>
      </div>

      {/* Unsaved warning */}
      {hasChanges && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">You have unsaved changes.</p>
          <button
            onClick={() => { setSlabs([...originalSlabs]); setHasChanges(false); }}
            className="text-xs text-surface-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
          >
            Discard
          </button>
        </div>
      )}

      {/* Live Tax Preview */}
      <div className="rounded-2xl border border-white/[0.08] bg-surface-900/40 p-5">
        <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
          Live Tax Preview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[500, 2500, 5000, 7500, 10000, 25000].map((rate) => {
            let gstPct = 0;
            for (const s of slabs) { if (rate <= s.maxRate) { gstPct = s.gstPercent; break; } }
            const gstAmt = Math.round(rate * gstPct / 100);
            const badgeColor = gstPct === 0
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
              : gstPct <= 12
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/20';
            return (
              <div
                key={rate}
                className="p-3.5 rounded-xl bg-black/20 border border-white/[0.06] text-center space-y-1.5"
              >
                <p className="text-xs text-surface-500 font-mono">₹{rate.toLocaleString('en-IN')}</p>
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                  {gstPct}%
                </span>
                <p className="text-sm font-bold text-white tabular-nums">₹{(rate + gstAmt).toLocaleString('en-IN')}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
