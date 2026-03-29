'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Loader2, CalendarRange, Trash2, Edit2, TrendingUp, Filter } from 'lucide-react';
import { pricingApi, roomsApi } from '@/lib/api';

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
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pricingRes, roomsRes] = await Promise.all([
        pricingApi.getRules(),
        roomsApi.getRoomTypes()
      ]);
      if (pricingRes.success) setRules(pricingRes.data || []);
      if (roomsRes.success) setRoomTypes(roomsRes.data || []);
    } catch (err) {
      console.error('Pricing rules fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Object.assign(window, { pricingApi }); fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await pricingApi.deleteRule(id);
      fetchData();
    } catch (err: any) { alert(err.message); }
  }

  async function handleToggleActive(rule: PricingRule) {
    try {
      await pricingApi.updateRule(rule.id, { isActive: !rule.isActive });
      fetchData();
    } catch (err: any) { alert(err.message); }
  }

  const formatAdjustment = (type: string, val: number) => {
    if (type === 'percentage') return `${val > 0 ? '+' : ''}${val}%`;
    if (type === 'fixed_addition') return `${val > 0 ? '+' : ''}$${val}`;
    if (type === 'fixed_override') return `Fixed $${val}`;
    return val;
  };

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Revenue Management</h1>
          <p className="text-surface-400">Configure seasonal pricing, weekend surges, and dynamic rules</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 glass-card animate-pulse" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <TrendingUp className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pricing rules</h3>
          <p className="text-surface-400 mb-6 max-w-sm mx-auto">
            Bookings will be charged standard room rates. Add a rule to increase rates on weekends or specific dates.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">Create Your First Rule</button>
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
                  <button onClick={() => { setEditingRule(rule); setShowAddModal(true); }} className="p-2 rounded-lg hover:bg-white/[0.06] text-surface-400 transition-colors">
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

      {showAddModal && (
        <RuleModal 
          onClose={() => { setShowAddModal(false); setEditingRule(null); }} 
          onSaved={() => { setShowAddModal(false); setEditingRule(null); fetchData(); }} 
          roomTypes={roomTypes} 
          editingRule={editingRule} 
        />
      )}
    </div>
  );
}

function RuleModal({ onClose, onSaved, roomTypes, editingRule }: { onClose: () => void; onSaved: () => void; roomTypes: RoomType[]; editingRule: PricingRule | null }) {
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
      } else {
        await pricingApi.createRule(payload);
      }
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-surface-900/90 backdrop-blur border-b border-white/[0.08] px-6 py-5 flex items-center justify-between z-10">
          <h2 className="text-xl font-display font-bold">{editingRule ? 'Edit Rule' : 'New Pricing Rule'}</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Rule Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. Christmas Pricing, Weekend Surge" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Start Date (Optional)</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">End Date (Optional)</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Apply on specific days (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {daysMap.map((day, idx) => (
                <button 
                  type="button" 
                  key={day} 
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                    ${formData.daysOfWeek.includes(idx) ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-surface-800 text-surface-400 border-white/[0.06] hover:bg-white/[0.1]'}`}>
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-500 mt-1.5">If none selected, applies to all days in date range.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Apply to Room Type</label>
            <select value={formData.roomTypeId} onChange={e => setFormData({...formData, roomTypeId: e.target.value})} className="input-field">
              <option value="">All Room Types</option>
              {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
            <div className="col-span-2"><h4 className="text-sm font-bold text-surface-200">Rate Adjustment</h4></div>
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1">Type</label>
              <select value={formData.adjustmentType} onChange={e => setFormData({...formData, adjustmentType: e.target.value as any})} className="input-field">
                <option value="percentage">Percentage (+/- %)</option>
                <option value="fixed_addition">Fixed Amount Addition (+ $)</option>
                <option value="fixed_override">Override Fixed Rate ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1">Amount</label>
              <input required type="number" step="any" value={formData.adjustmentValue} onChange={e => setFormData({...formData, adjustmentValue: e.target.value})} className="input-field" placeholder="e.g. 15 or -10" />
            </div>
            {formData.adjustmentType === 'percentage' && <p className="col-span-2 text-xs text-surface-500">Use negative values to signify discounts (e.g. -15%).</p>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
               <label className="block text-sm font-medium text-surface-300 mb-1">Execution Priority</label>
               <input required type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="input-field max-w-[120px]" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-surface-300">Rule Active</label>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.isActive ? 'bg-primary-500' : 'bg-surface-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.isActive ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-white/[0.08]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingRule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
