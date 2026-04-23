'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { BedDouble, Plus, X, Trash2, Edit2, Layers, Tag, Loader2, Search, ChevronDown, ChevronRight, LayoutGrid, List, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { roomsApi } from '@/lib/api';

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
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Inline form states
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showManageFloors, setShowManageFloors] = useState(false);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [roomsRes, floorsRes, typesRes] = await Promise.all([
        roomsApi.getRooms(statusFilter !== 'all' ? { status: statusFilter } : undefined),
        roomsApi.getFloors(),
        roomsApi.getRoomTypes(),
      ]);
      if (roomsRes.success) setRooms(roomsRes.data || []);
      if (floorsRes.success) setFloors(floorsRes.data || []);
      if (typesRes.success) setRoomTypes(typesRes.data || []);
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">Room Inventory</h1>
          <p className="text-sm text-surface-500">{stats.total} rooms across {floors.length} floors</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManageFloors(!showManageFloors)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${showManageFloors ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
            <Layers className="w-4 h-4" /> Floors
          </button>
          <button onClick={() => setShowManageTypes(!showManageTypes)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${showManageTypes ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
            <Tag className="w-4 h-4" /> Types
          </button>
          <button onClick={() => setShowAddRoom(!showAddRoom)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showAddRoom ? 'bg-primary-100 border border-primary-200 text-primary-700' : 'bg-primary-700 text-white hover:bg-primary-600 border border-primary-700'}`}>
            <Plus className="w-4 h-4" /> Add Room
          </button>
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

      {/* Manage Floors — Inline Accordion */}
      <AnimatePresence>
        {showManageFloors && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <ManageFloors floors={floors} onUpdated={fetchAll} onClose={() => setShowManageFloors(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Types — Inline Accordion */}
      <AnimatePresence>
        {showManageTypes && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <ManageTypes roomTypes={roomTypes} onUpdated={fetchAll} onClose={() => setShowManageTypes(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Room — Inline Expandable */}
      <AnimatePresence>
        {showAddRoom && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <AddRoomInline floors={floors} roomTypes={roomTypes} onCreated={() => { setShowAddRoom(false); fetchAll(); }} onClose={() => setShowAddRoom(false)} />
          </motion.div>
        )}
      </AnimatePresence>

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
          <button onClick={() => setViewMode('table')} className={`h-full px-3 flex items-center gap-1.5 text-sm transition-colors ${viewMode === 'table' ? 'bg-primary-50 text-primary-700' : 'bg-white text-surface-500 hover:bg-surface-50'}`}>
            <List className="w-4 h-4" /> <span className="hidden sm:inline">Table</span>
          </button>
          <button onClick={() => setViewMode('grid')} className={`h-full px-3 flex items-center gap-1.5 text-sm transition-colors border-l border-surface-200 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-700' : 'bg-white text-surface-500 hover:bg-surface-50'}`}>
            <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
          <BedDouble className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 mb-2">No rooms found</h3>
          <p className="text-sm text-surface-500 mb-4">{rooms.length === 0 ? 'Add your first room to get started.' : 'Try adjusting your filters.'}</p>
          {rooms.length === 0 && (
            <button onClick={() => setShowAddRoom(true)} className="bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors">Add Room</button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ── Table View ── */
        <div className="space-y-4">
          {groupedByFloor.map(([floorId, group]) => (
            <FloorGroup key={floorId} floor={group.floor} rooms={group.rooms}
              roomTypes={roomTypes} floors={floors}
              editingRoomId={editingRoomId} setEditingRoomId={setEditingRoomId}
              onStatusChange={handleStatusChange} onUpdated={fetchAll} />
          ))}
        </div>
      ) : (
        /* ── Grid View ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-xl border border-surface-200 p-3 hover:shadow-md hover:border-primary-200 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-surface-900">{room.roomNumber}</span>
                <span className={`w-3 h-3 rounded-full ${STATUS_DOT[room.status] || 'bg-surface-300'}`} title={room.status} />
              </div>
              <p className="text-xs text-surface-500 mb-1.5">{room.roomType?.name || '-'}</p>
              <p className="text-xs text-surface-400">{room.floor?.name || '-'}</p>
              <div className="mt-3 pt-2 border-t border-surface-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-surface-900">₹{room.baseRate?.toLocaleString('en-IN')}</span>
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, e.target.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold cursor-pointer outline-none ${STATUS_CLASSES[room.status] || 'bg-surface-100 text-surface-600 border-surface-200'}`}
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
function FloorGroup({ floor, rooms, roomTypes, floors, editingRoomId, setEditingRoomId, onStatusChange, onUpdated }: {
  floor: Floor | null; rooms: Room[]; roomTypes: RoomType[]; floors: Floor[];
  editingRoomId: string | null; setEditingRoomId: (id: string | null) => void;
  onStatusChange: (id: string, s: string) => void; onUpdated: () => void;
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
        <div className="flex items-center gap-2 text-xs text-surface-500">
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
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Rate</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rooms.map((room) => (
                editingRoomId === room.id ? (
                  <EditRoomRow key={room.id} room={room} roomTypes={roomTypes} floors={floors}
                    onSaved={() => { setEditingRoomId(null); onUpdated(); }}
                    onCancel={() => setEditingRoomId(null)} />
                ) : (
                  <tr key={room.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-bold text-surface-900">{room.roomNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-surface-600">{room.roomType?.name || '-'}</td>
                    <td className="px-4 py-2.5 text-sm text-surface-600 hidden md:table-cell">₹{room.baseRate?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={room.status}
                        onChange={(e) => onStatusChange(room.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary-500/30 ${STATUS_CLASSES[room.status] || 'bg-surface-100 text-surface-600 border-surface-200'}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditingRoomId(room.id)}
                          className="w-7 h-7 rounded-md bg-surface-100 hover:bg-primary-100 text-surface-400 hover:text-primary-600 flex items-center justify-center transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={async () => {
                          if (!confirm('Delete this room?')) return;
                          try { await roomsApi.deleteRoom(room.id); toast.success('Room deleted'); onUpdated(); } catch { toast.error('Failed to delete'); }
                        }}
                          className="w-7 h-7 rounded-md bg-surface-100 hover:bg-red-100 text-surface-400 hover:text-red-600 flex items-center justify-center transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ── Inline Edit Room Row ─────────────────────────────────────────
function EditRoomRow({ room, roomTypes, floors, onSaved, onCancel }: {
  room: Room; roomTypes: RoomType[]; floors: Floor[];
  onSaved: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    roomNumber: room.roomNumber,
    floorId: room.floorId,
    roomTypeId: room.roomTypeId,
    baseRate: room.baseRate,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await roomsApi.updateRoom(room.id, form);
      toast.success('Room updated');
      onSaved();
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setSaving(false); }
  }

  return (
    <tr className="bg-primary-50/50">
      <td className="px-4 py-2">
        <input value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})}
          className="w-20 h-8 px-2 rounded-lg border border-primary-200 bg-white text-sm font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
      </td>
      <td className="px-4 py-2">
        <select value={form.roomTypeId} onChange={e => setForm({...form, roomTypeId: e.target.value})}
          className="h-8 px-2 rounded-lg border border-primary-200 bg-white text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
          {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 hidden md:table-cell">
        <input type="number" value={form.baseRate} onChange={e => setForm({...form, baseRate: parseFloat(e.target.value) || 0})}
          className="w-24 h-8 px-2 rounded-lg border border-primary-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
      </td>
      <td className="px-4 py-2">
        <select value={form.floorId} onChange={e => setForm({...form, floorId: e.target.value})}
          className="h-8 px-2 rounded-lg border border-primary-200 bg-white text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
          {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving}
            className="h-7 px-3 rounded-md bg-primary-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-500 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
          </button>
          <button onClick={onCancel} className="h-7 px-3 rounded-md border border-surface-200 bg-white text-surface-600 text-xs hover:bg-surface-50 transition-colors">Cancel</button>
        </div>
      </td>
    </tr>
  );
}


// ── Add Room Inline ──────────────────────────────────────────────
function AddRoomInline({ floors, roomTypes, onCreated, onClose }: {
  floors: Floor[]; roomTypes: RoomType[]; onCreated: () => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ roomNumber: '', floorId: floors[0]?.id || '', roomTypeId: roomTypes[0]?.id || '', baseRate: roomTypes[0]?.baseRate || 0 });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roomNumber.trim()) { toast.error('Room number is required'); return; }
    setSaving(true);
    try {
      await roomsApi.createRoom(form);
      toast.success('Room created');
      onCreated();
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{ borderTop: '3px solid var(--color-primary-500, #166534)' }}>
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="font-display text-base text-surface-900">Add New Room</h3>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs text-surface-500 mb-1">Room Number</label>
          <input required value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} placeholder="e.g. 101"
            className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs text-surface-500 mb-1">Floor</label>
          <select value={form.floorId} onChange={e => setForm({...form, floorId: e.target.value})}
            className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-surface-500 mb-1">Room Type</label>
          <select value={form.roomTypeId} onChange={e => {
            const rt = roomTypes.find(r => r.id === e.target.value);
            setForm({...form, roomTypeId: e.target.value, baseRate: rt?.baseRate || 0});
          }}
            className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name} (₹{t.baseRate})</option>)}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-xs text-surface-500 mb-1">Base Rate</label>
          <input type="number" value={form.baseRate} onChange={e => setForm({...form, baseRate: parseFloat(e.target.value) || 0})}
            className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
        </div>
        <button type="submit" disabled={saving}
          className="h-10 px-5 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50 whitespace-nowrap active:scale-[0.97]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
        </button>
      </form>
    </div>
  );
}


// ── Manage Floors — Inline ────────────────────────────────────────
function ManageFloors({ floors, onUpdated, onClose }: { floors: Floor[]; onUpdated: () => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(floors.length);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await roomsApi.createFloor({ name: name.trim(), sortOrder: level });
      toast.success('Floor created');
      setName('');
      setLevel(l => l + 1);
      onUpdated();
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden" style={{ borderLeft: '3px solid var(--color-primary-500, #166534)' }}>
      <div className="flex items-center justify-between p-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-surface-900">Manage Floors</h3>
          <span className="text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">{floors.length}</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {floors.map(f => (
            <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm">
              <span className="font-medium text-surface-900">{f.name}</span>
              <button onClick={async () => {
                if (!confirm(`Delete "${f.name}"?`)) return;
                try { await roomsApi.deleteFloor(f.id); toast.success('Floor deleted'); onUpdated(); } catch { toast.error('Cannot delete floor with rooms'); }
              }} className="text-surface-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleCreate} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-surface-500 mb-1">Floor Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ground Floor"
              className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <div className="w-20">
            <label className="block text-xs text-surface-500 mb-1">Level</label>
            <input type="number" value={level} onChange={e => setLevel(parseInt(e.target.value) || 0)}
              className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Floor'}
          </button>
        </form>
      </div>
    </div>
  );
}


// ── Manage Room Types — Inline ─────────────────────────────────────
function ManageTypes({ roomTypes, onUpdated, onClose }: { roomTypes: RoomType[]; onUpdated: () => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [maxOcc, setMaxOcc] = useState('2');
  const [baseRate, setBaseRate] = useState('1000');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await roomsApi.createRoomType({ name: name.trim(), maxOccupancy: parseInt(maxOcc) || 2, baseRate: parseFloat(baseRate) || 0, pricingUnit: 'per_night' });
      toast.success('Room type created');
      setName('');
      onUpdated();
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden" style={{ borderLeft: '3px solid #f59e0b' }}>
      <div className="flex items-center justify-between p-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-semibold text-surface-900">Room Types</h3>
          <span className="text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">{roomTypes.length}</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 transition-all"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4">
        {roomTypes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            {roomTypes.map(rt => (
              <div key={rt.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-50 border border-surface-200">
                <div>
                  <p className="text-sm font-medium text-surface-900">{rt.name}</p>
                  <p className="text-xs text-surface-500">Max {rt.maxOccupancy} · ₹{rt.baseRate}/night</p>
                </div>
                <button onClick={async () => {
                  if (!confirm(`Delete "${rt.name}"?`)) return;
                  try { await roomsApi.deleteRoomType(rt.id); toast.success('Deleted'); onUpdated(); } catch { toast.error('Cannot delete type with rooms'); }
                }} className="text-surface-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleCreate} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-surface-500 mb-1">Type Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Deluxe Suite"
              className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <div className="w-20">
            <label className="block text-xs text-surface-500 mb-1">Max Occ</label>
            <input type="number" value={maxOcc} onChange={e => setMaxOcc(e.target.value)} min="1"
              className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-surface-500 mb-1">Base Rate ₹</label>
            <input type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} min="0"
              className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Type'}
          </button>
        </form>
      </div>
    </div>
  );
}
