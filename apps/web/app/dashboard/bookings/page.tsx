'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Search, Filter } from 'lucide-react';
import { bookingsApi } from '@/lib/api';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchBookings() {
      try {
        const params: Record<string, string> = { limit: '20' };
        if (statusFilter) params.status = statusFilter;
        const res = await bookingsApi.list(params);
        if (res.success) setBookings(res.data);
      } catch (err) {
        console.error('Bookings fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [statusFilter]);

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending_confirmation: { label: 'Pending', class: 'badge-warning' },
    confirmed: { label: 'Confirmed', class: 'badge-info' },
    checked_in: { label: 'Checked In', class: 'badge-success' },
    checked_out: { label: 'Checked Out', class: 'badge bg-surface-500/20 text-surface-400 border border-surface-500/20' },
    cancelled: { label: 'Cancelled', class: 'badge-danger' },
    no_show: { label: 'No Show', class: 'badge-danger' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Bookings</h1>
          <p className="text-surface-400">Manage all reservations and walk-ins</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search guest name or booking ID..." value={searchQuery}
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
      ) : bookings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-surface-400 mb-4">Create your first booking to see it here.</p>
          <button className="btn-primary">New Booking</button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.02] cursor-pointer transition-colors">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
