'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Search, X, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { bookingsApi, roomsApi } from '@/lib/api';

interface Booking {
  id: string; bookingNumber: string; guestName: string; guestPhone: string; guestEmail: string;
  checkInDate: string; checkOutDate: string; numRooms: number; numAdults: number; numChildren: number;
  totalAmount: number; status: string; source: string; notes?: string;
  bookingRooms?: any[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
    } catch (err: any) { alert(err.message); }
  }

  async function handleCancel(id: string) {
    const reason = prompt('Cancellation reason (optional):');
    try {
      await bookingsApi.cancel(id, reason || undefined);
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Bookings</h1>
          <p className="text-surface-400">Manage all reservations and walk-ins</p>
        </div>
        <button onClick={() => setShowNewBooking(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

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
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numRooms, setNumRooms] = useState('1');
  const [numAdults, setNumAdults] = useState('1');
  const [numChildren, setNumChildren] = useState('0');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [source, setSource] = useState('walk_in');
  const [notes, setNotes] = useState('');
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.getRoomTypes().then((res) => {
      if (res.success) {
        setRoomTypes(res.data || []);
        if (res.data?.length) setRoomTypeId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !checkIn || !checkOut) { setError('Fill required fields'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out must be after check-in'); return; }

    setSaving(true);
    setError('');
    try {
      await bookingsApi.create({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numRooms: parseInt(numRooms),
        numAdults: parseInt(numAdults),
        numChildren: parseInt(numChildren),
        roomTypeId: roomTypeId || undefined,
        source,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold">New Booking</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-300 mb-1">Guest Name *</label>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="input-field" required placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Phone</label>
              <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="input-field" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Email</label>
              <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="input-field" placeholder="guest@email.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Check-in *</label>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Check-out *</label>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="input-field" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Room Type</label>
            <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="input-field">
              <option value="">-- Select --</option>
              {roomTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name} (₹{t.baseRate}/night)</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Rooms</label>
              <input type="number" value={numRooms} onChange={(e) => setNumRooms(e.target.value)} className="input-field" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Adults</label>
              <input type="number" value={numAdults} onChange={(e) => setNumAdults(e.target.value)} className="input-field" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Children</label>
              <input type="number" value={numChildren} onChange={(e) => setNumChildren(e.target.value)} className="input-field" min="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
              <option value="walk_in">Walk-in</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="website">Website</option>
              <option value="ota_booking_com">Booking.com</option>
              <option value="ota_makemytrip">MakeMyTrip</option>
              <option value="ota_goibibo">Goibibo</option>
              <option value="ota_other">Other OTA</option>
              <option value="agent">Travel Agent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Special requests, preferences..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Booking
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
  onConfirm: (id: string) => void; onCancel: (id: string) => void;
}) {
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
              <div className="flex justify-between text-sm"><span className="text-surface-400">Rooms</span><span>{booking.numRooms}</span></div>
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
              <button onClick={() => onCancel(booking.id)} className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                <XCircle className="w-4 h-4" /> Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
