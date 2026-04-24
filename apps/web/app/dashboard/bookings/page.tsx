'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Search, X, Loader2, CheckCircle, XCircle, Eye, Zap, Globe, Phone, Clock, Ban, Building2, Edit2, Save, ChevronDown, ChevronRight, Mail, User, BedDouble, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { bookingsApi, roomsApi, checkinApi, complianceApi } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/constants';
import { usePropertyType } from '@/lib/property-context';

const statusLabels: Record<string, { label: string; class: string }> = {
  pending_confirmation: { label: 'Pending',     class: 'bg-amber-100 text-amber-700 border border-amber-200' },
  confirmed:            { label: 'Confirmed',   class: 'bg-primary-100 text-primary-700 border border-primary-200' },
  checked_in:           { label: 'Checked In',  class: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  checked_out:          { label: 'Checked Out', class: 'bg-surface-100 text-surface-600 border border-surface-200' },
  cancelled:            { label: 'Cancelled',   class: 'bg-red-100 text-red-700 border border-red-200' },
  no_show:              { label: 'No Show',     class: 'bg-red-100 text-red-700 border border-red-200' },
};

interface Booking {
  id: string; bookingNumber: string; guestName: string; guestPhone: string; guestEmail: string;
  checkInDate: string; checkOutDate: string; numRooms: number; numAdults: number; numChildren: number;
  totalAmount: number; discountAmount?: number; status: string; source: string; notes?: string;
  bookingRooms?: any[]; bookingGuests?: any[];
}

export default function BookingsPage() {
  const t = useTranslations('Dashboard');
  const { isLongStay } = usePropertyType();
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
    durationUnit: (isLongStay ? 'months' : 'days') as 'days' | 'months', 
    paymentMode: 'cash',
    deposit: 0,
  });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Read URL params for pre-selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const selected = params.get('selected');
    if (status) setStatusFilter(status);
    if (selected) {
      // Will be resolved after bookings load
      bookingsApi.get(selected).then(res => {
        if (res.success && res.data) setSelectedBooking(res.data);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (showWalkInCard && availableRooms.length === 0) {
      roomsApi.getRooms({ status: 'available' })
        .then(res => setAvailableRooms(res.data || []))
        .catch(() => {});
    }
  }, [showWalkInCard, availableRooms.length]);

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWalkIn(true);
    try {
      const cleanPhone = walkInForm.guestPhone.replace(/\D/g, '');
      const formattedPayload = {
        ...walkInForm,
        guestPhone: `${walkInForm.countryCode}${cleanPhone}`
      };
      await bookingsApi.walkIn(formattedPayload);
      toast.success(t('walkInSuccess') || 'Walk-in booking created and checked in successfully!');
      setShowWalkInCard(false);
      setWalkInForm({ guestName: '', countryCode: '+91', guestPhone: '', roomId: '', durationValue: 1, durationUnit: 'days', paymentMode: 'cash', deposit: 0 });
      setRoomSearch('');
      fetchBookings();
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
    } catch {
      // silently ignore — UI stays with last known data
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Keep expanded row in sync with refreshed bookings list (functional update avoids stale closure)
  useEffect(() => {
    setSelectedBooking(prev => {
      if (!prev) return prev;
      return bookings.find(b => b.id === prev.id) ?? prev;
    });
  }, [bookings]);

  const filtered = searchQuery
    ? bookings.filter((b) =>
        b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.guestPhone?.includes(searchQuery)
      )
    : bookings;

  const payAtHotelQueue = bookings.filter((b) => {
    if (!b.notes) return false;
    try {
      const meta = JSON.parse(b.notes);
      return meta.paymentMode === 'pay_at_hotel' && ['confirmed', 'pending_confirmation'].includes(b.status);
    } catch { return false; }
  });

  function getExpiryInfo(booking: Booking): { label: string; isExpired: boolean; urgencyClass: string } {
    try {
      const meta = JSON.parse(booking.notes || '{}');
      if (!meta.expiresAt) return { label: '', isExpired: false, urgencyClass: '' };
      const expiresAt = new Date(meta.expiresAt);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      if (diffMs <= 0) return { label: 'Expired', isExpired: true, urgencyClass: 'text-red-600' };
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      if (diffHrs < 2) return { label: `${diffHrs}h ${diffMins}m left`, isExpired: false, urgencyClass: 'text-amber-600' };
      return { label: `${diffHrs}h left`, isExpired: false, urgencyClass: 'text-surface-500' };
    } catch { return { label: '', isExpired: false, urgencyClass: '' }; }
  }

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">Bookings</h1>
          <p className="text-sm text-surface-500">{isLongStay ? 'Manage tenant move-ins and bookings' : 'Manage all reservations and walk-ins'}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowWalkInCard(!showWalkInCard)} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 ${
              showWalkInCard 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'bg-white border-surface-200 text-surface-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">{isLongStay ? 'Quick Move-in' : (t('quickWalkIn') || 'Quick Walk-in')}</span>
            <span className="sm:hidden">{isLongStay ? 'Move-in' : 'Walk-in'}</span>
          </button>
          <button onClick={() => setShowNewBooking(!showNewBooking)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            showNewBooking
              ? 'bg-primary-100 border border-primary-200 text-primary-700'
              : 'bg-primary-700 text-white hover:bg-primary-600 border border-primary-700'
          }`}>
            <Plus className="w-4 h-4" /> {t('newBooking') || 'New Booking'}
          </button>
        </div>
      </div>

      {/* Walk-in Inline Card */}
      <AnimatePresence>
        {showWalkInCard && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="flex items-center justify-between p-4 sm:p-5 pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg text-surface-900 leading-tight">
                      {isLongStay ? 'Express Move-in' : (t('expressWalkIn') || 'Express Walk-in')}
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">{isLongStay ? 'Register a tenant & assign room instantly' : 'Book & check-in in under 30 seconds'}</p>
                  </div>
                </div>
                <button onClick={() => setShowWalkInCard(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all" type="button">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="p-4 sm:p-5 pt-4">
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isLongStay ? 'xl:grid-cols-[1fr_1.3fr_1fr_auto_auto_auto_auto]' : 'xl:grid-cols-[1fr_1.3fr_1fr_auto_auto_auto]'} gap-3 sm:gap-4`}>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      Guest Name <span className="text-red-400">*</span>
                    </label>
                    <input required placeholder="e.g. Rajesh Kumar"
                      className="w-full h-11 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" 
                      value={walkInForm.guestName} 
                      onChange={e => setWalkInForm({...walkInForm, guestName: e.target.value})} 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all">
                      <select value={walkInForm.countryCode} onChange={e => setWalkInForm({...walkInForm, countryCode: e.target.value})}
                        tabIndex={-1}
                        className="h-11 w-[78px] bg-transparent border-r border-surface-200 text-surface-700 text-sm px-2 outline-none cursor-pointer shrink-0">
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input required type="tel" inputMode="numeric" value={walkInForm.guestPhone} 
                        onChange={e => setWalkInForm({...walkInForm, guestPhone: e.target.value.replace(/\D/g, '')})}
                        placeholder="10 digit number" className="flex-1 h-11 px-3 text-sm text-surface-900 bg-transparent outline-none min-w-0" />
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">
                      Assign Room <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none z-[1]" />
                      <input required list="walkin-rooms" placeholder="Search room..."
                        className="w-full h-11 pl-9 pr-9 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
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
                      {walkInForm.roomId && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">{isLongStay ? 'Duration' : 'Stay Duration'}</label>
                    <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all overflow-hidden">
                      <input required type="number" min="1" max="365" inputMode="numeric"
                        className="w-16 h-11 text-center text-sm font-semibold text-surface-800 bg-transparent border-r border-surface-200 outline-none shrink-0" 
                        value={walkInForm.durationValue} 
                        onChange={e => setWalkInForm({...walkInForm, durationValue: Math.max(1, parseInt(e.target.value) || 1)})} 
                      />
                      <select className="flex-1 h-11 bg-transparent text-sm px-3 outline-none cursor-pointer text-surface-700"
                        value={walkInForm.durationUnit} 
                        onChange={e => setWalkInForm({...walkInForm, durationUnit: e.target.value as 'days' | 'months'})}>
                        <option value="days">Nights</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">Payment</label>
                    <select required className="w-full h-11 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm cursor-pointer text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30" 
                      value={walkInForm.paymentMode} 
                      onChange={e => setWalkInForm({...walkInForm, paymentMode: e.target.value})}>
                      <option value="cash">💵 Cash</option>
                      <option value="upi">📱 UPI</option>
                      <option value="card">💳 Card</option>
                    </select>
                  </div>

                  {isLongStay && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">Deposit (₹)</label>
                      <input type="number" min="0" inputMode="numeric"
                        className="w-full h-11 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                        placeholder="e.g. 5000"
                        value={walkInForm.deposit || ''}
                        onChange={e => setWalkInForm({...walkInForm, deposit: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-end">
                    <button type="submit" disabled={submittingWalkIn || !walkInForm.roomId} 
                      className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}>
                      {submittingWalkIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /><span>{isLongStay ? 'Book & Move-in' : 'Book & Check-in'}</span></>}
                    </button>
                  </div>
                </div>
                {availableRooms.length > 0 && (
                  <p className="text-xs text-surface-500 mt-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {availableRooms.filter(r => r.status === 'available').length} {isLongStay ? 'beds' : 'rooms'} available
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Booking — Inline Expandable Form ────────────────────── */}
      <AnimatePresence>
        {showNewBooking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <NewBookingInline
              onClose={() => setShowNewBooking(false)}
              onCreated={() => { setShowNewBooking(false); fetchBookings(); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pay at Hotel Queue ────────────────────────────────── */}
      {payAtHotelQueue.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Pay at Hotel Queue</h3>
                <p className="text-[11px] text-surface-500">Unconfirmed web reservations requiring follow-up</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
              {payAtHotelQueue.length} Actions
            </span>
          </div>
          <div className="divide-y divide-surface-100">
            {payAtHotelQueue.map((booking) => {
              const expiry = getExpiryInfo(booking);
              return (
                <div key={booking.id} className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-primary-50/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-semibold shrink-0">
                      {booking.guestName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{booking.guestName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={`tel:${booking.guestPhone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary-600 hover:text-primary-500 flex items-center gap-1 transition-colors">
                          <Phone className="w-3 h-3" /> {booking.guestPhone}
                        </a>
                        <span className="text-surface-300">·</span>
                        <span className="text-[11px] text-surface-500 font-mono">{booking.bookingNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 px-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-surface-500">{isLongStay ? 'Move-in' : 'Check-in'}</p>
                      <p className="text-sm font-medium text-surface-700">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-surface-500">Amount Due</p>
                      <p className="text-sm font-bold text-amber-600">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                    {expiry.label && (
                      <div className="text-right">
                        <p className="text-xs text-surface-500">Expires</p>
                        <p className={`text-xs font-medium flex items-center gap-1 ${expiry.urgencyClass}`}>
                          <Clock className="w-3 h-3" /> {expiry.label}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm(booking.id); }}
                      className="h-8 px-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleCancel(booking.id, 'No-show / Pay at Hotel expired'); }}
                      className="h-8 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-200">
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search guest name, phone, or booking ID..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm text-surface-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
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
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
          <CalendarDays className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-surface-900">No bookings found</h3>
          <p className="text-surface-500 mb-4 text-sm">Create your first booking to see it here.</p>
          <button onClick={() => setShowNewBooking(true)} className="bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors">New Booking</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Booking</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Guest</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">{isLongStay ? 'Move-in' : 'Check-in'}</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">{isLongStay ? 'Lease End' : 'Check-out'}</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden lg:table-cell">Room</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    statusLabels={statusLabels}
                    isSelected={selectedBooking?.id === booking.id}
                    onSelect={() => setSelectedBooking(booking)}
                    onDeselect={() => setSelectedBooking(null)}
                    onRefresh={fetchBookings}
                    onAssignRoom={fetchBookings}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}


// ── Booking Row — with inline expand-in-place detail ────────────
function BookingRow({ booking, statusLabels, isSelected, onSelect, onDeselect, onRefresh, onAssignRoom }: {
  booking: Booking;
  statusLabels: Record<string, { label: string; class: string }>;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onRefresh: () => void;
  onAssignRoom: () => void;
}) {
  const { isLongStay } = usePropertyType();
  const [showAssign, setShowAssign] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const unassignedRooms = booking.bookingRooms?.filter((br: any) => !br.roomId && !br.room) || [];
  const canAssign = ['pending_confirmation', 'confirmed'].includes(booking.status) && unassignedRooms.length > 0;

  function handleRowClick() {
    if (isSelected) { onDeselect(); return; }
    setShowAssign(false);
    onSelect();
  }

  async function handleAssignClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (showAssign) { setShowAssign(false); return; }
    setShowAssign(true);
    setLoadingRooms(true);
    try {
      const checkIn = booking.checkInDate.split('T')[0];
      const checkOut = booking.checkOutDate.split('T')[0];
      const res = await roomsApi.checkAvailability(checkIn, checkOut);
      setAvailableRooms(res.data || []);
    } catch {
      try {
        const res = await roomsApi.getRooms({ status: 'available' });
        setAvailableRooms(res.data || []);
      } catch { toast.error('Failed to load rooms'); }
    } finally {
      setLoadingRooms(false);
    }
  }

  async function doAssign(bookingRoomId: string, roomId: string) {
    setAssigning(true);
    try {
      await bookingsApi.assignRoom(booking.id, { bookingRoomId, roomId });
      toast.success('Room assigned!');
      setShowAssign(false);
      onAssignRoom();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign room');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary-50/70' : 'hover:bg-primary-50/30'}`}
        onClick={handleRowClick}
      >
        <td className="px-4 sm:px-5 py-3.5">
          <p className="text-sm font-mono text-primary-600 font-medium">{booking.bookingNumber}</p>
        </td>
        <td className="px-4 sm:px-5 py-3.5">
          <p className="text-sm font-medium text-surface-900">{booking.guestName}</p>
          <p className="text-xs text-surface-500">{booking.guestPhone}</p>
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-sm text-surface-600 hidden md:table-cell">
          {new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-sm text-surface-600 hidden md:table-cell">
          {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-sm hidden lg:table-cell">
          {booking.bookingRooms?.map((br: any) => br.room?.roomNumber || br.roomType?.name).join(', ') || `${booking.numRooms} room(s)`}
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-sm font-semibold text-surface-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
        <td className="px-4 sm:px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider ${statusLabels[booking.status]?.class || 'bg-surface-100 text-surface-500'}`}>
              {statusLabels[booking.status]?.label || booking.status}
            </span>
            {canAssign && !isSelected && (
              <button
                onClick={handleAssignClick}
                className="text-[10px] px-2 py-1 rounded-full font-semibold bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 transition-colors flex items-center gap-1"
                title="Assign room"
              >
                <BedDouble className="w-3 h-3" /> Assign
              </button>
            )}
          </div>
        </td>
        <td className="px-4 sm:px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); isSelected ? onDeselect() : onSelect(); }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group ${isSelected ? 'bg-primary-100' : 'bg-surface-100 hover:bg-primary-100'}`}
            title={isSelected ? 'Collapse' : 'View details'}
          >
            {isSelected
              ? <ChevronDown className="w-4 h-4 text-primary-600" />
              : <Eye className="w-4 h-4 text-surface-400 group-hover:text-primary-600" />}
          </button>
        </td>
      </tr>

      {/* Quick room-assign strip (only when not expanded) */}
      {!isSelected && showAssign && (
        <tr>
          <td colSpan={8} className="px-4 sm:px-5 py-3 bg-violet-50/50 border-b border-violet-100">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-violet-700 mb-2">Assign rooms for this booking:</p>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-xs text-surface-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading available rooms for these dates...
                </div>
              ) : availableRooms.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ No rooms available for these dates.
                </p>
              ) : (
                unassignedRooms.map((br: any) => {
                  const matchingRooms = availableRooms.filter(r => r.roomTypeId === br.roomTypeId);
                  const hasExactMatch = matchingRooms.length > 0;
                  const roomOptions = hasExactMatch ? matchingRooms : availableRooms;
                  return (
                    <div key={br.id} className="flex items-start gap-3 flex-wrap">
                      <div className="min-w-[120px]">
                        <span className="text-sm text-surface-700 font-medium block">{br.roomType?.name || 'Room'}</span>
                        {!hasExactMatch && <span className="text-[10px] text-amber-600 font-medium">No exact match — showing all available</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          className="h-9 px-3 rounded-lg border border-violet-200 bg-white text-sm text-surface-700 flex-1 min-w-[200px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) doAssign(br.id, e.target.value); }}
                          disabled={assigning}
                        >
                          <option value="" disabled>Select room...</option>
                          {hasExactMatch
                            ? matchingRooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType?.name} (₹{r.rateOverride || r.roomType?.baseRate || r.baseRate})</option>)
                            : roomOptions.map(r => <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType?.name} (₹{r.rateOverride || r.roomType?.baseRate || r.baseRate})</option>)
                          }
                        </select>
                        {assigning && <Loader2 className="w-4 h-4 animate-spin text-violet-500 shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Inline detail expansion */}
      <AnimatePresence>
        {isSelected && (
          <tr>
            <td colSpan={8} className="p-0 border-b border-primary-100/60">
              <BookingInlineDetail
                booking={booking}
                statusLabels={statusLabels}
                onClose={onDeselect}
                onRefresh={onRefresh}
              />
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}


// ── New Booking — Inline Expandable Form (No Modal) ─────────────
function NewBookingInline({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('Dashboard');
  const { isLongStay } = usePropertyType();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    if (isLongStay) { d.setMonth(d.getMonth() + 1); } else { d.setDate(d.getDate() + 1); }
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [source, setSource] = useState('walkin');
  const [notes, setNotes] = useState('');
  
  const [roomSelections, setRoomSelections] = useState<{ roomTypeId: string; quantity: number; extraBeds: number }[]>([]);
  const [activeRoomTypeId, setActiveRoomTypeId] = useState('');
  const [activeQuantity, setActiveQuantity] = useState('1');
  const [activeExtraBeds, setActiveExtraBeds] = useState('0');
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availCount, setAvailCount] = useState<number | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    roomsApi.getRoomTypes().then((res) => {
      if (res.success) {
        setRoomTypes(res.data || []);
        if (res.data?.length) setActiveRoomTypeId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Check availability whenever dates change
  useEffect(() => {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setAvailCount(null);
      return;
    }
    setCheckingAvail(true);
    roomsApi.checkAvailability(checkIn, checkOut)
      .then(res => setAvailCount(res.data?.length ?? null))
      .catch(() => setAvailCount(null))
      .finally(() => setCheckingAvail(false));
  }, [checkIn, checkOut]);

  function handleAddRoom() {
    if (!activeRoomTypeId) return;
    setRoomSelections(prev => [
      ...prev,
      { roomTypeId: activeRoomTypeId, quantity: parseInt(activeQuantity), extraBeds: parseInt(activeExtraBeds) }
    ]);
    setActiveQuantity('1');
    setActiveExtraBeds('0');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) { setError('Guest name is required'); return; }
    if (!guestPhone.trim()) { setError('Phone number is mandatory'); return; }
    if (!checkIn || !checkOut) { setError('Check-in and check-out dates are required'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out must be after check-in'); return; }
    if (roomSelections.length === 0) { setError('Add at least one room type'); return; }

    setSaving(true);
    setError('');
    
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
        guestPhone: `${countryCode}${guestPhone.replace(/\D/g, '')}`,
        guestEmail: guestEmail.trim() || undefined,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numAdults: totalAdults,
        numChildren: 0,
        roomSelections: expandedSelections,
        source,
        notes: notes.trim() || undefined,
      });
      onCreated();
      toast.success(t('bookingCreated') || 'Booking created successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden" style={{ borderTop: '3px solid var(--color-primary-500, #166534)' }}>
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg text-surface-900 leading-tight">{isLongStay ? 'New Tenant Registration' : 'New Booking'}</h3>
            <p className="text-xs text-surface-500 mt-0.5">{isLongStay ? 'Register a tenant with move-in date and room type' : 'Create a reservation for walk-in, phone, or agent bookings'}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>}

        {/* Guest Details */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> 1. Guest Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-surface-500 mb-1">Full Name <span className="text-red-400">*</span></label>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required placeholder="Guest full name"
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Phone <span className="text-red-400">*</span></label>
              <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all overflow-hidden">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className="h-10 w-[78px] bg-transparent border-r border-surface-200 text-surface-700 text-sm px-2 outline-none cursor-pointer shrink-0">
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input required type="tel" inputMode="numeric" value={guestPhone} 
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))} 
                  placeholder="10 digit number" className="flex-1 h-10 px-3 text-sm text-surface-900 bg-transparent outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Email (optional)</label>
              <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email address"
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
            </div>
          </div>
        </div>

        {/* Stay & Source */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" /> 2. Stay Dates & Source
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-surface-500 mb-1">{isLongStay ? 'Move-in' : 'Check-in'} <span className="text-red-400">*</span></label>
              <input type="date" value={checkIn} onChange={(e) => {
                  setCheckIn(e.target.value);
                  // Auto-set checkout: +1 month for PG, +1 day for hotel
                  if (e.target.value) {
                    const next = new Date(e.target.value + 'T12:00:00');
                    if (isLongStay) { next.setMonth(next.getMonth() + 1); } else { next.setDate(next.getDate() + 1); }
                    setCheckOut(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`);
                  }
                }} required
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">{isLongStay ? 'Lease End' : 'Check-out'} <span className="text-red-400">*</span></label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="walkin">Walk-in</option>
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

        {/* Rooms */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BedDouble className="w-3.5 h-3.5" /> 3. Room Selection
          </h4>

          {/* Availability indicator */}
          {checkingAvail ? (
            <div className="mb-3 p-3 rounded-xl bg-surface-50 border border-surface-200 flex items-center gap-2 text-xs text-surface-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking room availability...
            </div>
          ) : availCount !== null && (
            <div className={`mb-3 p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              availCount === 0
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {availCount === 0 ? (
                <><span className="text-sm">⚠️</span> No rooms available for selected dates. Booking will be waitlisted — assign a room when one frees up.</>
              ) : (
                <><span className="text-sm">✓</span> {availCount} room{availCount !== 1 ? 's' : ''} available for {new Date(checkIn + 'T12:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} → {new Date(checkOut + 'T12:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</>
              )}
            </div>
          )}
          
          {roomSelections.length > 0 && (
            <div className="mb-3 space-y-2">
              {roomSelections.map((sel, idx) => {
                const rt = roomTypes.find(r => r.id === sel.roomTypeId);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-primary-50 border border-primary-200">
                    <div>
                      <p className="text-sm font-medium text-primary-700">{sel.quantity}× {rt?.name || 'Unknown'}</p>
                      <p className="text-xs text-primary-500">{sel.extraBeds > 0 ? `${sel.extraBeds} extra bed(s) per room` : 'No extra beds'}</p>
                    </div>
                    <button type="button" onClick={() => setRoomSelections(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-primary-500 hover:bg-primary-100 rounded-md transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 items-end p-3 rounded-xl border border-surface-200 bg-surface-50">
            <div className="flex-1">
              <label className="block text-xs text-surface-500 mb-1">Room Type</label>
              <select value={activeRoomTypeId} onChange={(e) => setActiveRoomTypeId(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                {roomTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name} (₹{t.baseRate})</option>)}
              </select>
            </div>
            <div className="w-16">
              <label className="block text-xs text-surface-500 mb-1">Qty</label>
              <input type="number" value={activeQuantity} onChange={(e) => setActiveQuantity(e.target.value)} min="1"
                className="w-full h-9 px-2 rounded-lg border border-surface-200 bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
            <div className="w-20">
              <label className="block text-xs text-surface-500 mb-1">Extra Beds</label>
              <input type="number" value={activeExtraBeds} onChange={(e) => setActiveExtraBeds(e.target.value)} min="0" max="5"
                className="w-full h-9 px-2 rounded-lg border border-surface-200 bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
            <button type="button" onClick={handleAddRoom} className="h-9 px-4 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-sm font-semibold hover:bg-primary-100 transition-colors whitespace-nowrap">
              + Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-surface-500 mb-1">Special Requests & Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
            className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3 border-t border-surface-100">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving || roomSelections.length === 0} 
            className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Booking
          </button>
        </div>
      </form>
    </div>
  );
}


// ── Booking Detail — Inline expand-in-place (below row) ──────────
function BookingInlineDetail({ booking, statusLabels, onClose, onRefresh }: {
  booking: Booking;
  statusLabels: Record<string, { label: string; class: string }>;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { isLongStay } = usePropertyType();
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestEmail: booking.guestEmail || '',
    notes: booking.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [ciIdType, setCiIdType] = useState('aadhaar');
  const [ciIdNumber, setCiIdNumber] = useState('');
  const [ciArrivingFrom, setCiArrivingFrom] = useState('');
  const [ciGoingTo, setCiGoingTo] = useState('');
  const [ciPurpose, setCiPurpose] = useState('leisure');
  const [coBalance, setCoBalance] = useState('');
  const [coPayMode, setCoPayMode] = useState('cash');
  const [changingRoomId, setChangingRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [submittingCForm, setSubmittingCForm] = useState<string | null>(null);
  // Guests come from GET /bookings/:id (the list endpoint doesn't include them)
  const [loadedGuests, setLoadedGuests] = useState<any[]>(booking.bookingGuests || []);

  useEffect(() => {
    bookingsApi.get(booking.id).then(res => {
      if (res.success && res.data?.bookingGuests) {
        setLoadedGuests(res.data.bookingGuests);
      }
    }).catch(() => {});
  }, [booking.id]);

  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000);
  const durationLabel = isLongStay && nights >= 28
    ? `${Math.round(nights / 30)}M`
    : `${nights}N`;
  const canEdit = !['cancelled', 'checked_out', 'no_show'].includes(booking.status);

  async function handleSaveEdits() {
    setSaving(true);
    try {
      await bookingsApi.update(booking.id, editData);
      toast.success('Booking updated');
      setEditMode(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally { setSaving(false); }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await bookingsApi.confirm(booking.id);
      toast.success('Booking confirmed');
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Failed to confirm'); }
    finally { setSaving(false); }
  }

  async function handleCancel() {
    setSaving(true);
    try {
      await bookingsApi.cancel(booking.id, cancelReason || undefined);
      toast.success('Booking cancelled');
      onClose();
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Failed to cancel'); }
    finally { setSaving(false); }
  }

  async function handleCheckIn() {
    setSaving(true);
    try {
      await checkinApi.checkIn(booking.id, {
        idProofType: ciIdType, idProofNumber: ciIdNumber,
        arrivingFrom: ciArrivingFrom, goingTo: ciGoingTo, purposeOfVisit: ciPurpose,
      });
      toast.success('Successfully Checked In');
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Check-in failed'); }
    finally { setSaving(false); }
  }

  async function handleCheckOut() {
    setSaving(true);
    try {
      await checkinApi.checkOut(booking.id, { balanceDue: parseFloat(coBalance) || 0, paymentMode: coPayMode });
      toast.success('Successfully Checked Out');
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Check-out failed'); }
    finally { setSaving(false); }
  }

  async function handleChangeRoom(bookingRoomId: string, newRoomId: string) {
    try {
      await bookingsApi.assignRoom(booking.id, { bookingRoomId, roomId: newRoomId });
      toast.success('Room updated');
      setChangingRoomId(null);
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Failed to change room'); }
  }

  async function loadAvailableRooms() {
    try {
      const res = await roomsApi.checkAvailability(booking.checkInDate.split('T')[0], booking.checkOutDate.split('T')[0]);
      setAvailableRooms(res.data || []);
    } catch {
      try { const res = await roomsApi.getRooms({ status: 'available' }); setAvailableRooms(res.data || []); }
      catch {}
    }
  }

  async function handleCFormSubmit(guestId: string) {
    setSubmittingCForm(guestId);
    try {
      const res = await complianceApi.submitCForm(guestId);
      if (!res.success) throw new Error(res.error || 'Failed to submit C-Form');
      toast.success('Successfully submitted C-Form to FRRO!');
      // Re-fetch guests so FRRO Submitted badge renders immediately
      bookingsApi.get(booking.id).then(r => {
        if (r.success && r.data?.bookingGuests) setLoadedGuests(r.data.bookingGuests);
      }).catch(() => {});
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'FRRO error'); }
    finally { setSubmittingCForm(null); }
  }

  const inputCls = 'h-9 px-3 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-full';
  const indigoCls = 'h-9 px-3 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 w-full';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-3 sm:mx-5 my-3 rounded-2xl border border-surface-200 bg-white shadow-xl overflow-hidden" style={{ borderTop: '3px solid #166534' }}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-surface-100 bg-gradient-to-r from-primary-50/80 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm font-bold text-primary-700 shrink-0">{booking.bookingNumber}</span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${statusLabels[booking.status]?.class || 'bg-surface-100 text-surface-500'}`}>
              {statusLabels[booking.status]?.label || booking.status}
            </span>
            <span className="text-xs text-surface-400 hidden sm:block truncate">{booking.guestName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button onClick={() => setEditMode(!editMode)}
                className={`p-1.5 rounded-lg transition-all ${editMode ? 'bg-primary-100 text-primary-600' : 'text-surface-400 hover:bg-surface-100 hover:text-surface-700'}`}
                title="Edit booking">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── PRIMARY ACTION ZONE (always at top, never buried) ── */}
        {!editMode && (
          <div className="px-4 sm:px-5 pt-4">
            {booking.status === 'pending_confirmation' && (
              <button onClick={handleConfirm} disabled={saving}
                className="w-full h-12 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-md shadow-emerald-500/20 disabled:opacity-60">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Confirm Booking
              </button>
            )}

            {booking.status === 'confirmed' && !showCancelPrompt && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-indigo-600" /> {isLongStay ? 'Fast-Track Move-In' : 'Fast-Track Check-In'}
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-indigo-700 mb-1 uppercase tracking-wider">ID Type</label>
                    <select value={ciIdType} onChange={e => setCiIdType(e.target.value)} className={indigoCls + ' cursor-pointer'}>
                      <option value="aadhaar">Aadhaar</option>
                      <option value="passport">Passport</option>
                      <option value="dl">Driving License</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-indigo-700 mb-1 uppercase tracking-wider">ID Number</label>
                    <input type="text" placeholder="Enter number" value={ciIdNumber} onChange={e => setCiIdNumber(e.target.value)} className={indigoCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-indigo-700 mb-1 uppercase tracking-wider">Arriving From</label>
                    <input type="text" placeholder="City / Country" value={ciArrivingFrom} onChange={e => setCiArrivingFrom(e.target.value)} className={indigoCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-indigo-700 mb-1 uppercase tracking-wider">Going To</label>
                    <input type="text" placeholder="City / Country" value={ciGoingTo} onChange={e => setCiGoingTo(e.target.value)} className={indigoCls} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={ciPurpose} onChange={e => setCiPurpose(e.target.value)} className="flex-1 h-10 px-3 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer">
                    <option value="leisure">Leisure / Tourism</option>
                    <option value="business">Business</option>
                    <option value="transit">Transit</option>
                    <option value="medical">Medical</option>
                  </select>
                  <button onClick={handleCheckIn} disabled={saving}
                    className="flex-1 sm:flex-none sm:px-8 h-10 rounded-lg bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors disabled:opacity-60 shadow-md shadow-indigo-500/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {isLongStay ? 'Complete Move-In' : 'Complete Check-In'}
                  </button>
                </div>
              </div>
            )}

            {booking.status === 'checked_in' && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-amber-600" /> {isLongStay ? 'Complete Move-Out' : 'Complete Check-Out'}
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm font-medium pointer-events-none">₹</span>
                    <input type="number" placeholder="Balance Due" value={coBalance} onChange={e => setCoBalance(e.target.value)}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
                  </div>
                  <div className="flex items-center gap-4">
                    {['cash', 'card', 'upi'].map(mode => (
                      <label key={mode} className="flex items-center gap-1.5 text-sm text-amber-900 cursor-pointer capitalize">
                        <input type="radio" name={`co-pay-${booking.id}`} value={mode} checked={coPayMode === mode} onChange={() => setCoPayMode(mode)} className="accent-amber-600" /> {mode}
                      </label>
                    ))}
                  </div>
                  <button onClick={handleCheckOut} disabled={saving}
                    className="h-10 px-6 rounded-lg bg-amber-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-500 transition-colors disabled:opacity-60 shadow-md shadow-amber-500/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {isLongStay ? 'Move Out' : 'Check Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INFO GRID: Guest | Stay | Billing ── */}
        <div className="px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5 border-b border-surface-100 mt-4">
          {/* Guest */}
          <div>
            <p className="text-[10px] uppercase font-bold text-surface-400 tracking-widest mb-2 flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</p>
            {editMode ? (
              <div className="space-y-2">
                <input value={editData.guestName} onChange={e => setEditData({...editData, guestName: e.target.value})} placeholder="Full name" className={inputCls + ' font-medium'} />
                <input value={editData.guestPhone} onChange={e => setEditData({...editData, guestPhone: e.target.value})} placeholder="Phone" className={inputCls} />
                <input value={editData.guestEmail} onChange={e => setEditData({...editData, guestEmail: e.target.value})} placeholder="Email (optional)" className={inputCls} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-surface-900">{booking.guestName}</p>
                {booking.guestPhone && (
                  <a href={`tel:${booking.guestPhone}`} className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1.5 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {booking.guestPhone}
                  </a>
                )}
                {booking.guestEmail && (
                  <a href={`mailto:${booking.guestEmail}`} className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1.5 transition-colors truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {booking.guestEmail}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Stay */}
          <div>
            <p className="text-[10px] uppercase font-bold text-surface-400 tracking-widest mb-2 flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Stay</p>
            <div className="flex items-center gap-2 mb-1.5">
              <div>
                <p className="text-[10px] text-surface-400 mb-0.5">{isLongStay ? 'Move-in' : 'Check-in'}</p>
                <p className="text-sm font-bold text-surface-900">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-1.5">
                <div className="h-px w-5 bg-surface-300" />
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full">{durationLabel}</span>
                <div className="h-px w-5 bg-surface-300" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400 mb-0.5">{isLongStay ? 'Lease End' : 'Check-out'}</p>
                <p className="text-sm font-bold text-surface-900">{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' })}</p>
              </div>
            </div>
            <p className="text-xs text-surface-500">
              {booking.numAdults} adult{booking.numAdults !== 1 ? 's' : ''}{booking.numChildren ? ` · ${booking.numChildren} child${booking.numChildren !== 1 ? 'ren' : ''}` : ''}
              {' · '}<span className="capitalize">{booking.source?.replace(/_/g, ' ')}</span>
            </p>
          </div>

          {/* Billing */}
          <div>
            <p className="text-[10px] uppercase font-bold text-surface-400 tracking-widest mb-2">Billing</p>
            <p className="text-2xl font-bold text-surface-900 leading-none">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
            {booking.discountAmount ? (
              <p className="text-xs text-emerald-600 font-medium mt-1">Saved ₹{booking.discountAmount.toLocaleString('en-IN')}</p>
            ) : null}
            <p className="text-xs text-surface-400 mt-1">{isLongStay && nights >= 28 ? `${Math.round(nights / 30)} month${Math.round(nights / 30) !== 1 ? 's' : ''}` : `${nights} night${nights !== 1 ? 's' : ''}`} · {booking.numRooms} {isLongStay ? 'bed' : 'room'}{booking.numRooms !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* ── ROOMS ── */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-surface-100">
          <p className="text-[10px] uppercase font-bold text-surface-400 tracking-widest mb-2.5 flex items-center gap-1.5"><BedDouble className="w-3 h-3" /> Rooms ({booking.numRooms})</p>
          <div className="flex flex-wrap gap-2">
            {booking.bookingRooms && booking.bookingRooms.length > 0 ? (
              booking.bookingRooms.map((br: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl border border-surface-200 bg-surface-50">
                  <div>
                    <p className="text-sm font-medium text-surface-900 leading-none">{br.room ? `Room ${br.room.roomNumber}` : 'Unassigned'}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{br.roomType?.name || 'Room'}{br.extraBeds > 0 ? ` · +${br.extraBeds} extra bed` : ''}</p>
                  </div>
                  {canEdit && (
                    changingRoomId === br.id ? (
                      <select autoFocus defaultValue=""
                        className="h-8 px-2 rounded-lg border border-violet-200 bg-white text-xs min-w-[140px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                        onChange={(e) => { if (e.target.value) handleChangeRoom(br.id, e.target.value); }}>
                        <option value="" disabled>Select room...</option>
                        {availableRooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType?.name}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => { setChangingRoomId(br.id); loadAvailableRooms(); }}
                        className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors font-medium">
                        {br.room ? 'Change' : 'Assign'}
                      </button>
                    )
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-surface-400">{booking.numRooms} room(s) — not yet assigned</p>
            )}
          </div>
        </div>

        {/* ── FRRO COMPLIANCE ── */}
        {booking.bookingGuests && booking.bookingGuests.length > 0 && (
          <div className="px-4 sm:px-5 py-3.5 border-b border-surface-100">
            <p className="text-[10px] uppercase font-bold text-surface-400 tracking-widest mb-2.5 flex items-center gap-1.5"><Globe className="w-3 h-3" /> FRRO & Police Compliance</p>
            <div className="flex flex-wrap gap-2">
              {booking.bookingGuests.map((guest: any) => {
                const isForeigner = guest.nationality && !['indian', 'india'].includes(guest.nationality.toLowerCase());
                return (
                  <div key={guest.id} className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl border border-surface-200 bg-surface-50">
                    <div>
                      <p className="text-sm font-medium text-surface-900 leading-none flex items-center gap-1.5">
                        {guest.fullName}
                        {isForeigner && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold uppercase">Foreign</span>}
                      </p>
                      {guest.idProof && <p className="text-xs text-surface-400 mt-0.5">ID: {guest.idProof}</p>}
                    </div>
                    {isForeigner && (
                      guest.cFormSubmitted ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle className="w-3 h-3" /> FRRO ✓
                        </span>
                      ) : (
                        <button onClick={() => handleCFormSubmit(guest.id)} disabled={submittingCForm === guest.id}
                          className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50">
                          {submittingCForm === guest.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />} Submit FRRO
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOTES ── */}
        {(editMode || booking.notes) && (
          <div className="px-4 sm:px-5 py-3.5 border-b border-surface-100">
            <p className="text-[10px] uppercase font-bold text-surface-400 tracking-widest mb-2">Notes</p>
            {editMode ? (
              <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})}
                rows={2} placeholder="Special requests, notes..."
                className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" />
            ) : (
              <p className="text-sm text-surface-600">{booking.notes}</p>
            )}
          </div>
        )}

        {/* ── FOOTER ACTIONS ── */}
        <div className="px-4 sm:px-5 py-3 flex items-center gap-3 flex-wrap">
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">Cancel Edit</button>
              <button onClick={handleSaveEdits} disabled={saving}
                className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </>
          ) : (
            <>
              {booking.status === 'confirmed' && (
                showCancelPrompt ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancel reason (optional)" autoFocus
                      className="flex-1 h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-red-300" />
                    <button onClick={() => setShowCancelPrompt(false)} className="h-9 px-3 rounded-lg border border-surface-200 text-surface-600 text-sm hover:bg-surface-50 transition-colors whitespace-nowrap">Back</button>
                    <button onClick={handleCancel} disabled={saving}
                      className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50 whitespace-nowrap">
                      Confirm Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowCancelPrompt(true)}
                    className="h-9 px-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium flex items-center gap-1.5 hover:bg-red-100 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel Booking
                  </button>
                )
              )}
              <button onClick={onClose} className="ml-auto h-9 px-4 rounded-xl border border-surface-200 bg-white text-surface-500 text-sm hover:bg-surface-50 transition-colors flex items-center gap-1.5">
                <ChevronDown className="w-4 h-4" /> Collapse
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
