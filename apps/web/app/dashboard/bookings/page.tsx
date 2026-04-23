'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CalendarDays, Plus, Search, X, Loader2, CheckCircle, XCircle, Eye, Zap, Globe, Phone, Clock, Ban, Building2, Edit2, Save, ChevronDown, ChevronRight, Mail, User, BedDouble, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { bookingsApi, roomsApi, checkinApi, complianceApi } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/constants';

interface Booking {
  id: string; bookingNumber: string; guestName: string; guestPhone: string; guestEmail: string;
  checkInDate: string; checkOutDate: string; numRooms: number; numAdults: number; numChildren: number;
  totalAmount: number; discountAmount?: number; status: string; source: string; notes?: string;
  bookingRooms?: any[]; bookingGuests?: any[];
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
        .catch(console.error);
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
      setWalkInForm({ guestName: '', countryCode: '+91', guestPhone: '', roomId: '', durationValue: 1, durationUnit: 'days', paymentMode: 'cash' });
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

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending_confirmation: { label: 'Pending', class: 'bg-amber-100 text-amber-700 border border-amber-200' },
    confirmed: { label: 'Confirmed', class: 'bg-primary-100 text-primary-700 border border-primary-200' },
    checked_in: { label: 'Checked In', class: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    checked_out: { label: 'Checked Out', class: 'bg-surface-100 text-surface-600 border border-surface-200' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700 border border-red-200' },
    no_show: { label: 'No Show', class: 'bg-red-100 text-red-700 border border-red-200' },
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">Bookings</h1>
          <p className="text-sm text-surface-500">Manage all reservations and walk-ins</p>
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
            <span className="hidden sm:inline">{t('quickWalkIn') || 'Quick Walk-in'}</span>
            <span className="sm:hidden">Walk-in</span>
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
                      {t('expressWalkIn') || 'Express Walk-in'}
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">Book & check-in in under 30 seconds</p>
                  </div>
                </div>
                <button onClick={() => setShowWalkInCard(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all" type="button">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="p-4 sm:p-5 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 sm:gap-4">
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
                    <div className="flex rounded-xl border border-surface-200 bg-surface-50 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition-all overflow-hidden">
                      <select value={walkInForm.countryCode} onChange={e => setWalkInForm({...walkInForm, countryCode: e.target.value})}
                        className="h-11 w-[78px] bg-transparent border-r border-surface-200 text-surface-700 text-sm px-2 outline-none cursor-pointer shrink-0">
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input required type="tel" inputMode="numeric" value={walkInForm.guestPhone} 
                        onChange={e => setWalkInForm({...walkInForm, guestPhone: e.target.value.replace(/\D/g, '')})}
                        placeholder="10 digit number" className="flex-1 h-11 px-3 text-sm text-surface-900 bg-transparent outline-none" />
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
                    <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block">Stay Duration</label>
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
                  
                  <div className="flex items-end">
                    <button type="submit" disabled={submittingWalkIn || !walkInForm.roomId} 
                      className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}>
                      {submittingWalkIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /><span>Book & Check-in</span></>}
                    </button>
                  </div>
                </div>
                {availableRooms.length > 0 && (
                  <p className="text-xs text-surface-500 mt-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {availableRooms.filter(r => r.status === 'available').length} rooms available
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
                      <p className="text-xs text-surface-500">Check-in</p>
                      <p className="text-sm font-medium text-surface-700">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
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
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Check-in</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Check-out</th>
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
                    onSelect={() => setSelectedBooking(booking)}
                    onAssignRoom={() => { fetchBookings(); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Detail — Full Inline Panel (No modal) */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onUpdated={() => { fetchBookings(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// ── Booking Row with Inline Room Assignment ─────────────────────
function BookingRow({ booking, statusLabels, onSelect, onAssignRoom }: {
  booking: Booking;
  statusLabels: Record<string, { label: string; class: string }>;
  onSelect: () => void;
  onAssignRoom: () => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Check if this booking has unassigned rooms
  const unassignedRooms = booking.bookingRooms?.filter((br: any) => !br.roomId && !br.room) || [];
  const canAssign = ['pending_confirmation', 'confirmed'].includes(booking.status) && unassignedRooms.length > 0;

  async function handleAssignClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (showAssign) {
      setShowAssign(false);
      return;
    }
    setShowAssign(true);
    try {
      const res = await roomsApi.getRooms({ status: 'available' });
      setAvailableRooms(res.data || []);
    } catch { toast.error('Failed to load rooms'); }
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
      <tr className="hover:bg-primary-50/30 cursor-pointer transition-colors" onClick={onSelect}>
        <td className="px-4 sm:px-5 py-3.5">
          <p className="text-sm font-mono text-primary-600 font-medium">{booking.bookingNumber}</p>
        </td>
        <td className="px-4 sm:px-5 py-3.5">
          <p className="text-sm font-medium text-surface-900">{booking.guestName}</p>
          <p className="text-xs text-surface-500">{booking.guestPhone}</p>
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-sm text-surface-600 hidden md:table-cell">
          {new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-sm text-surface-600 hidden md:table-cell">
          {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
            {canAssign && (
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
        <td className="px-4 sm:px-5 py-3.5">
          <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-primary-100 flex items-center justify-center transition-colors group">
            <Eye className="w-4 h-4 text-surface-400 group-hover:text-primary-600" />
          </button>
        </td>
      </tr>
      {/* Inline room assign dropdown */}
      {showAssign && (
        <tr>
          <td colSpan={8} className="px-4 sm:px-5 py-3 bg-violet-50/50 border-b border-violet-100">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-violet-700 mb-2">Assign rooms for this booking:</p>
              {unassignedRooms.map((br: any) => {
                const matchingRooms = availableRooms.filter(r => r.roomTypeId === br.roomTypeId);
                return (
                  <div key={br.id} className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-surface-700 font-medium min-w-[120px]">
                      {br.roomType?.name || 'Room'}
                    </span>
                    <select
                      className="h-9 px-3 rounded-lg border border-violet-200 bg-white text-sm text-surface-700 min-w-[180px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) doAssign(br.id, e.target.value);
                      }}
                      disabled={assigning}
                    >
                      <option value="" disabled>Select room...</option>
                      {matchingRooms.length > 0 ? (
                        matchingRooms.map(r => (
                          <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType?.name} (₹{r.baseRate})</option>
                        ))
                      ) : (
                        availableRooms.map(r => (
                          <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType?.name} (₹{r.baseRate})</option>
                        ))
                      )}
                    </select>
                    {assigning && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


// ── New Booking — Inline Expandable Form (No Modal) ─────────────
function NewBookingInline({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('Dashboard');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [source, setSource] = useState('walk_in');
  const [notes, setNotes] = useState('');
  
  const [roomSelections, setRoomSelections] = useState<{ roomTypeId: string; quantity: number; extraBeds: number }[]>([]);
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
            <h3 className="font-display text-base sm:text-lg text-surface-900 leading-tight">New Booking</h3>
            <p className="text-xs text-surface-500 mt-0.5">Create a reservation for walk-in, phone, or agent bookings</p>
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
              <label className="block text-xs text-surface-500 mb-1">Check-in <span className="text-red-400">*</span></label>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Check-out <span className="text-red-400">*</span></label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30">
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

        {/* Rooms */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BedDouble className="w-3.5 h-3.5" /> 3. Room Selection
          </h4>
          
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


// ── Booking Detail — Premium Inline Panel (No Modal) ─────────────
function BookingDetailPanel({ booking, onClose, onConfirm, onCancel, onUpdated }: {
  booking: Booking; onClose: () => void;
  onConfirm: (id: string) => void; onCancel: (id: string, reason?: string) => void;
  onUpdated: () => void;
}) {
  const t = useTranslations('Dashboard');
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

  // Check-in form state (controlled)
  const [ciIdType, setCiIdType] = useState('aadhaar');
  const [ciIdNumber, setCiIdNumber] = useState('');
  const [ciArrivingFrom, setCiArrivingFrom] = useState('');
  const [ciGoingTo, setCiGoingTo] = useState('');
  const [ciPurpose, setCiPurpose] = useState('leisure');

  // Check-out form state (controlled)
  const [coBalance, setCoBalance] = useState('');
  const [coPayMode, setCoPayMode] = useState('cash');

  // Room change state
  const [changingRoomId, setChangingRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));

  async function handleSaveEdits() {
    setSaving(true);
    try {
      await bookingsApi.update(booking.id, editData);
      toast.success('Booking updated');
      setEditMode(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRoom(bookingRoomId: string, newRoomId: string) {
    try {
      await bookingsApi.assignRoom(booking.id, { bookingRoomId, roomId: newRoomId });
      toast.success('Room updated!');
      setChangingRoomId(null);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change room');
    }
  }

  async function loadAvailableRooms() {
    try {
      const res = await roomsApi.getRooms({ status: 'available' });
      setAvailableRooms(res.data || []);
    } catch { }
  }

  const [submittingCForm, setSubmittingCForm] = useState<string | null>(null);

  async function handleCFormSubmit(guestId: string) {
    setSubmittingCForm(guestId);
    try {
      const res = await complianceApi.submitCForm(guestId);
      if (!res.success) throw new Error(res.error || 'Failed to submit C-Form');
      toast.success('Successfully submitted C-Form to FRRO!');
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Error communicating with FRRO');
    } finally {
      setSubmittingCForm(null);
    }
  }

  const canEdit = !['cancelled', 'checked_out', 'no_show'].includes(booking.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-surface-200 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-transparent">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-display font-bold text-surface-900">Booking Details</h2>
            {canEdit && (
              <button onClick={() => setEditMode(!editMode)} 
                className={`p-1.5 rounded-lg transition-all ${editMode ? 'bg-primary-100 text-primary-600' : 'hover:bg-surface-100 text-surface-400'}`}
                title="Edit booking">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-primary-600 font-mono font-medium mt-0.5">{booking.bookingNumber}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Guest Card */}
        <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
          <h3 className="text-[11px] uppercase text-surface-500 font-semibold tracking-wider mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Guest Information
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-lg font-bold shrink-0">
              {booking.guestName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 space-y-1.5">
              {editMode ? (
                <>
                  <input value={editData.guestName} onChange={e => setEditData({...editData, guestName: e.target.value})}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editData.guestPhone} onChange={e => setEditData({...editData, guestPhone: e.target.value})} placeholder="Phone"
                      className="h-9 px-3 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                    <input value={editData.guestEmail} onChange={e => setEditData({...editData, guestEmail: e.target.value})} placeholder="Email"
                      className="h-9 px-3 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-surface-900">{booking.guestName}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {booking.guestPhone && (
                      <a href={`tel:${booking.guestPhone}`} className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {booking.guestPhone}
                      </a>
                    )}
                    {booking.guestEmail && (
                      <a href={`mailto:${booking.guestEmail}`} className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {booking.guestEmail}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stay Timeline */}
        <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
          <h3 className="text-[11px] uppercase text-surface-500 font-semibold tracking-wider mb-3 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Stay Details
          </h3>
          <div className="flex items-center gap-3">
            <div className="text-center flex-1 bg-white rounded-lg p-3 border border-surface-100">
              <p className="text-[10px] uppercase text-surface-500 font-semibold">Check-in</p>
              <p className="text-sm font-bold text-surface-900 mt-1">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-4 h-4 text-surface-400" />
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{nights}N</span>
            </div>
            <div className="text-center flex-1 bg-white rounded-lg p-3 border border-surface-100">
              <p className="text-[10px] uppercase text-surface-500 font-semibold">Check-out</p>
              <p className="text-sm font-bold text-surface-900 mt-1">{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-surface-500">Guests</span>
            <span className="text-surface-900 font-medium">{booking.numAdults} adult{booking.numAdults !== 1 ? 's' : ''}{booking.numChildren ? `, ${booking.numChildren} child${booking.numChildren !== 1 ? 'ren' : ''}` : ''}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-surface-500">Source</span>
            <span className="text-surface-900 font-medium capitalize">{booking.source?.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* FRRO & Sarai Compliance */}
        {booking.bookingGuests && booking.bookingGuests.length > 0 && (
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
            <h3 className="text-[11px] uppercase text-surface-500 font-semibold tracking-wider mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> FRRO & Police Compliance
            </h3>
            <div className="space-y-2">
              {booking.bookingGuests.map((guest: any) => {
                const isForeigner = guest.nationality && guest.nationality.toLowerCase() !== 'indian' && guest.nationality.toLowerCase() !== 'india';
                return (
                  <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-surface-100 gap-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900 flex items-center gap-2">
                        {guest.fullName} 
                        {isForeigner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-700 font-bold uppercase tracking-wider">
                            Foreign National
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {guest.idProof && `ID: ${guest.idProof}`} {guest.visaDetails && `| Visa: ${guest.visaDetails}`}
                      </p>
                    </div>
                    {isForeigner ? (
                      <div>
                        {guest.cFormSubmitted ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" /> FRRO Submitted
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleCFormSubmit(guest.id)} 
                            disabled={submittingCForm === guest.id}
                            className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            {submittingCForm === guest.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                            Submit to FRRO
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
                        Domestic Guest
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-surface-400 mt-3 italic">
              All guests listed here will automatically be included in your Sarai Act Police Register for the relevant dates.
            </p>
          </div>
        )}

        {/* Room Cards */}
        <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
          <h3 className="text-[11px] uppercase text-surface-500 font-semibold tracking-wider mb-3 flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5" /> Rooms ({booking.numRooms})
          </h3>
          <div className="space-y-2">
            {booking.bookingRooms && booking.bookingRooms.length > 0 ? (
              booking.bookingRooms.map((br: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-surface-100">
                  <div>
                    <p className="text-sm font-medium text-surface-900">{br.roomType?.name || 'Room'}</p>
                    <p className="text-xs text-surface-500">{br.room ? `Room ${br.room.roomNumber}` : 'Not assigned'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {br.extraBeds > 0 && <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">+{br.extraBeds} bed</span>}
                    {canEdit && (
                      changingRoomId === br.id ? (
                        <select
                          className="h-8 px-2 rounded-lg border border-violet-200 bg-white text-xs text-surface-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) handleChangeRoom(br.id, e.target.value); }}
                          autoFocus
                        >
                          <option value="" disabled>Select room...</option>
                          {availableRooms.map(r => (
                            <option key={r.id} value={r.id}>{r.roomNumber} — {r.roomType?.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button onClick={() => { setChangingRoomId(br.id); loadAvailableRooms(); }}
                          className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors font-medium">
                          {br.room ? 'Change' : 'Assign'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-surface-500 text-center py-3">{booking.numRooms} Room(s)</p>
            )}
          </div>
        </div>

        {/* Billing */}
        <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
          <h3 className="text-[11px] uppercase text-surface-500 font-semibold tracking-wider mb-3">Billing</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Subtotal</span>
              <span className="text-surface-900">₹{(booking.totalAmount + (booking.discountAmount || 0)).toLocaleString('en-IN')}</span>
            </div>
            {booking.discountAmount ? (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Discount</span>
                <span>- ₹{booking.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-surface-200">
              <span className="text-surface-700">Total</span>
              <span className="text-surface-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(editMode || booking.notes) && (
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
            <h3 className="text-[11px] uppercase text-surface-500 font-semibold tracking-wider mb-2">Notes</h3>
            {editMode ? (
              <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" />
            ) : (
              <p className="text-sm text-surface-600">{booking.notes}</p>
            )}
          </div>
        )}

        {/* Edit Save */}
        {editMode && (
          <div className="flex gap-3">
            <button onClick={() => setEditMode(false)} className="flex-1 h-10 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">Cancel</button>
            <button onClick={handleSaveEdits} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        )}

        {/* Status Actions */}
        {!editMode && (
          <div className="space-y-4 pt-2 border-t border-surface-100">
            {booking.status === 'pending_confirmation' && (
              <button onClick={() => onConfirm(booking.id)} className="w-full h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors">
                <CheckCircle className="w-4 h-4" /> Confirm Booking
              </button>
            )}

            {booking.status === 'confirmed' && (
              !showCancelPrompt ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-inner">
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-indigo-600" /> Fast-Track Check-In
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-indigo-800 mb-1">ID Type</label>
                          <select value={ciIdType} onChange={e => setCiIdType(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                            <option value="aadhaar">Aadhaar</option>
                            <option value="passport">Passport</option>
                            <option value="dl">Driving License</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-indigo-800 mb-1">ID Number</label>
                          <input type="text" placeholder="12-digit" value={ciIdNumber} onChange={e => setCiIdNumber(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-indigo-800 mb-1">Arriving From</label>
                          <input type="text" placeholder="City/Country" value={ciArrivingFrom} onChange={e => setCiArrivingFrom(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-indigo-800 mb-1">Going To</label>
                          <input type="text" placeholder="City/Country" value={ciGoingTo} onChange={e => setCiGoingTo(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select value={ciPurpose} onChange={e => setCiPurpose(e.target.value)} className="flex-1 h-10 px-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                          <option value="leisure">Leisure</option>
                          <option value="business">Business</option>
                          <option value="transit">Transit</option>
                        </select>
                        <button 
                          onClick={async () => {
                            try {
                              setSaving(true);
                              await checkinApi.checkIn(booking.id, {
                                idProofType: ciIdType,
                                idProofNumber: ciIdNumber,
                                arrivingFrom: ciArrivingFrom,
                                goingTo: ciGoingTo,
                                purposeOfVisit: ciPurpose,
                              });
                              toast.success('Successfully Checked In');
                              onUpdated();
                            } catch (err: any) {
                              toast.error(err.message || 'Check-in failed');
                            } finally { setSaving(false); }
                          }}
                          disabled={saving}
                          className="flex-1 h-10 rounded-lg bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Complete Check-In
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowCancelPrompt(true)} className="w-full h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel Booking
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason (optional)" autoFocus
                    className="w-full h-9 px-3 rounded-lg border border-red-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-red-300" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancelPrompt(false)} className="flex-1 h-9 rounded-lg border border-surface-200 bg-white text-surface-700 text-sm hover:bg-surface-50">Back</button>
                    <button onClick={() => onCancel(booking.id, cancelReason)} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500">Confirm Cancel</button>
                  </div>
                </div>
              )
            )}

            {booking.status === 'checked_in' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 shadow-inner">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-amber-600" /> Complete Check-Out
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm font-medium">₹</span>
                    <input type="number" placeholder="Balance Due" value={coBalance} onChange={e => setCoBalance(e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-amber-900 cursor-pointer">
                      <input type="radio" name={`payMode-${booking.id}`} value="cash" checked={coPayMode === 'cash'} onChange={() => setCoPayMode('cash')} className="accent-amber-600" /> Cash
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-amber-900 cursor-pointer">
                      <input type="radio" name={`payMode-${booking.id}`} value="card" checked={coPayMode === 'card'} onChange={() => setCoPayMode('card')} className="accent-amber-600" /> Card
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-amber-900 cursor-pointer">
                      <input type="radio" name={`payMode-${booking.id}`} value="upi" checked={coPayMode === 'upi'} onChange={() => setCoPayMode('upi')} className="accent-amber-600" /> UPI
                    </label>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await checkinApi.checkOut(booking.id, {
                        balanceDue: parseFloat(coBalance) || 0,
                        paymentMode: coPayMode,
                      });
                      toast.success('Successfully Checked Out');
                      onUpdated();
                    } catch (err: any) {
                      toast.error(err.message || 'Check-out failed');
                    } finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="mt-3 w-full h-10 rounded-lg bg-amber-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Complete Check-out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
