'use client';

import { useState } from 'react';
import { roomsApi } from '@/lib/api';
import { BedDouble, ArrowLeft, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewRoomTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxOccupancy: 2,
    baseRate: 0,
    pricingUnit: 'nightly',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');
    if (formData.baseRate < 0) return toast.error('Base rate cannot be negative');
    
    setLoading(true);
    try {
      await roomsApi.createRoomType(formData);
      toast.success('Room type created successfully');
      router.push('/dashboard/settings/room-types');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room type');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <BedDouble className="w-7 h-7 text-primary-600" />
            Add New Room Type
          </h1>
          <p className="text-surface-500 mt-1">Configure pricing, capacity, and details for this category.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form id="roomTypeForm" onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 sm:p-8 space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-surface-900 border-b border-surface-100 pb-2">Basic Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Room Type Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full form-input"
                  placeholder="e.g. Deluxe Suite, Premium King"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full form-textarea h-24"
                  placeholder="Briefly describe the key features of this room type..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-surface-900 border-b border-surface-100 pb-2 mt-6">Capacity & Pricing</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Max Occupancy</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxOccupancy}
                    onChange={e => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) || 1 })}
                    className="w-full form-input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Base Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.baseRate}
                    onChange={e => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Pricing Unit</label>
                  <select 
                    value={formData.pricingUnit}
                    onChange={e => setFormData({ ...formData, pricingUnit: e.target.value })}
                    className="w-full form-select"
                  >
                    <option value="nightly">Per Night</option>
                    <option value="monthly">Per Month</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-700 bg-surface-50 hover:bg-surface-100 border border-surface-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Room Type
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-50 border border-surface-200 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-xl flex items-center justify-center mx-auto mb-4 border border-surface-200 border-dashed">
              <ImageIcon className="w-6 h-6 text-surface-400" />
            </div>
            <h4 className="text-sm font-semibold text-surface-900 mb-2">Photo Gallery</h4>
            <p className="text-xs text-surface-500 mb-4">You can upload photos for this room type after creating it.</p>
            <button disabled className="w-full py-2 bg-surface-200 text-surface-500 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed">
              Save to upload photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
