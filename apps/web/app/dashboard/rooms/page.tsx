'use client';

import { useEffect, useState, useCallback } from 'react';
import { BedDouble, Plus, X, Trash2, Edit2, Layers, Tag, Loader2 } from 'lucide-react';
import { roomsApi } from '@/lib/api';

interface Floor { id: string; name: string; level: number; }
interface RoomType { id: string; name: string; maxOccupancy: number; baseRate: number; description?: string; }
interface Room { id: string; roomNumber: string; status: string; baseRate: number; floor?: Floor; roomType?: RoomType; floorId: string; roomTypeId: string; }

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal states
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showManageFloors, setShowManageFloors] = useState(false);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [roomsRes, floorsRes, typesRes] = await Promise.all([
        roomsApi.getRooms(filter !== 'all' ? { status: filter } : undefined),
        roomsApi.getFloors(),
        roomsApi.getRoomTypes(),
      ]);
      if (roomsRes.success) setRooms(roomsRes.data || []);
      if (floorsRes.success) setFloors(floorsRes.data || []);
      if (typesRes.success) setRoomTypes(typesRes.data || []);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    occupied: 'bg-primary-500/20 border-primary-500/30 text-primary-400',
    blocked: 'bg-red-500/20 border-red-500/30 text-red-400',
    maintenance: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    dirty: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    cleaning: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  };

  async function handleDeleteRoom(id: string) {
    if (!confirm('Delete this room?')) return;
    try {
      await roomsApi.deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete room');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Rooms</h1>
          <p className="text-surface-400">Manage your property&apos;s rooms and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManageFloors(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4" /> Floors
          </button>
          <button onClick={() => setShowManageTypes(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4" /> Room Types
          </button>
          <button onClick={() => { setEditingRoom(null); setShowAddRoom(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
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
          <p className="text-surface-400 mb-4">Add floors and room types first, then add rooms.</p>
          <button onClick={() => { setEditingRoom(null); setShowAddRoom(true); }} className="btn-primary">Add Room</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all relative group ${statusColors[room.status] || 'bg-white/[0.04] border-white/[0.06]'}`}>
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setShowAddRoom(true); }}
                  className="p-1 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                  className="p-1 rounded-lg bg-black/20 hover:bg-red-500/40 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-lg font-bold mb-0.5">{room.roomNumber}</p>
              <p className="text-xs opacity-80">{room.roomType?.name}</p>
              <p className="text-xs opacity-60 mt-1">{room.floor?.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-medium capitalize">{room.status?.replace(/_/g, ' ')}</span>
                {room.baseRate && <span className="text-xs opacity-70">₹{room.baseRate}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {showAddRoom && (
        <RoomFormModal
          room={editingRoom}
          floors={floors}
          roomTypes={roomTypes}
          onClose={() => { setShowAddRoom(false); setEditingRoom(null); }}
          onSaved={() => { setShowAddRoom(false); setEditingRoom(null); fetchAll(); }}
        />
      )}

      {/* Manage Floors Modal */}
      {showManageFloors && (
        <ManageFloorsModal
          floors={floors}
          onClose={() => setShowManageFloors(false)}
          onUpdated={fetchAll}
        />
      )}

      {/* Manage Room Types Modal */}
      {showManageTypes && (
        <ManageRoomTypesModal
          roomTypes={roomTypes}
          onClose={() => setShowManageTypes(false)}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}


// ── Room Form Modal ──────────────────────────────────────────
function RoomFormModal({ room, floors, roomTypes, onClose, onSaved }: {
  room: Room | null; floors: Floor[]; roomTypes: RoomType[];
  onClose: () => void; onSaved: () => void;
}) {
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber || '');
  const [floorId, setFloorId] = useState(room?.floorId || floors[0]?.id || '');
  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId || roomTypes[0]?.id || '');
  const [baseRate, setBaseRate] = useState(room?.baseRate?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!roomNumber.trim()) { setError('Room number is required'); return; }
    if (!floorId) { setError('Please select a floor (add one first)'); return; }
    if (!roomTypeId) { setError('Please select a room type (add one first)'); return; }

    setSaving(true);
    setError('');
    try {
      const body = { roomNumber: roomNumber.trim(), floorId, roomTypeId, baseRate: baseRate ? parseFloat(baseRate) : undefined };
      if (room) {
        await roomsApi.updateRoom(room.id, body);
      } else {
        await roomsApi.createRoom(body);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">{room ? 'Edit Room' : 'Add Room'}</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Room Number *</label>
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 101, A-201"
              className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Floor *</label>
            <select value={floorId} onChange={(e) => setFloorId(e.target.value)} className="input-field">
              {floors.length === 0 && <option value="">No floors - add one first</option>}
              {floors.map((f) => <option key={f.id} value={f.id}>{f.name} (Level {f.level})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Room Type *</label>
            <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="input-field">
              {roomTypes.length === 0 && <option value="">No types - add one first</option>}
              {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name} (Max {t.maxOccupancy})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Base Rate (₹/night)</label>
            <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} placeholder="Auto from room type"
              className="input-field" min="0" step="100" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {room ? 'Update' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Manage Floors Modal ──────────────────────────────────────
function ManageFloorsModal({ floors, onClose, onUpdated }: {
  floors: Floor[]; onClose: () => void; onUpdated: () => void;
}) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !level) return;
    setSaving(true);
    try {
      await roomsApi.createFloor({ name: name.trim(), sortOrder: parseInt(level) });
      setName(''); setLevel('');
      onUpdated();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this floor? Rooms on this floor will need to be reassigned.')) return;
    try { await roomsApi.deleteFloor(id); onUpdated(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Manage Floors</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Existing floors */}
        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
          {floors.length === 0 && <p className="text-surface-500 text-sm text-center py-4">No floors added yet</p>}
          {floors.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-surface-500">Level {f.level}</p>
              </div>
              <button onClick={() => handleDelete(f.id)} className="text-surface-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Floor name (e.g. Ground Floor)" className="input-field flex-1 text-sm" required />
          <input type="number" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level" className="input-field w-20 text-sm" required />
          <button type="submit" disabled={saving} className="btn-primary text-sm px-4">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
          </button>
        </form>
      </div>
    </div>
  );
}


// ── Manage Room Types Modal ──────────────────────────────────
function ManageRoomTypesModal({ roomTypes, onClose, onUpdated }: {
  roomTypes: RoomType[]; onClose: () => void; onUpdated: () => void;
}) {
  const [name, setName] = useState('');
  const [maxOcc, setMaxOcc] = useState('2');
  const [baseRate, setBaseRate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !baseRate) return;
    setSaving(true);
    try {
      await roomsApi.createRoomType({ name: name.trim(), maxOccupancy: parseInt(maxOcc), baseRate: parseFloat(baseRate), pricingUnit: 'per_night' });
      setName(''); setMaxOcc('2'); setBaseRate('');
      onUpdated();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this room type? Rooms of this type will need to be reassigned.')) return;
    try { await roomsApi.deleteRoomType(id); onUpdated(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Manage Room Types</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Existing types */}
        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
          {roomTypes.length === 0 && <p className="text-surface-500 text-sm text-center py-4">No room types added yet</p>}
          {roomTypes.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-surface-500">Max {t.maxOccupancy} guests - ₹{t.baseRate}/night</p>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-surface-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type name (e.g. Deluxe, Suite)" className="input-field text-sm" required />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-surface-500 mb-1">Max Guests</label>
              <input type="number" value={maxOcc} onChange={(e) => setMaxOcc(e.target.value)} className="input-field text-sm" min="1" required />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-surface-500 mb-1">Base Rate (₹)</label>
              <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className="input-field text-sm" min="0" step="100" required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Room Type
          </button>
        </form>
      </div>
    </div>
  );
}
