'use client';

import { useEffect, useState, useCallback } from 'react';
import { BedDouble, Plus, X, Trash2, Edit2, Layers, Tag, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { roomsApi } from '@/lib/api';

interface Floor { id: string; name: string; level: number; }
interface RoomType { id: string; name: string; maxOccupancy: number; baseRate: number; description?: string; }
interface Room { id: string; roomNumber: string; status: string; baseRate: number; floor?: Floor; roomType?: RoomType; floorId: string; roomTypeId: string; }

export default function RoomsPage() {
  const t = useTranslations('Dashboard');
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

  function handleDeleteRoom(id: string) {
    toast(t('confirmDeleteRoom') || 'Delete this room?', {
      description: t('actionCannotBeUndone') || 'This action cannot be undone.',
      action: {
        label: t('confirm') || 'Confirm',
        onClick: async () => {
          try {
            await roomsApi.deleteRoom(id);
            setRooms((prev) => prev.filter((r) => r.id !== id));
            toast.success(t('roomDeleted') || 'Room deleted successfully');
          } catch (err: any) {
            toast.error(err.message || t('deleteFailed') || 'Failed to delete room');
          }
        }
      },
      cancel: { label: t('cancel') || 'Cancel', onClick: () => {} }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1 text-surface-900">{t('rooms')}</h1>
          <p className="text-surface-500">{t('roomsSub')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2 text-sm shadow-sm print:hidden"
            title={t('printHousekeeping')}
          >
            <Printer className="w-4 h-4" /> {t('print')}
          </button>
          <button onClick={() => setShowManageFloors(true)} className="btn-secondary flex items-center gap-2 text-sm shadow-sm print:hidden">
            <Layers className="w-4 h-4" /> Floors
          </button>
          <button onClick={() => setShowManageTypes(true)} className="btn-secondary flex items-center gap-2 text-sm shadow-sm">
            <Tag className="w-4 h-4" /> Room Types
          </button>
          <button onClick={() => { setEditingRoom(null); setShowAddRoom(true); }} className="bg-primary-700 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'available', 'occupied', 'dirty', 'maintenance', 'blocked'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              filter === s ? 'bg-primary-700 text-white border border-primary-700' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            }`}>
            {s.charAt(0).toUpperCase() + s.replace(/_/g, ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <BedDouble className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">No rooms added yet</h3>
          <p className="text-surface-500 mb-6">Build out your inventory by setting up floors and room types, then you can add your specific units.</p>
          <button onClick={() => { setEditingRoom(null); setShowAddRoom(true); }} className="bg-primary-700 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm">
             <Plus className="w-4 h-4"/> Add First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {rooms.map((room) => {
            // Light mode status colors
            const lightStatusColors: Record<string, string> = {
              available: 'bg-emerald-50 border-emerald-200 border-l-4 border-l-emerald-500',
              occupied: 'bg-primary-50 border-primary-200 border-l-4 border-l-primary-600',
              blocked: 'bg-red-50 border-red-200 border-l-4 border-l-red-500',
              maintenance: 'bg-amber-50 border-amber-200 border-l-4 border-l-amber-500',
              dirty: 'bg-orange-50 border-orange-200 border-l-4 border-l-orange-500',
              cleaning: 'bg-cyan-50 border-cyan-200 border-l-4 border-l-cyan-500',
            };
            const statusTextColor: Record<string, string> = {
              available: 'text-emerald-700',
              occupied: 'text-primary-700',
              blocked: 'text-red-700',
              maintenance: 'text-amber-700',
              dirty: 'text-orange-700',
              cleaning: 'text-cyan-700',
            };

            return (
              <div key={room.id} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all relative group shadow-sm ${lightStatusColors[room.status] || 'bg-white border-surface-200 border-l-4 border-l-surface-400'}`}>
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white/80 p-0.5 rounded-lg shadow-sm backdrop-blur-sm">
                  <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setShowAddRoom(true); }}
                    className="p-1.5 rounded-md hover:bg-surface-100 text-surface-600 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xl font-bold text-surface-900 mb-0.5">{room.roomNumber}</p>
                <p className="text-sm text-surface-600 font-medium truncate">{room.roomType?.name}</p>
                <p className="text-xs text-surface-500 mt-1">{room.floor?.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs font-bold capitalize ${statusTextColor[room.status] || 'text-surface-600'}`}>{room.status?.replace(/_/g, ' ')}</span>
                  {room.baseRate && <span className="text-xs font-semibold text-surface-700">₹{room.baseRate}</span>}
                </div>
              </div>
            );
          })}
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
  const t = useTranslations('Dashboard');
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
    <div className="fixed inset-0 z-[60] flex justify-end bg-surface-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white border-l border-surface-200 w-full max-w-md h-full flex flex-col animate-slide-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h2 className="text-xl font-display font-bold text-surface-900">{room ? 'Edit Room' : 'Add Room'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-surface-500 hover:text-surface-900 transition-colors rounded-lg hover:bg-surface-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <form onSubmit={handleSave} className="space-y-5">
            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Room Number *</label>
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 101, A-201"
              className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Floor *</label>
            <select value={floorId} onChange={(e) => setFloorId(e.target.value)} className="input-field">
              {floors.length === 0 && <option value="">No floors - add one first</option>}
              {floors.map((f) => <option key={f.id} value={f.id}>{f.name} (Level {f.level})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Room Type *</label>
            <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="input-field">
              {roomTypes.length === 0 && <option value="">No types - add one first</option>}
              {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name} (Max {t.maxOccupancy})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Base Rate (₹/night)</label>
            <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} placeholder="Auto from room type"
              className="input-field" min="0" step="100" />
          </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-surface-100">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
              <button type="submit" disabled={saving} className="bg-primary-700 hover:bg-primary-600 text-white flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-medium shadow-sm transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {room ? 'Update Room' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


// ── Manage Floors Modal ──────────────────────────────────────
function ManageFloorsModal({ floors, onClose, onUpdated }: {
  floors: Floor[]; onClose: () => void; onUpdated: () => void;
}) {
  const t = useTranslations('Dashboard');
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
      toast.success(t('floorAdded') || 'Floor added successfully');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    toast(t('confirmDeleteFloor') || 'Delete this floor? Rooms on this floor will need to be reassigned.', {
      description: t('actionCannotBeUndone') || 'This action cannot be undone.',
      action: {
        label: t('confirm') || 'Confirm',
        onClick: async () => {
          try { 
            await roomsApi.deleteFloor(id); 
            onUpdated(); 
            toast.success(t('floorDeleted') || 'Floor deleted successfully');
          }
          catch (err: any) { toast.error(err.message); }
        }
      },
      cancel: { label: t('cancel') || 'Cancel', onClick: () => {} }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-surface-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white border-l border-surface-200 w-full max-w-md h-full flex flex-col animate-slide-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h2 className="text-xl font-display font-bold text-surface-900">Manage Floors</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-surface-500 hover:text-surface-900 transition-colors rounded-lg hover:bg-surface-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col no-scrollbar">
          {/* Existing floors */}
          <div className="space-y-3 mb-8 flex-1 overflow-y-auto pr-2 no-scrollbar">
          {floors.length === 0 && <p className="text-surface-500 text-sm text-center py-4">No floors added yet</p>}
          {floors.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <p className="text-sm font-semibold text-surface-900">{f.name}</p>
                <p className="text-xs text-surface-500">Level {f.level}</p>
              </div>
              <button onClick={() => handleDelete(f.id)} className="text-surface-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

          {/* Add form */}
          <div className="pt-6 border-t border-surface-100 mt-auto">
            <h3 className="text-sm font-semibold text-surface-900 mb-3 block">Add New Floor</h3>
            <form onSubmit={handleAdd} className="flex gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Floor name (e.g. Ground Floor)" className="input-field flex-1" required />
              <input type="number" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level" className="input-field w-24 text-center" required />
              <button type="submit" disabled={saving} className="bg-primary-700 hover:bg-primary-600 text-white rounded-xl px-6 font-medium shadow-sm transition-colors">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Manage Room Types Modal ──────────────────────────────────
function ManageRoomTypesModal({ roomTypes, onClose, onUpdated }: {
  roomTypes: RoomType[]; onClose: () => void; onUpdated: () => void;
}) {
  const t = useTranslations('Dashboard');
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
      toast.success(t('roomTypeAdded') || 'Room type added successfully');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    toast(t('confirmDeleteRoomType') || 'Delete this room type? Rooms of this type will need to be reassigned.', {
      description: t('actionCannotBeUndone') || 'This action cannot be undone.',
      action: {
        label: t('confirm') || 'Confirm',
        onClick: async () => {
          try { 
            await roomsApi.deleteRoomType(id); 
            onUpdated(); 
            toast.success(t('roomTypeDeleted') || 'Room type deleted successfully');
          }
          catch (err: any) { toast.error(err.message); }
        }
      },
      cancel: { label: t('cancel') || 'Cancel', onClick: () => {} }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-surface-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white border-l border-surface-200 w-full max-w-md h-full flex flex-col animate-slide-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h2 className="text-xl font-display font-bold text-surface-900">Manage Room Types</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-surface-500 hover:text-surface-900 transition-colors rounded-lg hover:bg-surface-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col no-scrollbar">
          {/* Existing types */}
          <div className="space-y-3 mb-8 flex-1 overflow-y-auto pr-2 no-scrollbar">
          {roomTypes.length === 0 && <p className="text-surface-500 text-sm text-center py-4">No room types added yet</p>}
          {roomTypes.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                <p className="text-xs text-surface-500">Max {t.maxOccupancy} guests - ₹{t.baseRate}/night</p>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-surface-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

          {/* Add form */}
          <div className="pt-6 border-t border-surface-100 mt-auto">
            <h3 className="text-sm font-semibold text-surface-900 mb-4 block">Add New Room Type</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Type Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deluxe, Suite" className="input-field" required />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-surface-700 mb-1">Max Guests</label>
                  <input type="number" value={maxOcc} onChange={(e) => setMaxOcc(e.target.value)} className="input-field text-center" min="1" required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-surface-700 mb-1">Base Rate (₹)</label>
                  <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className="input-field" min="0" step="100" required />
                </div>
              </div>
              <button type="submit" disabled={saving} className="bg-primary-700 hover:bg-primary-600 text-white rounded-xl w-full py-3 mt-2 font-medium flex items-center justify-center gap-2 shadow-sm transition-colors">
                {saving && <Loader2 className="w-5 h-5 animate-spin" />} Add Room Type
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
