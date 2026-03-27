'use client';

import { useEffect, useState } from 'react';
import { BedDouble, Plus, Filter, ChevronDown } from 'lucide-react';
import { roomsApi } from '@/lib/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchRooms() {
      try {
        const params: Record<string, string> = {};
        if (filter !== 'all') params.status = filter;
        const res = await roomsApi.getRooms(params);
        if (res.success) setRooms(res.data);
      } catch (err) {
        console.error('Rooms fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, [filter]);

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    occupied: 'bg-primary-500/20 border-primary-500/30 text-primary-400',
    blocked: 'bg-red-500/20 border-red-500/30 text-red-400',
    maintenance: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    dirty: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    cleaning: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Rooms</h1>
          <p className="text-surface-400">Manage your property&apos;s rooms and availability</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'available', 'occupied', 'dirty', 'maintenance', 'blocked'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20' : 'bg-white/[0.04] text-surface-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}>
            {s.charAt(0).toUpperCase() + s.replace(/_/g, ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BedDouble className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
          <p className="text-surface-400 mb-4">Add your first floor and rooms to get started.</p>
          <button className="btn-primary">Add Room</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all ${statusColors[room.status] || 'bg-white/[0.04] border-white/[0.06]'}`}>
              <p className="text-lg font-bold mb-0.5">{room.roomNumber}</p>
              <p className="text-xs opacity-80">{room.roomType?.name}</p>
              <p className="text-xs opacity-60 mt-1">{room.floor?.name}</p>
              <div className="mt-2">
                <span className="text-xs font-medium capitalize">{room.status?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
