'use client';

import { useState, useEffect, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { Key, ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewInventoryRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [floors, setFloors] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    floorId: '',
    roomTypeId: '',
  });

  const fetchDependencies = useCallback(async () => {
    try {
      const [fRes, tRes] = await Promise.all([
        roomsApi.getFloors(),
        roomsApi.getRoomTypes()
      ]);
      if (fRes.success) setFloors(fRes.data || []);
      if (tRes.success) {
        const t = tRes.data || [];
        setTypes(t);
        // Pre-select first options if available to speed up entry
        const updates: Partial<typeof formData> = {};
        if (fRes.data?.[0]) updates.floorId = fRes.data[0].id;
        if (t?.[0]) updates.roomTypeId = t[0].id;
        if (Object.keys(updates).length) {
          setFormData(prev => ({ ...prev, ...updates }));
        }
      }
    } catch (err) {
      toast.error('Failed to load floors or room types');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.roomNumber.trim()) return toast.error('Room number is required');
    if (!formData.floorId) return toast.error('Floor is required');
    if (!formData.roomTypeId) return toast.error('Room type is required');
    
    setLoading(true);
    try {
      await roomsApi.createRoom(formData);
      toast.success('Room created successfully');
      router.push('/dashboard/settings/inventory-rooms');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
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
            <Key className="w-7 h-7 text-primary-600" />
            Add New Room
          </h1>
          <p className="text-surface-500 mt-1">Map a physical room number to its floor and type.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Room Name / Number</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full form-input"
                placeholder="e.g. 101, A-12, Grand Suite 1"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Floor</label>
              <select
                value={formData.floorId}
                onChange={e => setFormData({ ...formData, floorId: e.target.value })}
                className="w-full form-select"
              >
                <option value="" disabled>Select a floor</option>
                {floors.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (Level {f.sortOrder})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Room Type (Category)</label>
              <select
                value={formData.roomTypeId}
                onChange={e => setFormData({ ...formData, roomTypeId: e.target.value })}
                className="w-full form-select"
              >
                <option value="" disabled>Select a room type</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (₹{t.baseRate})</option>
                ))}
              </select>
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
              disabled={loading || !formData.roomNumber.trim() || !formData.floorId || !formData.roomTypeId}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
