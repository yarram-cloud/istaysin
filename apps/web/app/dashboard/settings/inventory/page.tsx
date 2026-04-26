'use client';

import { useEffect, useState, useCallback } from 'react';
import { roomsApi } from '@/lib/api';
import { Layers, BedDouble, Key, Plus, Pencil, Trash2, ArrowLeft, Loader2, Save, X, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SetupNextStepBanner from '@/app/dashboard/_components/setup-next-step-banner';

// ── Types ──
interface Floor { id: string; name: string; sortOrder: number; rooms?: any[]; }
interface RoomType {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  maxOccupancy: number;
  baseOccupancy?: number;
  maxExtraBeds?: number;
  extraBedCharge?: number;
  pricingUnit: string;
  _count?: { rooms: number };
}
interface Room { id: string; roomNumber: string; floorId: string; roomTypeId: string; status: string; rateOverride?: number; floor?: { name: string }; roomType?: { name: string; baseRate: number }; }

export default function InventorySetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Section collapse state (all open by default)
  const [openSections, setOpenSections] = useState({ floors: true, types: true, rooms: true });

  // Check if we arrived from setup guide
  const isFromSetup = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from_setup') === '1';

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [fRes, tRes, rRes] = await Promise.all([
        roomsApi.getFloors(),
        roomsApi.getRoomTypes(),
        roomsApi.getRooms(),
      ]);
      const f = fRes.success ? (fRes.data || []) : [];
      const t = tRes.success ? (tRes.data || []) : [];
      const r = rRes.success ? (rRes.data || []) : [];
      setFloors(f);
      setRoomTypes(t);
      setRooms(r);

      // Context-aware guidance for setup
      if (isFromSetup) {
        if (f.length === 0) {
          toast.info('Step 1: Start by adding your first Floor.', { duration: 6000 });
        } else if (t.length === 0) {
          toast.info('Step 2: Great! Now add a Room Type with a base rate.', { duration: 6000 });
        } else if (r.length === 0) {
          toast.info('Step 3: Finally, create individual Rooms to complete inventory.', { duration: 6000 });
        }
      }
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [isFromSetup]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 fade-in">
      <SetupNextStepBanner />
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
              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
  const [form, setForm] = useState({ 
    name: '', baseRate: 0, maxOccupancy: 2, baseOccupancy: 2, 
    maxExtraBeds: 1, extraBedCharge: 0, pricingUnit: 'nightly', description: '' 
  });

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: '', baseRate: 0, maxOccupancy: 2, baseOccupancy: 2, 
    maxExtraBeds: 1, extraBedCharge: 0, pricingUnit: 'nightly', description: '' 
  });
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.name.trim()) return toast.error('Name is required');
    if (form.baseRate <= 0) return toast.error('Rate must be greater than 0');
    setSaving(true);
    try {
      const res = await roomsApi.createRoomType(form);
      if (res.success) {
        setRoomTypes(prev => [...prev, { ...res.data, _count: { rooms: 0 } }]);
        setForm({ 
          name: '', baseRate: 0, maxOccupancy: 2, baseOccupancy: 2, 
          maxExtraBeds: 1, extraBedCharge: 0, pricingUnit: 'nightly', description: '' 
        });
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
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Room Type Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="w-full form-input py-1.5 text-sm" autoFocus />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Base Rate</label>
                  <div className="flex items-center gap-1">
                    <span className="text-surface-400 text-sm">₹</span>
                    <input type="number" min="0" value={editForm.baseRate} onChange={e => setEditForm({ ...editForm, baseRate: parseFloat(e.target.value) || 0 })} className="flex-1 form-input py-1.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Pricing Unit</label>
                  <select value={editForm.pricingUnit} onChange={e => setEditForm({ ...editForm, pricingUnit: e.target.value })} className="w-full form-select py-1.5 text-sm">
                    <option value="nightly">Per Night</option>
                    <option value="monthly">Per Month</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Base Occ.</label>
                  <input type="number" min="1" value={editForm.baseOccupancy} onChange={e => setEditForm({ ...editForm, baseOccupancy: parseInt(e.target.value) || 1 })} className="w-full form-input py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Max Occ.</label>
                  <input type="number" min="1" value={editForm.maxOccupancy} onChange={e => setEditForm({ ...editForm, maxOccupancy: parseInt(e.target.value) || 1 })} className="w-full form-input py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Max Extra Beds</label>
                  <input type="number" min="0" value={editForm.maxExtraBeds} onChange={e => setEditForm({ ...editForm, maxExtraBeds: parseInt(e.target.value) || 0 })} className="w-full form-input py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Extra Bed ₹</label>
                  <input type="number" min="0" value={editForm.extraBedCharge} onChange={e => setEditForm({ ...editForm, extraBedCharge: parseFloat(e.target.value) || 0 })} className="w-full form-input py-1.5 text-sm" />
                </div>
              </div>

              <div className="w-full">
                <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Description</label>
                <input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description (optional)" className="w-full form-input py-1.5 text-sm" />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleEdit} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm shadow-primary-200 flex items-center gap-2 transition-all">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-surface-900 text-sm">{t.name}</div>
                <div className="text-xs text-surface-400 mt-0.5">
                  {t.baseOccupancy || 2}-{t.maxOccupancy} guests · {t._count?.rooms ?? 0} rooms
                  {(t.maxExtraBeds ?? 0) > 0 && ` · Up to ${t.maxExtraBeds} extra beds (₹${t.extraBedCharge}/bed)`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-surface-900">₹{t.baseRate.toLocaleString('en-IN')}</div>
                <div className="text-xs text-surface-400">{pricingLabel(t.pricingUnit)}</div>
              </div>
              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                <button onClick={() => { 
                  setEditId(t.id); 
                  setEditForm({ 
                    name: t.name, 
                    baseRate: t.baseRate, 
                    maxOccupancy: t.maxOccupancy, 
                    baseOccupancy: (t as any).baseOccupancy || 2,
                    maxExtraBeds: (t as any).maxExtraBeds || 0,
                    extraBedCharge: (t as any).extraBedCharge || 0,
                    pricingUnit: t.pricingUnit, 
                    description: t.description || '' 
                  }); 
                }} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Room Type Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Deluxe Room" className="w-full form-input py-1.5 text-sm" autoFocus />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Base Rate</label>
              <div className="flex items-center gap-1">
                <span className="text-surface-400 text-sm">₹</span>
                <input type="number" min="0" value={form.baseRate || ''} onChange={e => setForm({ ...form, baseRate: parseFloat(e.target.value) || 0 })} placeholder="Rate" className="flex-1 form-input py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Pricing Unit</label>
              <select value={form.pricingUnit} onChange={e => setForm({ ...form, pricingUnit: e.target.value })} className="w-full form-select py-1.5 text-sm">
                <option value="nightly">Per Night</option>
                <option value="monthly">Per Month</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Base Occ.</label>
              <input type="number" min="1" value={form.baseOccupancy} onChange={e => setForm({ ...form, baseOccupancy: parseInt(e.target.value) || 2 })} className="w-full form-input py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Max Occ.</label>
              <input type="number" min="1" value={form.maxOccupancy} onChange={e => setForm({ ...form, maxOccupancy: parseInt(e.target.value) || 2 })} className="w-full form-input py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Max Extra Beds</label>
              <input type="number" min="0" value={form.maxExtraBeds} onChange={e => setForm({ ...form, maxExtraBeds: parseInt(e.target.value) || 0 })} className="w-full form-input py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Extra Bed ₹</label>
              <input type="number" min="0" value={form.extraBedCharge} onChange={e => setForm({ ...form, extraBedCharge: parseFloat(e.target.value) || 0 })} className="w-full form-input py-1.5 text-sm" />
            </div>
          </div>
          <div className="w-full">
            <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Features, view, etc." className="w-full form-input py-1.5 text-sm" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-lg">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-all">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Type
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-semibold px-4 py-2.5 hover:bg-primary-50 rounded-xl border border-dashed border-primary-200 transition-all w-full justify-center">
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
  const [form, setForm] = useState({ roomNumber: '', floorId: '', roomTypeId: '', status: 'available' });
  const [deleting, setDeleting] = useState<string | null>(null);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ roomNumber: '', floorId: '', roomTypeId: '', status: 'available', rateOverride: 0 });

  // Pre-select first floor/type when opening add form
  function openAdd() {
    setForm({
      roomNumber: '',
      floorId: floors[0]?.id || '',
      roomTypeId: roomTypes[0]?.id || '',
      status: 'available'
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
        await onRefresh();
        setForm({ roomNumber: '', floorId: floors[0]?.id || '', roomTypeId: roomTypes[0]?.id || '', status: 'available' });
        setShowAdd(false);
        toast.success('Room added');
      }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editId || !editForm.roomNumber.trim()) return;
    try {
      // Send null if rateOverride is 0 to reset to base rate
      const payload = { 
        ...editForm, 
        rateOverride: editForm.rateOverride > 0 ? editForm.rateOverride : null 
      };
      const res = await roomsApi.updateRoom(editId, payload as any);
      if (res.success) {
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
    setEditForm({ 
      roomNumber: r.roomNumber, 
      floorId: r.floorId, 
      roomTypeId: r.roomTypeId, 
      status: r.status,
      rateOverride: (r as any).rateOverride || 0
    });
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
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="text-[11px] text-surface-400 uppercase tracking-widest font-bold">
              <tr>
                <th className="px-4 sm:px-5 py-3">Room</th>
                <th className="px-4 sm:px-5 py-3">Floor / Type</th>
                <th className="px-4 sm:px-5 py-3">Status</th>
                <th className="px-4 sm:px-5 py-3">Rate (Over.)</th>
                <th className="px-4 sm:px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rooms.map(r => (
                <tr key={r.id} className="hover:bg-surface-50/50 group transition-colors">
                  {editId === r.id ? (
                    <td colSpan={5} className="px-4 sm:px-5 py-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="shrink-0">
                          <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Room #</label>
                          <input
                            type="text"
                            value={editForm.roomNumber}
                            onChange={e => setEditForm({ ...editForm, roomNumber: e.target.value })}
                            className="w-24 form-input py-1.5 text-sm font-semibold"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleEdit()}
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Floor</label>
                          <select
                            value={editForm.floorId}
                            onChange={e => setEditForm({ ...editForm, floorId: e.target.value })}
                            className="w-full form-select py-1.5 text-xs"
                          >
                            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Room Type</label>
                          <select
                            value={editForm.roomTypeId}
                            onChange={e => setEditForm({ ...editForm, roomTypeId: e.target.value })}
                            className="w-full form-select py-1.5 text-xs"
                          >
                            {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div className="shrink-0 min-w-[130px]">
                          <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Status</label>
                          <select
                            value={editForm.status}
                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full form-select py-1.5 text-xs font-medium"
                          >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="blocked">Blocked</option>
                            <option value="dirty">Dirty</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                        <div className="shrink-0 min-w-[100px]">
                          <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block">Rate Override ₹</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={editForm.rateOverride || ''}
                            onChange={e => setEditForm({ ...editForm, rateOverride: parseFloat(e.target.value) || 0 })}
                            className="w-full form-input py-1.5 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pb-0.5">
                          <button
                            onClick={handleEdit}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 sm:px-5 py-3.5 font-bold text-surface-900">{r.roomNumber}</td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="text-sm font-medium text-surface-900">{r.roomType?.name || typeName(r.roomTypeId)}</div>
                        <div className="text-xs text-surface-500">{r.floor?.name || floorName(r.floorId)}</div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'available'   ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'occupied'    ? 'bg-amber-100 text-amber-700' :
                          r.status === 'dirty'       ? 'bg-orange-100 text-orange-700' :
                          r.status === 'cleaning'    ? 'bg-violet-100 text-violet-700' :
                          r.status === 'blocked'     ? 'bg-red-100 text-red-700' :
                          r.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                                       'bg-surface-100 text-surface-600'
                        }`}>
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="font-bold text-surface-900 italic">
                          ₹{(r as any).rateOverride || r.roomType?.baseRate || 0}
                        </div>
                        {(r as any).rateOverride > 0 && <div className="text-[10px] text-emerald-600 font-semibold uppercase">Custom Rate</div>}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-all">
                          <button onClick={() => startEdit(r)} className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
        <div className="flex flex-wrap items-center gap-3 py-3 px-4 rounded-xl bg-primary-50/50 border border-primary-100 shadow-inner">
          <div className="shrink-0">
            <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block ml-1">Room #</label>
            <input type="text" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" className="w-24 form-input py-1.5 text-sm font-bold" autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block ml-1">Floor</label>
            <select value={form.floorId} onChange={e => setForm({ ...form, floorId: e.target.value })} className="w-full form-select py-1.5 text-sm">
              {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] uppercase font-bold text-surface-400 mb-1 block ml-1">Type</label>
            <select value={form.roomTypeId} onChange={e => setForm({ ...form, roomTypeId: e.target.value })} className="w-full form-select py-1.5 text-sm">
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="pt-5">
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary-200 transition-all active:scale-95">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Room
            </button>
          </div>
          <button onClick={() => setShowAdd(false)} className="mt-5 p-2 text-surface-400 hover:bg-surface-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button 
          onClick={noPrereqs ? undefined : openAdd}
          disabled={noPrereqs}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl border border-dashed transition-all w-full justify-center ${
            noPrereqs 
              ? 'border-surface-200 text-surface-400 bg-surface-50/50 cursor-not-allowed opacity-80' 
              : 'border-primary-200 text-primary-600 hover:text-primary-700 hover:bg-primary-50'
          }`}
        >
          <Plus className="w-4 h-4" /> 
          {noPrereqs ? 'Add Room (Requires Floor & Room Type)' : 'Add Room'}
        </button>
      )}
    </div>
  );
}

