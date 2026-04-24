'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { Key, Plus, Loader2, ArrowLeft, Layers, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Room {
  id: string;
  roomNumber: string;
  floor?: { name: string };
  roomType?: { name: string };
}

export default function InventoryRoomsSettingsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roomsApi.getRooms();
      if (res.success) {
        setRooms(res.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/settings')} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <Key className="w-7 h-7 text-primary-600" />
            Configure Rooms
          </h1>
          <p className="text-surface-500 mt-1">Manage individual rooms, map them to floors and categories.</p>
        </div>
        
        <Link href="/dashboard/settings/inventory-rooms/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Room
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
        {rooms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-surface-300" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-1">No rooms configured</h3>
            <p className="text-surface-500 mb-6">Create physical rooms and map them to the types and floors you've set up.</p>
            <Link href="/dashboard/settings/inventory-rooms/new" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-900 text-white rounded-xl text-sm font-medium hover:bg-surface-800 transition-colors">
              <Plus className="w-4 h-4" /> Create First Room
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 font-medium">Room Number</th>
                <th className="px-6 py-4 font-medium">Floor</th>
                <th className="px-6 py-4 font-medium">Room Type</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-surface-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-surface-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-xs font-bold text-surface-600">
                      {room.roomNumber.replace(/[^0-9]/g, '').slice(-2) || '?'}
                    </div>
                    {room.roomNumber}
                  </td>
                  <td className="px-6 py-4 text-surface-600">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-surface-400" />
                      {room.floor?.name || <span className="text-surface-400 italic">Unassigned</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-600">
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-4 h-4 text-surface-400" />
                      {room.roomType?.name || <span className="text-surface-400 italic">Unassigned</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/settings/inventory-rooms/${room.id}`} className="inline-flex items-center justify-center px-4 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg font-medium transition-colors">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
