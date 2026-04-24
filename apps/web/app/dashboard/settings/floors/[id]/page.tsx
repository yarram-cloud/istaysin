'use client';

import { useState, useEffect, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { Layers, ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function EditFloorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0,
  });

  const fetchFloor = useCallback(async () => {
    try {
      const res = await roomsApi.getFloors();
      if (res.success) {
        const floor = res.data?.find((f: any) => f.id === params.id);
        if (floor) {
          setFormData({
            name: floor.name,
            sortOrder: floor.sortOrder,
          });
        } else {
          toast.error('Floor not found');
          router.push('/dashboard/settings/floors');
        }
      }
    } catch (err) {
      toast.error('Failed to load floor details');
    } finally {
      setInitialLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchFloor();
  }, [fetchFloor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Floor name is required');
    
    setLoading(true);
    try {
      await roomsApi.updateFloor(params.id, formData);
      toast.success('Floor updated successfully');
      router.push('/dashboard/settings/floors');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update floor');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this floor? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await roomsApi.deleteFloor(params.id);
      toast.success('Floor deleted successfully');
      router.push('/dashboard/settings/floors');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete floor. It may have rooms assigned to it.');
    } finally {
      setDeleting(false);
    }
  }

  if (initialLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
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
            Edit Floor
          </h1>
          <p className="text-surface-500 mt-1">Update floor details and reorder.</p>
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
                placeholder="e.g. Ground Floor, First Floor"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Floor Level / Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full form-input"
              />
              <p className="text-xs text-surface-500 mt-1.5">Lower numbers appear first in the hierarchy.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-surface-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>

            <div className="flex items-center gap-3">
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
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
