'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { Layers, Plus, Pencil, Trash2, ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Floor {
  id: string;
  name: string;
  sortOrder: number;
}

export default function FloorsSettingsPage() {
  const router = useRouter();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Quick edit state for inline editing since Floor schema is so minimal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSort, setEditSort] = useState(0);

  const fetchFloors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roomsApi.getFloors();
      if (res.success) {
        setFloors(res.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load floors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this floor?')) return;
    try {
      setIsDeleting(id);
      await roomsApi.deleteFloor(id);
      setFloors(prev => prev.filter(f => f.id !== id));
      toast.success('Floor deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete floor');
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    try {
      await roomsApi.updateFloor(editingId, { name: editName, sortOrder: editSort });
      setFloors(prev => prev.map(f => f.id === editingId ? { ...f, name: editName, sortOrder: editSort } : f));
      toast.success('Floor updated');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update floor');
    }
  }

  function startEdit(floor: Floor) {
    setEditingId(floor.id);
    setEditName(floor.name);
    setEditSort(floor.sortOrder);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/settings')} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <Layers className="w-7 h-7 text-primary-600" />
            Manage Floors
          </h1>
          <p className="text-surface-500 mt-1">Configure the physical layout levels of your property.</p>
        </div>
        
        <Link href="/dashboard/settings/floors/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Floor
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
        {floors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-surface-300" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-1">No floors configured</h3>
            <p className="text-surface-500 mb-6">Create your first floor to start mapping out your property.</p>
            <Link href="/dashboard/settings/floors/new" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-900 text-white rounded-xl text-sm font-medium hover:bg-surface-800 transition-colors">
              <Plus className="w-4 h-4" /> Create First Floor
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 font-medium">Floor Name</th>
                <th className="px-6 py-4 font-medium">Sort Order (Level)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {floors.map(floor => (
                <tr key={floor.id} className="hover:bg-surface-50/50 transition-colors group">
                  {editingId === floor.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full form-input py-1.5" autoFocus />
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" value={editSort} onChange={e => setEditSort(parseInt(e.target.value) || 0)} className="w-24 form-input py-1.5" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={handleSaveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-surface-900">{floor.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface-100 text-surface-600 font-medium">
                          Level {floor.sortOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(floor)} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit inline">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(floor.id)} disabled={isDeleting === floor.id} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            {isDeleting === floor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
