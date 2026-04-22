'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Search, X, Loader2, CheckCircle, XCircle, Eye, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { bookingsApi, roomsApi } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/constants';

interface Booking {
  id: string; bookingNumber: string; guestName: string; guestPhone: string; guestEmail: string;
  checkInDate: string; checkOutDate: string; numRooms: number; numAdults: number; numChildren: number;
  totalAmount: number; status: string; source: string; notes?: string;
  bookingRooms?: any[];
}

export default function BookingsPage() {
  const t = useTranslations('Dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Walk-in State
  const [showWalkInCard, setShowWalkInCard] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ 
    guestName: '', 
    countryCode: '+91',
    guestPhone: '', 
    roomId: '', 
    durationValue: 1, 
    durationUnit: 'days', 
    paymentMode: 'cash' 
  });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  useEffect(() => {
    if (showWalkInCard && availableRooms.length === 0) {
      roomsApi.getRooms({ status: 'available' })
        .then(res => setAvailableRooms(res.data || []))
        .catch(console.error);
    }
  }, [showWalkInCard, availableRooms.length]);

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWalkIn(true);
    try {
      // Format phone number correctly (combine code + digits, strip whitespace)
      const cleanPhone = walkInForm.guestPhone.replace(/\D/g, '');
      const formattedPayload = {
        ...walkInForm,
        guestPhone: `${walkInForm.countryCode}${cleanPhone}`
      };

      await bookingsApi.walkIn(formattedPayload);
      toast.success(t('walkInSuccess') || 'Walk-in booking created and checked in successfully!');
      setShowWalkInCard(false);
      setWalkInForm({ guestName: '', countryCode: '+91', guestPhone: '', roomId: '', durationValue: 1, durationUnit: 'days', paymentMode: 'cash' });
      setRoomSearch('');
      fetchBookings();
      // Refetch available rooms next time
      setAvailableRooms([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process walk-in');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const fetchBookings = useCallback(async () => {
    try {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilter) params.status = statusFilter;
      const res = await bookingsApi.list(params);
      if (res.success) setBookings(res.data || []);
    } catch (err) {
      console.error('Bookings fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = searchQuery
    ? bookings.filter((b) =>
        b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.guestPhone?.includes(searchQuery)
      )
    : bookings;

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending_confirmation: { label: 'Pending', class: 'badge-warning' },
    confirmed: { label: 'Confirmed', class: 'badge-info' },
    checked_in: { label: 'Checked In', class: 'badge-success' },
    checked_out: { label: 'Checked Out', class: 'badge bg-surface-500/20 text-surface-400 border border-surface-500/20' },
    cancelled: { label: 'Cancelled', class: 'badge-danger' },
    no_show: { label: 'No Show', class: 'badge-danger' },
  };

  async function handleConfirm(id: string) {
    try {
      await bookingsApi.confirm(id);
      fetchBookings();
      setSelectedBooking(null);
      toast.success(t('bookingConfirmed') || 'Booking confirmed');
    } catch (err: any) { toast.error(err.message || t('actionFailed')); }
  }

  async function handleCancel(id: string, reason?: string) {
    try {
      await bookingsApi.cancel(id, reason || undefined);
      fetchBookings();
      setSelectedBooking(null);
      toast.success(t('bookingCancelled') || 'Booking cancelled');
    } catch (err: any) { toast.error(err.message || t('actionFailed')); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Bookings</h1>
          <p className="text-surface-400">Manage all reservations and walk-ins</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowWalkInCard(!showWalkInCard)} 
            className={`btn-secondary flex items-center gap-2.5 font-semibold !px-5 !py-2.5 ${
              showWalkInCard 
                ? '!bg-amber-50 !border-amber-200 !text-amber-700' 
                : 'hover:!bg-amber-50 hover:!border-amber-200 hover:!text-amber-700'
            } transition-all duration-300`}
          >
            <Zap className={`w-4 h-4 ${showWalkInCard ? 'text-amber-500' : 'text-amber-500'}`} />
            {t('quickWalkIn') || 'Quick Walk-in'}
          </button>
          <button onClick={() => setShowNewBooking(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('newBooking') || 'New Booking'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showWalkInCard && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="glass-card relative overflow-hidden mb-6" style={{ borderTop: '3px solid', borderImage: 'linear-gradient(90deg, #f59e0b, #f97316, #ef4444) 1' }}>
              {/* Ambient Glow */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-400/[0.06] blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary-400/[0.04] blur-[80px] rounded-full pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between p-5 md:p-6 pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-surface-900 leading-tight tracking-tight">
                      {t('expressWalkIn') || 'Express Walk-in'}
                    </h3>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {t('rapidCheckin') || 'Book & check-in a guest in under 30 seconds'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWalkInCard(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 hover:border-surface-300 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all duration-200"
                  type="button"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleWalkInSubmit} className="p-5 md:p-6 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 md:gap-5">
                  {/* Guest Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      {t('guestName') || 'Guest Name'} <span className="text-red-400">*</span>
                    </label>
                    <input 
                      required 
                      placeholder={t('guestNamePlaceholder') || 'e.g. Rajesh Kumar'}
                      className="input-field !h-11 text-sm" 
                      value={walkInForm.guestName} 
                      onChange={e => setWalkInForm({...walkInForm, guestName: e.target.value})} 
                    />
                  </div>
                  
                  {/* Phone with Country Code */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      {t('phoneNumber') || 'Phone Number'} <span className="text-red-400">*</span>
                    </label>
                    <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all duration-200 overflow-hidden">
                      <select 
                        value={walkInForm.countryCode} 
                        onChange={e => setWalkInForm({...walkInForm, countryCode: e.target.value})}
                        className="h-11 w-[78px] bg-transparent border-r border-surface-200 text-surface-600 text-sm px-2 outline-none cursor-pointer hover:bg-surface-100/50 transition-colors shrink-0"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input 
                        required 
                        type="tel" 
                        inputMode="numeric"
                        maxLength={10}
                        placeholder={t('mobilePlaceholder') || '98765 43210'}
                        className="flex-1 h-11 px-3 bg-transparent text-sm text-surface-800 placeholder:text-surface-400 outline-none" 
                        value={walkInForm.guestPhone} 
                        onChange={e => setWalkInForm({...walkInForm, guestPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                      />
                    </div>
                  </div>

                  {/* Room Selection — Custom styled dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      {t('roomSelection') || 'Assign Room'} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none z-[1]" />
                      <input 
                        required
                        list="walkin-rooms"
                        placeholder={t('roomPlaceholder') || 'Search room...'}
                        className="input-field !h-11 !pl-9 text-sm"
                        value={roomSearch}
                        onChange={e => {
                          setRoomSearch(e.target.value);
                          const match = availableRooms.find(r => `${r.roomNumber} — ${r.roomType?.name}` === e.target.value);
                          setWalkInForm(prev => ({ ...prev, roomId: match ? match.id : '' }));
                        }}
                      />
                      <datalist id="walkin-rooms">
                        {availableRooms.filter(r => r.status === 'available').map(r => (
                          <option key={r.id} value={`${r.roomNumber} — ${r.roomType?.name}`} />
                        ))}
                      </datalist>
                      {walkInForm.roomId && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      {t('stayDuration') || 'Stay Duration'}
                    </label>
                    <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all duration-200 overflow-hidden">
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        max="365"
                        inputMode="numeric"
                        className="w-16 h-11 text-center text-sm font-semibold text-surface-800 bg-transparent border-r border-surface-200 outline-none shrink-0" 
                        value={walkInForm.durationValue} 
                        onChange={e => setWalkInForm({...walkInForm, durationValue: Math.max(1, parseInt(e.target.value) || 1)})} 
                      />
                      <select 
                        className="flex-1 h-11 bg-transparent text-sm px-3 outline-none cursor-pointer text-surface-700 hover:bg-surface-100/50 transition-colors"
                        value={walkInForm.durationUnit} 
                        onChange={e => setWalkInForm({...walkInForm, durationUnit: e.target.value as 'days' | 'months'})}
                      >
                        <option value="days">{t('nights') || 'Nights'}</option>
                        <option value="months">{t('months') || 'Months'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      {t('paymentMethod') || 'Payment'}
                    </label>
                    <select 
                      required 
                      className="input-field !h-11 text-sm cursor-pointer" 
                      value={walkInForm.paymentMode} 
                      onChange={e => setWalkInForm({...walkInForm, paymentMode: e.target.value})}
                    >
                      <option value="cash">💵 {t('cash') || 'Cash'}</option>
                      <option value="upi">📱 {t('upi') || 'UPI'}</option>
                      <option value="card">💳 {t('card') || 'Card'}</option>
                    </select>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      disabled={submittingWalkIn || !walkInForm.roomId} 
                      className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {submittingWalkIn ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>{t('bookAndCheckin') || 'Book & Check-in'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Available rooms count indicator */}
                {availableRooms.length > 0 && (
                  <p className="text-xs text-surface-400 mt-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {availableRooms.filter(r => r.status === 'available').length} {t('roomsAvailable') || 'rooms available for immediate check-in'}
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search guest name, phone, or booking ID..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 py-2.5" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto py-2.5 min-w-[150px]">
          <option value="">All Status</option>
          <option value="pending_confirmation">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="glass-card p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.04] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-surface-400 mb-4">Create your first booking to see it here.</p>
          <button onClick={() => setShowNewBooking(true)} className="btn-primary">New Booking</button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Booking</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Guest</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Check-in</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Check-out</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Rooms</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(booking)}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-primary-400">{booking.bookingNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{booking.guestName}</p>
                      <p className="text-xs text-surface-500">{booking.guestPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-300">
                      {new Date(booking.checkInDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-300">
                      {new Date(booking.checkOutDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.bookingRooms?.map((br: any) => br.roomType?.name || br.room?.roomNumber).join(', ') || `${booking.numRooms} room(s)`}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={statusLabels[booking.status]?.class || 'badge'}>
                        {statusLabels[booking.status]?.label || booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Eye className="w-4 h-4 text-surface-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBooking && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onCreated={() => { setShowNewBooking(false); fetchBookings(); }}
        />
      )}

      {/* Booking Detail Slide-over */}
      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}


// ── New Booking Modal ─────────────────────────────────────────
function NewBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('Dashboard');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [source, setSource] = useState('walk_in');
  const [notes, setNotes] = useState('');
  
  // Cart state for Group Bookings (multiple room types per reservation)
  const [roomSelections, setRoomSelections] = useState<{ roomTypeId: string; quantity: number; extraBeds: number }[]>([]);
  
  // Current item being added to cart
  const [activeRoomTypeId, setActiveRoomTypeId] = useState('');
  const [activeQuantity, setActiveQuantity] = useState('1');
  const [activeExtraBeds, setActiveExtraBeds] = useState('0');

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.getRoomTypes().then((res) => {
      if (res.success) {
        setRoomTypes(res.data || []);
        if (res.data?.length) setActiveRoomTypeId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  function handleAddRoom() {
    if (!activeRoomTypeId) return;
    setRoomSelections(prev => [
      ...prev,
      { roomTypeId: activeRoomTypeId, quantity: parseInt(activeQuantity), extraBeds: parseInt(activeExtraBeds) }
    ]);
    // Reset active fields slightly to encourage flow
    setActiveQuantity('1');
    setActiveExtraBeds('0');
  }

  function handleRemoveRoom(index: number) {
    setRoomSelections(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !checkIn || !checkOut) { setError('Fill required fields'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out must be after check-in'); return; }
    if (roomSelections.length === 0) { setError('At least one room must be added to the booking'); return; }

    setSaving(true);
    setError('');
    
    // Format room selections array for Zod schema (expand quantities into individual items)
    const expandedSelections: any[] = [];
    let totalAdults = 0;
    
    roomSelections.forEach(sel => {
      const rt = roomTypes.find(r => r.id === sel.roomTypeId);
      for (let i = 0; i < sel.quantity; i++) {
        expandedSelections.push({ roomTypeId: sel.roomTypeId, extraBeds: sel.extraBeds });
        totalAdults += (rt?.baseOccupancy || 2) + sel.extraBeds;
      }
    });

    try {
      await bookingsApi.create({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numAdults: totalAdults, // Roughly estimate adults based on selected beds
        numChildren: 0,
        roomSelections: expandedSelections,
        source,
        notes: notes.trim() || undefined,
      });
      onCreated();
      toast.success(t('bookingCreated') || 'Booking created successfully');
    } catch (err: any) {
      setError(err.message || t('actionFailed') || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-surface-900/90 backdrop-blur z-10 px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-lg font-display font-bold">New Booking</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          {/* Guest Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">1. Guest Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="input-field" required placeholder="Guest full name *" />
              </div>
              <div>
                <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="input-field" placeholder="Phone number" />
              </div>
              <div>
                <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="input-field" placeholder="Email address" />
              </div>
            </div>
          </div>

          {/* Stay Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">2. Stay Dates & Source</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-surface-400 mb-1">Check-in *</label>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Check-out *</label>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">Source</label>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
                  <option value="walk_in">Walk-in</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="ota_booking_com">Booking.com</option>
                  <option value="ota_makemytrip">MakeMyTrip</option>
                  <option value="ota_goibibo">Goibibo</option>
                  <option value="agent">Travel Agent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Room Selection Cart */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">3. Room Assignments (Group Booking)</h3>
            
            {roomSelections.length > 0 && (
              <div className="mb-4 space-y-2">
                {roomSelections.map((sel, idx) => {
                  const rt = roomTypes.find(r => r.id === sel.roomTypeId);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                      <div>
                        <p className="text-sm font-medium text-primary-100">{sel.quantity}x {rt?.name || 'Unknown Room'}</p>
                        <p className="text-xs text-primary-300/70">{sel.extraBeds > 0 ? `${sel.extraBeds} extra bed(s) per room` : 'No extra beds'}</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveRoom(idx)} className="p-1.5 text-primary-400 hover:bg-primary-500/20 rounded-md transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 items-end p-4 rounded-xl border border-white/[0.06] bg-surface-800/50">
              <div className="flex-1">
                <label className="block text-xs text-surface-400 mb-1">Add Room Type</label>
                <select value={activeRoomTypeId} onChange={(e) => setActiveRoomTypeId(e.target.value)} className="input-field text-sm">
                  {roomTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs text-surface-400 mb-1">Qty</label>
                <input type="number" value={activeQuantity} onChange={(e) => setActiveQuantity(e.target.value)} className="input-field text-sm" min="1" />
              </div>
              <div className="w-24">
                <label className="block text-xs text-surface-400 mb-1">Extra Beds</label>
                <input type="number" value={activeExtraBeds} onChange={(e) => setActiveExtraBeds(e.target.value)} className="input-field text-sm" min="0" max="5" />
              </div>
              <button type="button" onClick={handleAddRoom} className="btn-secondary h-[42px] px-4 whitespace-nowrap">
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Special Requests & Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Optional notes for staff..." />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || roomSelections.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Confirm & Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Booking Detail Slide-over ─────────────────────────────────
function BookingDetail({ booking, onClose, onConfirm, onCancel }: {
  booking: Booking; onClose: () => void;
  onConfirm: (id: string) => void; onCancel: (id: string, reason?: string) => void;
}) {
  const t = useTranslations('Dashboard');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border-l border-white/[0.08] w-full max-w-md h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-display font-bold">Booking Details</h2>
            <p className="text-sm text-primary-400 font-mono">{booking.bookingNumber}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-6">
          {/* Guest */}
          <section>
            <h3 className="text-xs uppercase text-surface-500 font-medium mb-3">Guest Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-surface-400">Name</span><span>{booking.guestName}</span></div>
              {booking.guestPhone && <div className="flex justify-between text-sm"><span className="text-surface-400">Phone</span><span>{booking.guestPhone}</span></div>}
              {booking.guestEmail && <div className="flex justify-between text-sm"><span className="text-surface-400">Email</span><span>{booking.guestEmail}</span></div>}
            </div>
          </section>

          {/* Stay */}
          <section>
            <h3 className="text-xs uppercase text-surface-500 font-medium mb-3">Stay Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-surface-400">Check-in</span><span>{new Date(booking.checkInDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">Check-out</span><span>{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">Nights</span><span>{nights}</span></div>
              <div className="flex flex-col gap-2 text-sm pt-2 pb-2">
                <div className="flex justify-between font-medium"><span className="text-surface-400">Rooms Booked ({booking.numRooms})</span></div>
                {booking.bookingRooms && booking.bookingRooms.length > 0 ? (
                  <div className="pl-3 border-l-2 border-primary-500/30 space-y-1.5 py-1">
                    {booking.bookingRooms.map((br: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-surface-200">
                        <span>{br.roomType?.name || 'Standard'} {br.room ? `(Rm ${br.room.roomNumber})` : ''}</span>
                        {br.extraBeds > 0 ? <span className="text-primary-400">+{br.extraBeds} extra bed</span> : <span className="text-surface-500">Standard</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-right text-surface-300">{booking.numRooms} Room(s) Counted</div>
                )}
              </div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">Guests</span><span>{booking.numAdults} adult{booking.numAdults !== 1 ? 's' : ''}{booking.numChildren ? `, ${booking.numChildren} child${booking.numChildren !== 1 ? 'ren' : ''}` : ''}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-400">Source</span><span className="capitalize">{booking.source?.replace(/_/g, ' ')}</span></div>
            </div>
          </section>

          {/* Amount */}
          <section>
            <h3 className="text-xs uppercase text-surface-500 font-medium mb-3">Billing</h3>
            <div className="flex justify-between text-lg font-display font-bold">
              <span className="text-surface-400">Total</span>
              <span>₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </section>

          {/* Notes */}
          {booking.notes && (
            <section>
              <h3 className="text-xs uppercase text-surface-500 font-medium mb-2">Notes</h3>
              <p className="text-sm text-surface-300 bg-white/[0.04] rounded-xl p-3">{booking.notes}</p>
            </section>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            {booking.status === 'pending_confirmation' && (
              <button onClick={() => onConfirm(booking.id)} className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Confirm Booking
              </button>
            )}
            {['pending_confirmation', 'confirmed'].includes(booking.status) && (
              !showCancelPrompt ? (
                <button onClick={() => setShowCancelPrompt(true)} className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <XCircle className="w-4 h-4" /> Cancel Booking
                </button>
              ) : (
                <div className="space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <label className="block text-sm font-medium text-red-400 mb-1">{t('cancellationReason') || 'Cancellation Reason (Optional)'}</label>
                  <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="input-field w-full text-sm" placeholder={t('enterReason') || 'Enter reason...'} autoFocus />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancelPrompt(false)} className="btn-secondary flex-1 py-2 text-sm">{t('cancel') || 'Cancel'}</button>
                    <button onClick={() => onCancel(booking.id, cancelReason)} className="w-full flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors text-sm font-medium">
                      {t('confirmCancel') || 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
