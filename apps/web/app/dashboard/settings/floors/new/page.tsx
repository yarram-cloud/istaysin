'use client';

import { useState } from 'react';
import { roomsApi } from '@/lib/api';
import { Layers, ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewFloorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 1,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Floor name is required');
    
    setLoading(true);
    try {
      await roomsApi.createFloor(formData);
      toast.success('Floor created successfully');
      router.push('/dashboard/settings/floors');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create floor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <Layers className="w-7 h-7 text-primary-600" />
            Add New Floor
          </h1>
          <p className="text-surface-500 mt-1">Create a new floor or level for your property.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Floor Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full form-input"
                placeholder="e.g. Ground Floor, 1st Floor, Penthouse"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Sort Order (Level)</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full form-input"
                placeholder="1"
              />
              <p className="text-xs text-surface-400 mt-1.5">Used to logically order floors from bottom to top (e.g. 0 for Ground, 1 for 1st Floor).</p>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-100 flex items-center gap-3">
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
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Floor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
