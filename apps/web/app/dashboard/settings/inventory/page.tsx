'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { Layers, BedDouble, Key, Plus, Pencil, Trash2, ArrowLeft, Loader2, Save, X, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ──
interface Floor { id: string; name: string; sortOrder: number; rooms?: any[]; }
interface RoomType { id: string; name: string; description?: string; baseRate: number; maxOccupancy: number; pricingUnit: string; _count?: { rooms: number }; }
interface Room { id: string; roomNumber: string; floorId: string; roomTypeId: string; status: string; floor?: { name: string }; roomType?: { name: string; baseRate: number }; }

export default function InventorySetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Section collapse state (all open by default)
  const [openSections, setOpenSections] = useState({ floors: true, types: true, rooms: true });

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [fRes, tRes, rRes] = await Promise.all([
        roomsApi.getFloors(),
        roomsApi.getRoomTypes(),
        roomsApi.getRooms(),
      ]);
      if (fRes.success) setFloors(fRes.data || []);
      if (tRes.success) setRoomTypes(tRes.data || []);
      if (rRes.success) setRooms(rRes.data || []);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 fade-in">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/dashboard/settings')} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-primary-600" />
          Property Inventory
        </h1>
        <p className="text-surface-500 mt-1">Set up your floors, room types, and rooms — all in one place.</p>
      </div>

      {/* Guide bar */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl px-5 py-3 text-sm text-primary-800 flex items-center gap-3">
        <span className="font-semibold">Quick setup:</span>
        <span className="hidden sm:inline">① Add floors → ② Define room types & pricing → ③ Map rooms</span>
        <span className="sm:hidden">① Floors → ② Types → ③ Rooms</span>
      </div>

      {/* ═══ SECTION 1: FLOORS ═══ */}
      <SectionCard
        icon={<Layers className="w-5 h-5" />}
        title="Floors"
        count={floors.length}
        isOpen={openSections.floors}
        onToggle={() => toggleSection('floors')}
      >
        <FloorsSection floors={floors} setFloors={setFloors} />
      </SectionCard>

      {/* ═══ SECTION 2: ROOM TYPES ═══ */}
      <SectionCard
        icon={<BedDouble className="w-5 h-5" />}
        title="Room Types"
        count={roomTypes.length}
        isOpen={openSections.types}
        onToggle={() => toggleSection('types')}
      >
        <RoomTypesSection roomTypes={roomTypes} setRoomTypes={setRoomTypes} onRefresh={fetchAll} />
      </SectionCard>

      {/* ═══ SECTION 3: ROOMS ═══ */}
      <SectionCard
        icon={<Key className="w-5 h-5" />}
        title="Rooms"
        count={rooms.length}
        isOpen={openSections.rooms}
        onToggle={() => toggleSection('rooms')}
      >
        <RoomsSection rooms={rooms} setRooms={setRooms} floors={floors} roomTypes={roomTypes} onRefresh={fetchAll} />
      </SectionCard>
    </div>
  );
}

// ── Reusable Section Card ──
function SectionCard({ icon, title, count, isOpen, onToggle, children }: {
  icon: React.ReactNode; title: string; count: number; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-surface-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="text-primary-600">{icon}</div>
          <span className="text-lg font-bold text-surface-900">{title}</span>
          <span className="text-xs bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full font-medium">{count}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
      </button>
      {isOpen && <div className="border-t border-surface-100">{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════
// FLOORS SECTION
// ══════════════════════════════════════════
function FloorsSection({ floors, setFloors }: { floors: Floor[]; setFloors: React.Dispatch<React.SetStateAction<Floor[]>>; }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addLevel, setAddLevel] = useState(floors.length);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd() {
    if (!addName.trim()) return toast.error('Floor name is required');
    setSaving(true);
    try {
      const res = await roomsApi.createFloor({ name: addName.trim(), sortOrder: addLevel });
      if (res.success) {
        setFloors(prev => [...prev, res.data]);
        setAddName(''); setAddLevel(floors.length + 1); setShowAdd(false);
        toast.success('Floor added');
      }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editId || !editName.trim()) return;
    try {
      const res = await roomsApi.updateFloor(editId, { name: editName.trim(), sortOrder: editLevel });
      if (res.success) {
        setFloors(prev => prev.map(f => f.id === editId ? { ...f, name: editName.trim(), sortOrder: editLevel } : f));
        setEditId(null);
        toast.success('Floor updated');
      }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this floor? Rooms assigned to it will need reassignment.')) return;
    setDeleting(id);
    try {
      await roomsApi.deleteFloor(id);
      setFloors(prev => prev.filter(f => f.id !== id));
      toast.success('Floor deleted');
    } catch (err: any) { toast.error(err.message || 'Cannot delete — rooms still assigned'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="p-4 sm:p-5 space-y-3">
      {floors.length === 0 && !showAdd && (
        <p className="text-sm text-surface-400 text-center py-4">No floors yet. Most properties start with "Ground Floor".</p>
      )}

      {/* Existing floors */}
      {floors.map(f => (
        <div key={f.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-50 group transition-colors">
          {editId === f.id ? (
            <>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 form-input py-1.5 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleEdit()} />
              <input type="number" value={editLevel} onChange={e => setEditLevel(parseInt(e.target.value) || 0)} className="w-20 form-input py-1.5 text-sm text-center" />
              <button onClick={handleEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Save className="w-4 h-4" /></button>
              <button onClick={() => setEditId(null)} className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <span className="flex-1 font-medium text-surface-900 text-sm">{f.name}</span>
              <span className="text-xs bg-surface-100 text-surface-500 px-2 py-0.5 rounded-md">Level {f.sortOrder}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditId(f.id); setEditName(f.name); setEditLevel(f.sortOrder); }} className="p-1.5 text-surface-400 hover:text-primary-600 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id} className="p-1.5 text-surface-400 hover:text-red-600 rounded-lg">
                  {deleting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Inline add form */}
      {showAdd ? (
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-primary-50/50 border border-primary-100">
          <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Floor name (e.g. Ground Floor)" className="flex-1 form-input py-1.5 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input type="number" value={addLevel} onChange={e => setAddLevel(parseInt(e.target.value) || 0)} className="w-20 form-input py-1.5 text-sm text-center" placeholder="Level" />
          <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
          <button onClick={() => setShowAdd(false)} className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button onClick={() => { setShowAdd(true); setAddLevel(floors.length); }} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2 hover:bg-primary-50 rounded-lg transition-colors w-full">
          <Plus className="w-4 h-4" /> Add Floor
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ROOM TYPES SECTION
// ══════════════════════════════════════════
function RoomTypesSection({ roomTypes, setRoomTypes, onRefresh }: { roomTypes: RoomType[]; setRoomTypes: React.Dispatch<React.SetStateAction<RoomType[]>>; onRefresh: () => void; }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', baseRate: 0, maxOccupancy: 2, pricingUnit: 'nightly', description: '' });

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', baseRate: 0, maxOccupancy: 2, pricingUnit: 'nightly', description: '' });
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.name.trim()) return toast.error('Name is required');
    if (form.baseRate <= 0) return toast.error('Rate must be greater than 0');
    setSaving(true);
    try {
      const res = await roomsApi.createRoomType(form);
      if (res.success) {
        setRoomTypes(prev => [...prev, { ...res.data, _count: { rooms: 0 } }]);
        setForm({ name: '', baseRate: 0, maxOccupancy: 2, pricingUnit: 'nightly', description: '' });
        setShowAdd(false);
        toast.success('Room type added');
      }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editId || !editForm.name.trim()) return;
    try {
      const res = await roomsApi.updateRoomType(editId, editForm);
      if (res.success) {
        setRoomTypes(prev => prev.map(t => t.id === editId ? { ...t, ...editForm } : t));
        setEditId(null);
        toast.success('Room type updated');
      }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this room type? Existing rooms will need reassignment.')) return;
    setDeleting(id);
    try {
      await roomsApi.deleteRoomType(id);
      setRoomTypes(prev => prev.filter(t => t.id !== id));
      toast.success('Room type removed');
    } catch (err: any) { toast.error(err.message || 'Cannot delete — rooms still assigned'); }
    finally { setDeleting(null); }
  }

  const pricingLabel = (unit: string) => unit === 'monthly' ? '/month' : '/night';

  return (
    <div className="p-4 sm:p-5 space-y-3">
      {roomTypes.length === 0 && !showAdd && (
        <p className="text-sm text-surface-400 text-center py-4">No room types yet. Create categories like "Deluxe", "Standard", or "PG Single Bed".</p>
      )}

      {/* Existing room types */}
      {roomTypes.map(t => (
        <div key={t.id} className="rounded-xl border border-surface-100 overflow-hidden hover:border-surface-200 transition-colors group">
          {editId === t.id ? (
            <div className="p-4 space-y-3 bg-primary-50/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="col-span-2 form-input py-1.5 text-sm" autoFocus />
                <div className="flex items-center gap-1">
                  <span className="text-surface-400 text-sm">₹</span>
                  <input type="number" min="0" value={editForm.baseRate} onChange={e => setEditForm({ ...editForm, baseRate: parseFloat(e.target.value) || 0 })} className="flex-1 form-input py-1.5 text-sm" />
                </div>
                <select value={editForm.pricingUnit} onChange={e => setEditForm({ ...editForm, pricingUnit: e.target.value })} className="form-select py-1.5 text-sm">
                  <option value="nightly">Per Night</option>
                  <option value="monthly">Per Month</option>
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input type="number" min="1" value={editForm.maxOccupancy} onChange={e => setEditForm({ ...editForm, maxOccupancy: parseInt(e.target.value) || 1 })} className="form-input py-1.5 text-sm" placeholder="Max guests" />
                <input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description (optional)" className="col-span-2 sm:col-span-3 form-input py-1.5 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-lg">Cancel</button>
                <button onClick={handleEdit} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-surface-900 text-sm">{t.name}</div>
                <div className="text-xs text-surface-400 mt-0.5">{t.maxOccupancy} guests · {t._count?.rooms ?? 0} rooms</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-surface-900">₹{t.baseRate.toLocaleString('en-IN')}</div>
                <div className="text-xs text-surface-400">{pricingLabel(t.pricingUnit)}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => { setEditId(t.id); setEditForm({ name: t.name, baseRate: t.baseRate, maxOccupancy: t.maxOccupancy, pricingUnit: t.pricingUnit, description: t.description || '' }); }} className="p-1.5 text-surface-400 hover:text-primary-600 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="p-1.5 text-surface-400 hover:text-red-600 rounded-lg">
                  {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Inline add form */}
      {showAdd ? (
        <div className="rounded-xl border border-primary-200 bg-primary-50/30 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Room type name" className="col-span-2 form-input py-1.5 text-sm" autoFocus />
            <div className="flex items-center gap-1">
              <span className="text-surface-400 text-sm">₹</span>
              <input type="number" min="0" value={form.baseRate || ''} onChange={e => setForm({ ...form, baseRate: parseFloat(e.target.value) || 0 })} placeholder="Rate" className="flex-1 form-input py-1.5 text-sm" />
            </div>
            <select value={form.pricingUnit} onChange={e => setForm({ ...form, pricingUnit: e.target.value })} className="form-select py-1.5 text-sm">
              <option value="nightly">Per Night</option>
              <option value="monthly">Per Month</option>
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input type="number" min="1" value={form.maxOccupancy} onChange={e => setForm({ ...form, maxOccupancy: parseInt(e.target.value) || 1 })} className="form-input py-1.5 text-sm" placeholder="Max guests" />
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="col-span-2 sm:col-span-3 form-input py-1.5 text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-lg">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2 hover:bg-primary-50 rounded-lg transition-colors w-full">
          <Plus className="w-4 h-4" /> Add Room Type
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ROOMS SECTION
// ══════════════════════════════════════════
function RoomsSection({ rooms, setRooms, floors, roomTypes, onRefresh }: {
  rooms: Room[]; setRooms: React.Dispatch<React.SetStateAction<Room[]>>; floors: Floor[]; roomTypes: RoomType[]; onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ roomNumber: '', floorId: '', roomTypeId: '' });
  const [deleting, setDeleting] = useState<string | null>(null);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ roomNumber: '', floorId: '', roomTypeId: '' });

  // Pre-select first floor/type when opening add form
  function openAdd() {
    setForm({
      roomNumber: '',
      floorId: floors[0]?.id || '',
      roomTypeId: roomTypes[0]?.id || '',
    });
    setShowAdd(true);
  }

  async function handleAdd() {
    if (!form.roomNumber.trim()) return toast.error('Room number is required');
    if (!form.floorId) return toast.error('Select a floor first');
    if (!form.roomTypeId) return toast.error('Select a room type first');
    setSaving(true);
    try {
      const res = await roomsApi.createRoom(form);
      if (res.success) {
        // Refetch to get joined data (floor name, type name)
        await onRefresh();
        setForm({ roomNumber: '', floorId: floors[0]?.id || '', roomTypeId: roomTypes[0]?.id || '' });
        setShowAdd(false);
        toast.success('Room added');
      }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editId || !editForm.roomNumber.trim()) return;
    try {
      const res = await roomsApi.updateRoom(editId, editForm);
      if (res.success) {
        // Refetch to get fresh joined data
        await onRefresh();
        setEditId(null);
        toast.success('Room updated');
      }
    } catch (err: any) { toast.error(err.message || 'Failed to update room'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this room?')) return;
    setDeleting(id);
    try {
      await roomsApi.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      toast.success('Room deleted');
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setDeleting(null); }
  }

  function startEdit(r: Room) {
    setEditId(r.id);
    setEditForm({ roomNumber: r.roomNumber, floorId: r.floorId, roomTypeId: r.roomTypeId });
  }

  // Helpers
  const floorName = (id: string) => floors.find(f => f.id === id)?.name || '—';
  const typeName = (id: string) => roomTypes.find(t => t.id === id)?.name || '—';

  const noPrereqs = floors.length === 0 || roomTypes.length === 0;

  return (
    <div className="p-4 sm:p-5 space-y-3">
      {noPrereqs && (
        <div className="text-center py-6">
          <p className="text-sm text-surface-400 mb-1">Add at least one floor and one room type above first.</p>
          <p className="text-xs text-surface-300">Rooms are mapped to a floor + room type.</p>
        </div>
      )}

      {!noPrereqs && rooms.length === 0 && !showAdd && (
        <p className="text-sm text-surface-400 text-center py-4">No rooms yet. Add your first room below.</p>
      )}

      {/* Existing rooms */}
      {rooms.length > 0 && (
        <div className="overflow-x-auto -mx-4 sm:-mx-5">
          <table className="w-full text-left text-sm min-w-[480px]">
            <thead className="text-xs text-surface-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-5 py-2 font-medium">Room</th>
                <th className="px-4 sm:px-5 py-2 font-medium">Floor</th>
                <th className="px-4 sm:px-5 py-2 font-medium">Type</th>
                <th className="px-4 sm:px-5 py-2 font-medium">Status</th>
                <th className="px-4 sm:px-5 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {rooms.map(r => (
                <tr key={r.id} className="hover:bg-surface-50/50 group">
                  {editId === r.id ? (
                    <>
                      <td className="px-4 sm:px-5 py-2">
                        <input type="text" value={editForm.roomNumber} onChange={e => setEditForm({ ...editForm, roomNumber: e.target.value })} className="w-24 form-input py-1 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleEdit()} />
                      </td>
                      <td className="px-4 sm:px-5 py-2">
                        <select value={editForm.floorId} onChange={e => setEditForm({ ...editForm, floorId: e.target.value })} className="form-select py-1 text-sm">
                          {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 sm:px-5 py-2">
                        <select value={editForm.roomTypeId} onChange={e => setEditForm({ ...editForm, roomTypeId: e.target.value })} className="form-select py-1 text-sm">
                          {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 sm:px-5 py-2 text-xs text-surface-400">—</td>
                      <td className="px-4 sm:px-5 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 sm:px-5 py-2.5 font-semibold text-surface-900">{r.roomNumber}</td>
                      <td className="px-4 sm:px-5 py-2.5 text-surface-600">{r.floor?.name || floorName(r.floorId)}</td>
                      <td className="px-4 sm:px-5 py-2.5 text-surface-600">{r.roomType?.name || typeName(r.roomTypeId)}</td>
                      <td className="px-4 sm:px-5 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === 'available' ? 'bg-emerald-50 text-emerald-700' : r.status === 'occupied' ? 'bg-amber-50 text-amber-700' : 'bg-surface-100 text-surface-500'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)} className="p-1.5 text-surface-400 hover:text-primary-600 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-1.5 text-surface-400 hover:text-red-600 rounded-lg">
                            {deleting === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline add form */}
      {!noPrereqs && showAdd ? (
        <div className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-lg bg-primary-50/50 border border-primary-100">
          <input type="text" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} placeholder="Room # (e.g. 101)" className="w-28 sm:w-36 form-input py-1.5 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <select value={form.floorId} onChange={e => setForm({ ...form, floorId: e.target.value })} className="form-select py-1.5 text-sm flex-1 min-w-[120px]">
            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={form.roomTypeId} onChange={e => setForm({ ...form, roomTypeId: e.target.value })} className="form-select py-1.5 text-sm flex-1 min-w-[120px]">
            {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
          </button>
          <button onClick={() => setShowAdd(false)} className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      ) : !noPrereqs ? (
        <button onClick={openAdd} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2 hover:bg-primary-50 rounded-lg transition-colors w-full">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      ) : null}
    </div>
  );
}

