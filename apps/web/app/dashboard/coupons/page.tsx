'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, X, Trash2, Edit2, Loader2, Calendar, Users, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { couponsApi, roomsApi } from '@/lib/api';
import PlanGate from '@/app/dashboard/_components/plan-gate';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  minBookingAmount: number;
  validFrom: string | null;
  validUntil: string | null;
  applicableRoomTypes: string[];
  isActive: boolean;
  createdAt: string;
}

interface RoomType {
  id: string;
  name: string;
}

export default function CouponsPage() {
  const t = useTranslations('Dashboard');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [couponsRes, roomTypesRes] = await Promise.all([
        couponsApi.list(),
        roomsApi.getRoomTypes()
      ]);
      if (couponsRes.success) setCoupons(couponsRes.data || []);
      if (roomTypesRes.success) setRoomTypes(roomTypesRes.data || []);
    } catch (err) {
      console.error('Fetch failed:', err);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    toast('Delete this coupon?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await couponsApi.delete(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
            toast.success('Coupon deleted successfully');
          } catch (err) {
            toast.error('Failed to delete coupon');
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };


  const toggleStatus = async (coupon: Coupon) => {
    try {
      await couponsApi.patch(coupon.id, { isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <PlanGate requiredPlan="basic" featureName="Coupons & Promotions">
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1 text-surface-900">{t('couponsPage.title')}</h1>
          <p className="text-surface-500">{t('couponsPage.subtitle')}</p>
        </div>
        <button 
          onClick={() => { if (!showAddModal) setEditingCoupon(null); setShowAddModal(!showAddModal); }}
          className={`px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm text-sm ${
            showAddModal ? 'bg-surface-100 text-surface-700 border border-surface-200' : 'bg-primary-700 hover:bg-primary-600 text-white'
          }`}
        >
          <Plus className="w-4 h-4" /> {showAddModal ? t('common.cancel') : t('couponsPage.createCoupon')}
        </button>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <CouponFormInline
              coupon={editingCoupon}
              roomTypes={roomTypes}
              onClose={() => { setShowAddModal(false); setEditingCoupon(null); }}
              onSaved={() => { setShowAddModal(false); setEditingCoupon(null); fetchData(); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">{t('couponsPage.noCoupons')}</h3>
          <p className="text-surface-500 mb-6">{t('couponsPage.noCouponsDesc')}</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-700 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.id} className={`bg-white rounded-2xl border ${coupon.isActive ? 'border-surface-200 shadow-sm' : 'border-surface-100 bg-surface-50 opacity-75'} transition-all overflow-hidden relative group`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-200 text-surface-600'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingCoupon(coupon); setShowAddModal(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleStatus(coupon)}
                      className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
                    >
                      {coupon.isActive ? <X className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-2xl font-mono font-bold text-surface-900">{coupon.code}</h3>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Copied to clipboard'); }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Copy
                  </button>
                </div>
                
                <p className="text-3xl font-display font-black text-primary-700 mb-4">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  <span className="text-sm font-medium text-surface-500 ml-1">OFF</span>
                </p>

                <div className="space-y-2 border-t border-surface-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500 flex items-center gap-1.5"><Users className="w-4 h-4" /> Redemption</span>
                    <span className="font-semibold text-surface-900">{coupon.currentUses} / {coupon.maxUses || '∞'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Valid Till</span>
                    <span className={`font-semibold ${coupon.validUntil && new Date(coupon.validUntil) < new Date() ? 'text-red-500' : 'text-surface-900'}`}>
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}
                    </span>
                  </div>
                </div>
              </div>
              
              {!coupon.isActive && (
                <div className="absolute inset-0 bg-white/40 backdrop-grayscale pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
    </PlanGate>
  );
}

function CouponFormInline({ coupon, roomTypes, onClose, onSaved }: { 
  coupon: Coupon | null; roomTypes: RoomType[]; onClose: () => void; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue?.toString() || '',
    maxUses: coupon?.maxUses?.toString() || '',
    minBookingAmount: coupon?.minBookingAmount?.toString() || '0',
    validFrom: coupon?.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
    validUntil: coupon?.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
    applicableRoomTypes: coupon?.applicableRoomTypes || [],
    isActive: coupon?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error('Code and Value are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: parseFloat(formData.discountValue),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        minBookingAmount: parseFloat(formData.minBookingAmount || '0'),
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
      };

      if (coupon) {
        await couponsApi.patch(coupon.id, payload);
        toast.success('Coupon updated');
      } else {
        await couponsApi.create(payload);
        toast.success('Coupon created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{ borderTop: '3px solid #166534' }}>
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-primary-600" />
          </div>
          <h3 className="font-display text-base font-bold text-surface-900">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  value={formData.code} 
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SUMMER25" 
                  className="input-field flex-1 font-mono uppercase" 
                  maxLength={50}
                />
                <button type="button" onClick={generateCode} className="btn-secondary text-xs px-4">Generate</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Discount Type</label>
              <select 
                value={formData.discountType}
                onChange={e => setFormData(p => ({ ...p, discountType: e.target.value as any }))}
                className="input-field"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Value</label>
              <input 
                type="number" 
                value={formData.discountValue}
                onChange={e => setFormData(p => ({ ...p, discountValue: e.target.value }))}
                placeholder={formData.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                className="input-field"
              />
            </div>

            <div className="col-span-2 bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
              <p className="text-xs text-primary-800 leading-relaxed">
                {formData.discountType === 'percentage' 
                  ? `Guests will get ${formData.discountValue || '0'}% off on their total booking amount.`
                  : `Guests will get a flat discount of ₹${formData.discountValue || '0'} on their total booking amount.`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Max redemptions</label>
              <input 
                type="number"
                value={formData.maxUses}
                onChange={e => setFormData(p => ({ ...p, maxUses: e.target.value }))}
                placeholder="Leave blank for unlimited"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Min Booking amount</label>
              <input 
                type="number"
                value={formData.minBookingAmount}
                onChange={e => setFormData(p => ({ ...p, minBookingAmount: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Valid From</label>
              <input 
                type="date"
                value={formData.validFrom}
                onChange={e => setFormData(p => ({ ...p, validFrom: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Valid Until (Expiry)</label>
              <input 
                type="date"
                value={formData.validUntil}
                onChange={e => setFormData(p => ({ ...p, validUntil: e.target.value }))}
                className="input-field"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1.5 uppercase tracking-wide text-[11px]">Applicable Room Types</label>
              <div className="grid grid-cols-2 gap-2 p-4 border border-surface-200 rounded-xl bg-surface-50 max-h-40 overflow-y-auto no-scrollbar">
                {roomTypes.map(rt => (
                  <label key={rt.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary-600 transition-colors">
                    <input 
                      type="checkbox"
                      checked={formData.applicableRoomTypes.includes(rt.id)}
                      onChange={e => {
                        const newTypes = e.target.checked 
                          ? [...formData.applicableRoomTypes, rt.id]
                          : formData.applicableRoomTypes.filter(id => id !== rt.id);
                        setFormData(p => ({ ...p, applicableRoomTypes: newTypes }));
                      }}
                      className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    {rt.name}
                  </label>
                ))}
                {roomTypes.length === 0 && <p className="col-span-2 text-xs text-surface-500 text-center italic">No room types found</p>}
              </div>
              <p className="text-[10px] text-surface-500 mt-2 italic">Leave all unchecked to apply to all room types.</p>
            </div>
            
            <div className="col-span-2">
               <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-surface-200 hover:bg-surface-50 transition-all">
                  <input 
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-surface-700">Display and allow redemption of this coupon</span>
               </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-surface-100">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary-700 hover:bg-primary-600 text-white flex-1 h-10 flex items-center justify-center gap-2 rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {coupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
    </div>
  );
}
