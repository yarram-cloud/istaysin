'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Plus, X, Loader2, Phone, Mail, Calendar, Printer, User, Globe, ArrowRight, FileText, Shield, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { guestsApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { COUNTRY_CODES } from '@/lib/constants';

interface Guest {
  id: string; fullName: string; phone?: string; email?: string;
  totalStays?: number; lastVisit?: string; createdAt: string;
  idProofType?: string; idProofNumber?: string; nationality?: string;
  address?: string; city?: string; state?: string; pincode?: string;
  dateOfBirth?: string; gender?: string;
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
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">{t('guests')}</h1>
          <p className="text-sm text-surface-500">{t('guestsSub')}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> {t('printRegister')}
          </button>
          <button
            onClick={() => { setShowAdd(!showAdd); setSelectedGuest(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              showAdd
                ? 'bg-primary-100 border border-primary-200 text-primary-700'
                : 'bg-primary-700 text-white hover:bg-primary-600 border border-primary-700'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Guest
          </button>
        </div>
      </div>

      {/* ── Inline Add Guest Form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <AddGuestInline
              onClose={() => setShowAdd(false)}
              onCreated={() => { setShowAdd(false); fetchGuests(); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search by name, phone, or email..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
      </div>

      {/* Guest List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />)}
        </div>
      ) : guests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-surface-900">{searchQuery ? 'No guests found' : 'No guests yet'}</h3>
          <p className="text-sm text-surface-500 mb-4">{searchQuery ? 'Try a different search term.' : 'Guest profiles will appear here as bookings are created.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider hidden print:table-cell">{t('srNo')}</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider hidden lg:table-cell">Stays</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {guests.map((guest, index) => (
                  <tr key={guest.id}
                    className={`hover:bg-primary-50/30 cursor-pointer transition-colors ${selectedGuest?.id === guest.id ? 'bg-primary-50/50' : ''}`}
                    onClick={() => { setSelectedGuest(selectedGuest?.id === guest.id ? null : guest); setShowAdd(false); }}>
                    <td className="px-5 py-3.5 text-sm text-surface-400 hidden print:table-cell">{index + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                          {guest.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-900">{guest.fullName}</p>
                          {guest.nationality && guest.nationality !== 'Indian' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">{guest.nationality}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-600 hidden sm:table-cell">{guest.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-surface-600 hidden md:table-cell">{guest.email || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-surface-900 font-medium hidden lg:table-cell">{guest.totalStays || 0}</td>
                    <td className="px-5 py-3.5 text-sm text-surface-500 hidden md:table-cell">
                      {new Date(guest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Inline Guest Detail Panel ── */}
      <AnimatePresence>
        {selectedGuest && (
          <motion.div
            key={selectedGuest.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
          >
            <GuestDetailPanel 
              guest={selectedGuest} 
              onClose={() => setSelectedGuest(null)} 
              onUpdated={() => { fetchGuests(); setSelectedGuest(null); }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inline Add Guest Form ─────────────────────────────────────
function AddGuestInline({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [idProofType, setIdProofType] = useState('aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isForeigner = nationality !== 'Indian' && nationality !== 'India';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await guestsApi.create({
        fullName: fullName.trim(),
        phone: phoneNumber ? `${countryCode}${phoneNumber.replace(/\D/g, '')}` : undefined,
        email: email.trim() || undefined,
        nationality: nationality || 'Indian',
        idProofType: idProofNumber ? idProofType : undefined,
        idProofNumber: idProofNumber.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.success('Guest added successfully');
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to add guest');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{ borderTop: '3px solid var(--color-primary-500, #166534)' }}>
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-surface-900">Add Guest</h3>
            <p className="text-xs text-surface-500 mt-0.5">Create a guest profile for Sarai Act compliance</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>}

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Guest full name"
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Phone</label>
            <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all overflow-hidden">
              <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                tabIndex={-1}
                className="h-10 w-[78px] bg-transparent border-r border-surface-200 text-surface-700 text-sm px-2 outline-none cursor-pointer shrink-0">
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input type="tel" inputMode="numeric" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="98765 43210"
                className="flex-1 h-10 px-3 text-sm text-surface-900 bg-transparent outline-none min-w-0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@email.com"
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Nationality</label>
            <select value={nationality} onChange={(e) => setNationality(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
              <option value="Indian">Indian</option>
              <option value="Afghan">Afghan</option>
              <option value="American">American</option>
              <option value="Australian">Australian</option>
              <option value="Bangladeshi">Bangladeshi</option>
              <option value="British">British</option>
              <option value="Canadian">Canadian</option>
              <option value="Chinese">Chinese</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
              <option value="Nepali">Nepali</option>
              <option value="Pakistani">Pakistani</option>
              <option value="Russian">Russian</option>
              <option value="Sri Lankan">Sri Lankan</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
              ID Proof Type{isForeigner && <span className="ml-1 text-orange-500">*</span>}
            </label>
            <select value={idProofType} onChange={(e) => setIdProofType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
              {isForeigner ? (
                <>
                  <option value="passport">Passport</option>
                  <option value="visa">Visa</option>
                </>
              ) : (
                <>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">ID Number</label>
            <input value={idProofNumber} onChange={(e) => setIdProofNumber(e.target.value)} placeholder="Optional"
              className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Permanent Address (for Sarai Act Register)</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State, PIN"
            className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
        </div>

        {isForeigner && (
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" />
            Foreign national detected — C-Form submission to FRRO will be required after check-in.
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-surface-100">
          <button type="button" onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Guest
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Inline Guest Detail Panel ─────────────────────────────────
function GuestDetailPanel({ guest, onClose, onUpdated }: { guest: Guest; onClose: () => void; onUpdated?: () => void }) {
  const isForeigner = guest.nationality && !['Indian', 'India', 'IND'].includes(guest.nationality);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(guest.fullName || '');
  const initialPhone = guest.phone || '';
  const initialCountryCode = COUNTRY_CODES.find(c => initialPhone.startsWith(c.code))?.code || '+91';
  const initialPhoneNumber = initialPhone.startsWith(initialCountryCode) ? initialPhone.slice(initialCountryCode.length) : initialPhone;
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(guest.email || '');
  const [nationality, setNationality] = useState(guest.nationality || 'Indian');
  const [dateOfBirth, setDateOfBirth] = useState(guest.dateOfBirth ? new Date(guest.dateOfBirth).toISOString().split('T')[0] : '');
  const [gender, setGender] = useState(guest.gender || '');
  const [idProofType, setIdProofType] = useState(guest.idProofType || '');
  const [idProofNumber, setIdProofNumber] = useState(guest.idProofNumber || '');
  const [address, setAddress] = useState(guest.address || '');
  const [city, setCity] = useState(guest.city || '');
  const [state, setState] = useState(guest.state || '');
  const [pincode, setPincode] = useState(guest.pincode || '');

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await guestsApi.update(guest.id, {
        fullName, 
        phone: phoneNumber ? `${countryCode}${phoneNumber.replace(/\D/g, '')}` : undefined, 
        email, nationality, dateOfBirth, gender, idProofType, idProofNumber, address, city, state, pincode
      });
      toast.success('Guest updated');
      setIsEditing(false);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update guest');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-lg overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
            {guest.fullName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-bold text-surface-900">{guest.fullName}</h2>
              {isForeigner && !isEditing && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase tracking-wider border border-orange-200">
                  Foreign National
                </span>
              )}
            </div>
            {!isEditing && (
              <p className="text-xs text-surface-500 mt-0.5">
                Guest since {new Date(guest.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                {(guest.totalStays || 0) > 0 && ` · ${guest.totalStays} stay${guest.totalStays !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 bg-white text-xs font-medium text-surface-600 hover:bg-surface-50 transition-all">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Phone</label>
              <div className="flex rounded-xl border border-surface-200 bg-white focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all overflow-hidden">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  tabIndex={-1}
                  className="h-10 w-[78px] bg-surface-50 border-r border-surface-200 text-surface-700 text-sm px-2 outline-none cursor-pointer shrink-0">
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input type="tel" inputMode="numeric" value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 h-10 px-3 text-sm text-surface-900 bg-transparent outline-none min-w-0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Nationality</label>
              <input value={nationality} onChange={e => setNationality(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">ID Proof Type</label>
              <select value={idProofType} onChange={e => setIdProofType(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm">
                <option value="">Select ID Type</option>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">ID Proof Number</label>
              <input value={idProofNumber} onChange={e => setIdProofNumber(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">State</label>
                <input value={state} onChange={e => setState(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Pincode</label>
                <input value={pincode} onChange={e => setPincode(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2 mt-4 border-t border-surface-100">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Contact</h3>
            {guest.phone ? (
              <a href={`tel:${guest.phone}`} className="flex items-center gap-2.5 text-sm text-primary-600 hover:text-primary-500 transition-colors">
                <Phone className="w-4 h-4" /> {guest.phone}
              </a>
            ) : <p className="text-sm text-surface-400">No phone recorded</p>}
            {guest.email ? (
              <a href={`mailto:${guest.email}`} className="flex items-center gap-2.5 text-sm text-primary-600 hover:text-primary-500 transition-colors">
                <Mail className="w-4 h-4" /> {guest.email}
              </a>
            ) : <p className="text-sm text-surface-400">No email recorded</p>}
          </div>

          {/* ID & Nationality */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Identity</h3>
            <div className="flex items-center gap-2.5 text-sm text-surface-700">
              <Globe className="w-4 h-4 text-surface-400" />
              <span>{guest.nationality || 'Indian'} {guest.gender ? `• ${guest.gender}` : ''} {guest.dateOfBirth ? `• DOB: ${new Date(guest.dateOfBirth).toLocaleDateString('en-IN')}` : ''}</span>
            </div>
            {guest.idProofType && (
              <div className="px-3 py-2 rounded-xl bg-surface-50 border border-surface-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-surface-500 capitalize">{guest.idProofType?.replace(/_/g, ' ')}</p>
                  {guest.idProofNumber && <p className="text-sm font-mono font-medium text-surface-900 mt-0.5">{guest.idProofNumber}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          {(guest.address || guest.city || guest.state || guest.pincode) && (
            <div className="sm:col-span-2">
              <h3 className="text-[10px] uppercase font-bold text-surface-400 tracking-wider mb-2">Address</h3>
              <p className="text-sm text-surface-700 bg-surface-50 rounded-xl px-3 py-2 border border-surface-100">
                {[guest.address, guest.city, guest.state, guest.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* FRRO notice for foreigners */}
          {isForeigner && (
            <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
              <Shield className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">C-Form Required</p>
                <p className="text-xs text-orange-600 mt-0.5">Foreign national guest — C-Form submission to FRRO is mandatory within 24 hours of check-in. Submit from the booking detail view.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
