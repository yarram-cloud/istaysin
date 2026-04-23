'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Plus, X, Loader2, Phone, Mail, Calendar, Printer } from 'lucide-react';
import { guestsApi } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Guest {
  id: string; fullName: string; phone?: string; email?: string;
  totalStays?: number; lastVisit?: string; createdAt: string;
  idProofType?: string; idProofNumber?: string;
}

export default function GuestsPage() {
  const t = useTranslations('Dashboard');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchGuests = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await guestsApi.list(params);
      if (res.success) setGuests(res.data || []);
    } catch (err) { console.error('Guests fetch failed:', err); }
    finally { setLoading(false); }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => fetchGuests(), searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchGuests, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">{t('guests')}</h1>
          <p className="text-surface-400">{t('guestsSub')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2 print:hidden"
          >
            <Printer className="w-4 h-4" /> {t('printRegister')}
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 print:hidden">
            <Plus className="w-4 h-4" /> Add Guest
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search by name, phone, or email..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-10 py-2.5" />
      </div>

      {/* Guest List */}
      {loading ? (
        <div className="glass-card p-6 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/[0.04] rounded-lg animate-pulse" />)}
        </div>
      ) : guests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'No guests found' : 'No guests yet'}</h3>
          <p className="text-surface-400 mb-4">{searchQuery ? 'Try a different search term.' : 'Guest profiles will appear here as bookings are created.'}</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase hidden print:table-cell">{t('srNo')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Stays</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {guests.map((guest, index) => (
                <tr key={guest.id} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => setSelectedGuest(guest)}>
                  <td className="px-6 py-4 text-sm text-surface-400 hidden print:table-cell">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-sm font-medium text-primary-400">
                        {guest.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium">{guest.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-300">{guest.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-surface-300">{guest.email || '-'}</td>
                  <td className="px-6 py-4 text-sm">{guest.totalStays || 0}</td>
                  <td className="px-6 py-4 text-sm text-surface-400">
                    {new Date(guest.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Guest Modal */}
      {showAdd && <AddGuestModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); fetchGuests(); }} />}

      {/* Guest Detail */}
      {selectedGuest && <GuestDetail guest={selectedGuest} onClose={() => setSelectedGuest(null)} />}
    </div>
  );
}

function AddGuestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idProofType, setIdProofType] = useState('aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await guestsApi.create({
        fullName: fullName.trim(), phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        idProofType: idProofNumber ? idProofType : undefined,
        idProofNumber: idProofNumber.trim() || undefined,
      });
      onCreated();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Add Guest</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Full Name *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">ID Proof Type</label>
              <select value={idProofType} onChange={(e) => setIdProofType(e.target.value)} className="input-field">
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">ID Number</label>
              <input value={idProofNumber} onChange={(e) => setIdProofNumber(e.target.value)} className="input-field" placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GuestDetail({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border-l border-white/[0.08] w-full max-w-md h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">Guest Profile</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-600/20 flex items-center justify-center text-xl font-bold text-primary-400">
              {guest.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{guest.fullName}</h3>
              <p className="text-sm text-surface-400">Guest since {new Date(guest.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-3">
            {guest.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-surface-500" /><span>{guest.phone}</span>
              </div>
            )}
            {guest.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-surface-500" /><span>{guest.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-surface-500" /><span>{guest.totalStays || 0} stay(s)</span>
            </div>
          </div>

          {guest.idProofType && (
            <section>
              <h4 className="text-xs uppercase text-surface-500 font-medium mb-2">ID Proof</h4>
              <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <p className="text-sm capitalize">{guest.idProofType?.replace(/_/g, ' ')}</p>
                {guest.idProofNumber && <p className="text-xs text-surface-400 mt-0.5">{guest.idProofNumber}</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
