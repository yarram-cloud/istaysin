'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, RotateCcw, Save, Loader2, IndianRupee,
  AlertTriangle, Zap, Crown, Rocket, Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { platformApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface GstSlab { maxRate: number; gstPercent: number; label: string; }
interface SaasPlan {
  id: string; code: string; name: string; description?: string;
  actualPrice: number; discountMonthly: number; discountYearly: number;
  features: string[]; isActive: boolean;
}

// Plan visual config
const PLAN_THEME: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  free:         { color: 'text-surface-400', bg: 'bg-surface-800/60',   border: 'border-surface-700', icon: Gift },
  basic:        { color: 'text-emerald-400', bg: 'bg-emerald-500/10',   border: 'border-emerald-500/20', icon: Zap },
  professional: { color: 'text-blue-400',    bg: 'bg-blue-500/10',      border: 'border-blue-500/20', icon: Rocket },
  enterprise:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',     border: 'border-amber-500/20', icon: Crown },
};

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'gst'>('plans');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Platform Settings</h1>
        <p className="text-surface-400">Global configuration for the iStays platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-800/50 border border-white/[0.06] w-fit">
        {[
          { id: 'plans' as const, label: 'Plan Pricing & Trials' },
          { id: 'gst' as const, label: 'GST Tax Slabs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && <PlanConfigSection />}
      {activeTab === 'gst' && <GstSlabsSection />}
    </div>
  );
}

// ── Plan Config Section ────────────────────────────────────────────────────

function PlanConfigSection() {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original, setOriginal] = useState<SaasPlan[]>([]);

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
        id: p.id,
        name: p.name,
        actualPrice: Number(p.actualPrice),
        discountMonthly: Number(p.discountMonthly),
        discountYearly: Number(p.discountYearly),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with save */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold">Plan Pricing & Trials</h2>
          <p className="text-sm text-surface-400">Configure monthly pricing, discounted rates, and free trial durations for each plan.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">You have unsaved changes.</p>
          <button onClick={() => { setPlans(JSON.parse(JSON.stringify(original))); setHasChanges(false); }}
            className="text-xs text-surface-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/[0.08]">
            Discard
          </button>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((plan, idx) => {
          const theme = PLAN_THEME[plan.code] || PLAN_THEME.basic;
          const Icon = theme.icon;
          const discountPct = plan.actualPrice > 0 && plan.discountMonthly < plan.actualPrice
            ? Math.round((1 - plan.discountMonthly / plan.actualPrice) * 100)
            : 0;
          const yearlySavings = plan.discountMonthly > 0 && plan.discountYearly < plan.discountMonthly
            ? Math.round((1 - plan.discountYearly / plan.discountMonthly) * 100)
            : 0;

          return (
            <div key={plan.id} className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 space-y-4`}>
              {/* Plan Header */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${theme.bg} border ${theme.border} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${theme.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                {plan.code === 'free' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-700 text-surface-300 uppercase tracking-wider">
                    Always Free
                  </span>
                )}
              </div>

              {/* Price Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={plan.actualPrice}
                    onChange={(e) => updatePlan(idx, 'actualPrice', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Discounted Price (₹)</label>
                  <input
                    type="number"
                    value={plan.discountMonthly}
                    onChange={(e) => updatePlan(idx, 'discountMonthly', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                    min={0}
                  />
                  {discountPct > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">{discountPct}% discount</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Yearly Price (₹/month)</label>
                  <input
                    type="number"
                    value={plan.discountYearly}
                    onChange={(e) => updatePlan(idx, 'discountYearly', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
                    min={0}
                  />
                  {yearlySavings > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">{yearlySavings}% yearly savings</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GST Slabs Section ──────────────────────────────────────────────────────

function GstSlabsSection() {
  const [slabs, setSlabs] = useState<GstSlab[]>([]);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
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
      if (i > 0 && slabs[i].maxRate <= slabs[i - 1].maxRate) { toast.error(`Slab ${i + 1}: Max rate must be greater than slab ${i}`); return; }
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
        toast.success('Reset to defaults');
        setSlabs(data.data.slabs);
        setOriginalSlabs(data.data.slabs);
        setIsDefault(true);
        setHasChanges(false);
      }
    } catch { toast.error('Failed to reset'); }
    finally { setResetting(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">GST Slabs — Hotel Room Tariffs</h2>
            <p className="text-sm text-surface-400">
              Configure tax rates based on per-night room tariff.
              {isDefault && !hasChanges && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Government Defaults
                </span>
              )}
              {!isDefault && !hasChanges && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Custom
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} disabled={resetting || isDefault}
            className="flex items-center gap-2 text-sm text-surface-400 hover:text-white px-3 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reset
          </button>
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
        <strong>How it works:</strong> Each slab defines the GST rate for rooms with tariff
        <strong> up to</strong> the max rate. Applies across <strong>all properties</strong>.
      </div>

      {/* Slabs */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Slab Range</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Max Rate (₹)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">GST %</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Label</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {slabs.map((slab, index) => {
                const prevMax = index > 0 ? slabs[index - 1].maxRate : 0;
                const isLast = index === slabs.length - 1;
                return (
                  <tr key={index} className="group hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-surface-400">
                        ₹{prevMax.toLocaleString('en-IN')} → {isLast && slab.maxRate >= 9999999 ? '∞' : `₹${slab.maxRate.toLocaleString('en-IN')}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={slab.maxRate} onChange={(e) => updateSlab(index, 'maxRate', e.target.value)}
                        className="w-32 px-3 py-1.5 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none" min={1} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={slab.gstPercent} onChange={(e) => updateSlab(index, 'gstPercent', e.target.value)}
                        className="w-20 px-3 py-1.5 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none" min={0} max={100} step={0.5} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={slab.label} onChange={(e) => updateSlab(index, 'label', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface-900 border border-white/[0.08] text-white text-sm focus:border-primary-500 focus:outline-none"
                        placeholder={slab.gstPercent === 0 ? 'Exempt' : `${slab.gstPercent}% GST`} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeSlab(index)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-surface-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.04]">
          <button onClick={addSlab} className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
            <Plus className="w-4 h-4" /> Add GST Slab
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">Unsaved changes.</p>
          <button onClick={() => { setSlabs([...originalSlabs]); setHasChanges(false); }}
            className="text-xs text-surface-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/[0.08]">
            Discard
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="rounded-2xl border border-white/[0.06] p-5">
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">Tax Preview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[500, 2500, 5000, 7500, 10000, 25000].map((rate) => {
            let gstPct = 0;
            for (const s of slabs) { if (rate <= s.maxRate) { gstPct = s.gstPercent; break; } }
            const gstAmt = Math.round(rate * gstPct / 100);
            return (
              <div key={rate} className="p-3 rounded-xl bg-surface-800/50 border border-white/[0.04] text-center">
                <p className="text-xs text-surface-400 mb-1">₹{rate.toLocaleString('en-IN')}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  gstPct === 0 ? 'bg-emerald-500/10 text-emerald-400' : gstPct <= 12 ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                }`}>{gstPct}%</span>
                <p className="text-sm font-bold text-white mt-1">₹{(rate + gstAmt).toLocaleString('en-IN')}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
