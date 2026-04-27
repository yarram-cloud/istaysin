'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Loader2, CalendarRange, Trash2, Edit2, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { pricingApi, roomsApi, tenantsApi } from '@/lib/api';

import SetupNextStepBanner from '@/app/dashboard/_components/setup-next-step-banner';

interface PricingRule {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek: number[];
  roomTypeId?: string;
  adjustmentType: 'percentage' | 'fixed_override' | 'fixed_addition';
  adjustmentValue: number;
  priority: number;
  isActive: boolean;
  roomType?: { name: string };
}

interface RoomType {
  id: string;
  name: string;
}

export default function PricingPage() {
  const t = useTranslations('Dashboard');
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [pricingEnabled, setPricingEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pricingRes, roomsRes, settingsRes] = await Promise.all([
        pricingApi.getRules(),
        roomsApi.getRoomTypes(),
        tenantsApi.getSettings(),
      ]);
      if (pricingRes.success) setRules(pricingRes.data || []);
      if (roomsRes.success) setRoomTypes(roomsRes.data || []);
      if (settingsRes.success && settingsRes.data) {
        setPricingEnabled(settingsRes.data.config?.pricingEnabled !== false);
      }
    } catch (err) {
      console.error('Pricing rules fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Object.assign(window, { pricingApi }); fetchData(); }, [fetchData]);

  function handleDelete(id: string) {
    toast(t('confirmDeleteRule') || 'Are you sure you want to delete this pricing rule?', {
      description: t('actionCannotBeUndone') || 'This action cannot be undone.',
      action: {
        label: t('confirm') || 'Confirm',
        onClick: async () => {
          try {
            await pricingApi.deleteRule(id);
            fetchData();
            toast.success(t('ruleDeleted') || 'Pricing rule deleted');
          } catch (err: any) { toast.error(err.message || t('deleteFailed')); }
        }
      },
      cancel: { label: t('cancel') || 'Cancel', onClick: () => {} }
    });
  }

  async function handleToggleActive(rule: PricingRule) {
    try {
      await pricingApi.updateRule(rule.id, { isActive: !rule.isActive });
      fetchData();
      toast.success(rule.isActive ? (t('rulePaused') || 'Rule paused') : (t('ruleActivated') || 'Rule activated'));
    } catch (err: any) { toast.error(err.message); }
  }

  const formatAdjustment = (type: string, val: number) => {
    if (type === 'percentage') return `${val > 0 ? '+' : ''}${val}%`;
    if (type === 'fixed_addition') return `${val > 0 ? '+' : ''}₹${val}`;
    if (type === 'fixed_override') return `Fixed ₹${val}`;
    return val;
  };

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  async function handleTogglePricing() {
    const newValue = !pricingEnabled;
    setPricingEnabled(newValue);
    setSavingToggle(true);
    try {
      const res = await tenantsApi.getSettings();
      const currentConfig = res.data?.config || {};
      await tenantsApi.updateSettings({
        config: { ...currentConfig, pricingEnabled: newValue }
      });
      toast.success(newValue ? 'Pricing rules enabled.' : 'Pricing rules disabled — base room rates will be used.');
    } catch (err: any) {
      setPricingEnabled(!newValue);
      toast.error(err.message || 'Failed to update setting');
    } finally {
      setSavingToggle(false);
    }
  }

  return (
    <div className="space-y-6">
      <SetupNextStepBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">{t('pricingPage.title')}</h1>
          <p className="text-surface-400">{t('pricingPage.subtitle')}</p>
        </div>
        {pricingEnabled && (
          <button
            onClick={() => { setShowAddModal(!showAddModal); if (showAddModal) setEditingRule(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              showAddModal ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'btn-primary'
            }`}
          >
            <Plus className="w-4 h-4" /> {showAddModal ? t('common.cancel') : t('pricingPage.addRule')}
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200">
        <div>
          <p className="font-medium text-surface-900">Enable Dynamic Pricing Rules</p>
          <p className="text-sm text-surface-500">Turn off if you only use base room-type rates. You can enable this later.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={pricingEnabled} onChange={handleTogglePricing} disabled={savingToggle} />
          <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
        </label>
      </div>

      {!pricingEnabled && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700">
            <strong>Pricing rules disabled.</strong> Your base room-type rates will be used for all bookings. You can enable dynamic pricing anytime.
          </p>
        </div>
      )}

      {pricingEnabled && (
        <>
          {/* Inline Rule Form */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <RuleForm
                  onClose={() => { setShowAddModal(false); setEditingRule(null); }}
                  onSaved={() => { setShowAddModal(false); setEditingRule(null); fetchData(); }}
                  roomTypes={roomTypes}
                  editingRule={editingRule}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 glass-card animate-pulse" />)}
            </div>
          ) : rules.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <TrendingUp className="w-12 h-12 text-surface-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('pricingPage.noRules')}</h3>
              <p className="text-surface-400 mb-6 max-w-sm mx-auto">
                {t('pricingPage.noRulesDesc')}
              </p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary">{t('pricingPage.createFirstRule')}</button>
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <div key={rule.id} className={`glass-card p-5 flex items-center justify-between transition-all ${!rule.isActive ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        {rule.name}
                        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-surface-300">
                          Priority {rule.priority}
                        </span>
                      </h3>
                      
                      <div className="flex flex-wrap text-sm text-surface-400 gap-x-4 gap-y-1 mt-1">
                        {/* Date Range */}
                        {rule.startDate || rule.endDate ? (
                          <span className="flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> 
                            {rule.startDate ? new Date(rule.startDate).toLocaleDateString() : 'Always'} 
                            {' → '} 
                            {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : 'Always'}
                          </span>
                        ) : <span className="flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" /> Ongoing</span>}
                        
                        {/* Days of Week */}
                        {rule.daysOfWeek && rule.daysOfWeek.length > 0 && (
                          <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> {rule.daysOfWeek.map(d => daysMap[d]).join(', ')}</span>
                        )}

                        {/* Applies to Room Type */}
                        <span className="flex items-center gap-1.5 px-2 rounded bg-surface-800 border border-white/[0.04]">
                          {rule.roomType?.name || 'All Room Types'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-400">{formatAdjustment(rule.adjustmentType, rule.adjustmentValue)}</p>
                      <p className="text-xs text-surface-400 uppercase tracking-widest">{rule.adjustmentType.replace('_', ' ')}</p>
                    </div>

                    <div className="h-10 w-px bg-white/[0.08]" />

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleActive(rule)} 
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-surface-800 text-surface-400 border-white/[0.06]'}`}>
                        {rule.isActive ? 'Active' : 'Paused'}
                      </button>
                      <button onClick={() => { setEditingRule(rule); setShowAddModal(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 rounded-lg hover:bg-white/[0.06] text-surface-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-surface-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}

function RuleForm({ onClose, onSaved, roomTypes, editingRule }: { onClose: () => void; onSaved: () => void; roomTypes: RoomType[]; editingRule: PricingRule | null }) {
  const t = useTranslations('Dashboard');
  const [formData, setFormData] = useState({
    name: editingRule?.name || '',
    startDate: editingRule?.startDate ? new Date(editingRule.startDate).toISOString().split('T')[0] : '',
    endDate: editingRule?.endDate ? new Date(editingRule.endDate).toISOString().split('T')[0] : '',
    daysOfWeek: editingRule?.daysOfWeek || [],
    roomTypeId: editingRule?.roomTypeId || '',
    adjustmentType: editingRule?.adjustmentType || 'percentage',
    adjustmentValue: editingRule?.adjustmentValue?.toString() || '',
    priority: editingRule?.priority?.toString() || '0',
    isActive: editingRule ? editingRule.isActive : true,
  });
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) 
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        roomTypeId: formData.roomTypeId || undefined,
        adjustmentValue: parseFloat(formData.adjustmentValue),
        priority: parseInt(formData.priority, 10),
      };

      if (editingRule) {
        await pricingApi.updateRule(editingRule.id, payload);
        toast.success(t('ruleUpdated') || 'Rule updated successfully');
      } else {
        await pricingApi.createRule(payload);
        toast.success(t('ruleCreated') || 'Rule created successfully');
      }
      onSaved();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{ borderTop: '3px solid #166534' }}>
      <div className="sticky top-0 bg-white border-b border-surface-100 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-600" />
          </div>
          <h3 className="font-display text-base font-bold text-surface-900">{editingRule ? 'Edit Rule' : 'New Pricing Rule'}</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Rule Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="e.g. Christmas Pricing, Weekend Surge" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">End Date</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Apply on specific days</label>
            <div className="flex flex-wrap gap-2">
              {daysMap.map((day, idx) => (
                <button type="button" key={day} onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
                    formData.daysOfWeek.includes(idx) ? 'bg-primary-100 text-primary-700 border-primary-300' : 'bg-surface-100 text-surface-500 border-surface-200 hover:bg-surface-200'
                  }`}>{day}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-1.5">If none selected, applies to all days in date range.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Apply to Room Type</label>
            <select value={formData.roomTypeId} onChange={e => setFormData({...formData, roomTypeId: e.target.value})}
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
              <option value="">All Room Types</option>
              {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
            <div className="col-span-2"><h4 className="text-sm font-bold text-surface-800">Rate Adjustment</h4></div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Type</label>
              <select value={formData.adjustmentType} onChange={e => setFormData({...formData, adjustmentType: e.target.value as any})}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="percentage">Percentage (+/- %)</option>
                <option value="fixed_addition">Fixed Amount Addition (+ ₹)</option>
                <option value="fixed_override">Override Fixed Rate (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Amount</label>
              <input required type="number" step="any" value={formData.adjustmentValue} onChange={e => setFormData({...formData, adjustmentValue: e.target.value})}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                placeholder="e.g. 15 or -10" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Priority</label>
              <input required type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                className="h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 w-28 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-surface-700">Rule Active</label>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.isActive ? 'bg-primary-600' : 'bg-surface-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.isActive ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-surface-100">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingRule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
    </div>
  );
}
