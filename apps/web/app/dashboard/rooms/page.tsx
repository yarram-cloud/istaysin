'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { BedDouble, Layers, Loader2, Search, ChevronDown, ChevronRight, LayoutGrid, List, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { roomsApi } from '@/lib/api';
import Link from 'next/link';

interface Floor { id: string; name: string; level: number; }
interface RoomType { id: string; name: string; maxOccupancy: number; baseRate: number; description?: string; }
interface Room { id: string; roomNumber: string; status: string; baseRate: number; floor?: Floor; roomType?: RoomType; floorId: string; roomTypeId: string; }

const STATUS_OPTIONS = ['available', 'occupied', 'blocked', 'maintenance', 'dirty', 'cleaning'];
const STATUS_CLASSES: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  occupied: 'bg-primary-100 text-primary-700 border-primary-200',
  blocked: 'bg-red-100 text-red-700 border-red-200',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  dirty: 'bg-orange-100 text-orange-700 border-orange-200',
  cleaning: 'bg-violet-100 text-violet-700 border-violet-200',
};

const STATUS_DOT: Record<string, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-primary-500',
  blocked: 'bg-red-500',
  maintenance: 'bg-amber-500',
  dirty: 'bg-orange-500',
  cleaning: 'bg-violet-500',
};

export default function RoomsPage() {
  const t = useTranslations('Dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const fetchAll = useCallback(async () => {
    try {
      const [roomsRes, floorsRes] = await Promise.all([
        roomsApi.getRooms(statusFilter !== 'all' ? { status: statusFilter } : undefined),
        roomsApi.getFloors(),
      ]);
      if (roomsRes.success) setRooms(roomsRes.data || []);
      if (floorsRes.success) setFloors(floorsRes.data || []);
    } catch (err) { console.error('Fetch failed:', err); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter rooms
  const filtered = useMemo(() => {
    let result = rooms;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.roomType?.name.toLowerCase().includes(q) ||
        r.floor?.name.toLowerCase().includes(q)
      );
    }
    if (floorFilter !== 'all') {
      result = result.filter(r => r.floorId === floorFilter);
    }
    return result;
  }, [rooms, searchQuery, floorFilter]);

  // Group rooms by floor
  const groupedByFloor = useMemo(() => {
    const groups: Record<string, { floor: Floor | null; rooms: Room[] }> = {};
    filtered.forEach(room => {
      const key = room.floorId || 'unassigned';
      if (!groups[key]) {
        groups[key] = { floor: room.floor || null, rooms: [] };
      }
      groups[key].rooms.push(room);
    });
    // Sort by floor level
    return Object.entries(groups).sort(([, a], [, b]) => (a.floor?.level || 0) - (b.floor?.level || 0));
  }, [filtered]);

  // Stats
  const stats = useMemo(() => ({
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }), [rooms]);

  async function handleStatusChange(roomId: string, newStatus: string) {
    try {
      await roomsApi.updateStatus(roomId, newStatus);
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
      toast.success('Room status updated');
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-100 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-surface-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-surface-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">Room Status & Operations</h1>
          <p className="text-sm text-surface-500">Live overview of {stats.total} rooms across {floors.length} floors</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings/inventory" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 transition-all shadow-sm">
            <Settings className="w-4 h-4" /> Manage Inventory
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-900', bg: 'bg-surface-50 border-surface-200' },
          { label: 'Available', value: stats.available, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Occupied', value: stats.occupied, color: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border ${s.bg}`}>
            <p className="text-xs text-surface-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search, Filter & View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search by room number, type, floor..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
          className="h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
          <option value="all">All Floors</option>
          {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {/* View Toggle */}
        <div className="flex items-center border border-surface-200 rounded-xl overflow-hidden h-10">
          <button onClick={() => setViewMode('grid')} className={`h-full px-3 flex items-center gap-1.5 text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-700' : 'bg-white text-surface-500 hover:bg-surface-50'}`}>
            <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
          </button>
          <button onClick={() => setViewMode('table')} className={`h-full px-3 flex items-center gap-1.5 text-sm transition-colors border-l border-surface-200 ${viewMode === 'table' ? 'bg-primary-50 text-primary-700' : 'bg-white text-surface-500 hover:bg-surface-50'}`}>
            <List className="w-4 h-4" /> <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
          <BedDouble className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 mb-2">No rooms found</h3>
          <p className="text-sm text-surface-500 mb-6">{rooms.length === 0 ? 'Map your first physical room in settings.' : 'Try adjusting your filters.'}</p>
          {rooms.length === 0 && (
            <Link href="/dashboard/settings/inventory" className="inline-block bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors">Configure Rooms</Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ── Table View ── */
        <div className="space-y-4">
          {groupedByFloor.map(([floorId, group]) => (
            <FloorGroup key={floorId} floor={group.floor} rooms={group.rooms}
              onStatusChange={handleStatusChange} />
          ))}
        </div>
      ) : (
        /* ── Grid View ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-xl border border-surface-200 p-3 hover:shadow-md hover:border-primary-200 transition-all group overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-surface-900 truncate">{room.roomNumber}</span>
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_DOT[room.status] || 'bg-surface-300'}`} title={room.status} />
              </div>
              <p className="text-xs text-surface-500 mb-1.5 truncate">{room.roomType?.name || '-'}</p>
              <p className="text-xs text-surface-400 truncate">{room.floor?.name || '-'}</p>
              <div className="mt-3 pt-2 border-t border-surface-100">
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, e.target.value)}
                  className={`w-full text-[10px] sm:text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer outline-none ${STATUS_CLASSES[room.status] || 'bg-surface-100 text-surface-600 border-surface-200'}`}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Floor Group for Table View ─────────────────────────────────
function FloorGroup({ floor, rooms, onStatusChange }: {
  floor: Floor | null; rooms: Room[]; onStatusChange: (id: string, s: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-surface-50 transition-colors">
        <div className="flex items-center gap-3">
          {collapsed ? <ChevronRight className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
          <Layers className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-semibold text-surface-900">{floor?.name || 'Unassigned'}</span>
          <span className="text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">{rooms.length} rooms</span>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-[10px] sm:text-xs text-surface-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{rooms.filter(r => r.status === 'available').length} avail</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-500" />{rooms.filter(r => r.status === 'occupied').length} occ</span>
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-surface-100 bg-surface-50">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Room #</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-surface-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-sm font-bold text-surface-900">{room.roomNumber}</td>
                  <td className="px-4 py-2.5 text-sm text-surface-600">{room.roomType?.name || '-'}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={room.status}
                      onChange={(e) => onStatusChange(room.id, e.target.value)}
                      className={`text-[10px] sm:text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary-500/30 ${STATUS_CLASSES[room.status] || 'bg-surface-100 text-surface-600 border-surface-200'}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
