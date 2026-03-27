'use client';

import { useEffect, useState } from 'react';
import { BedDouble, CalendarDays, Users, ArrowUpRight, ArrowDownRight, TrendingUp, ClipboardList } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface DashboardData {
  today: string;
  rooms: { total: number; occupied: number; available: number; occupancyPercent: number };
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingBookings: number;
  pendingHousekeeping: number;
  recentBookings: any[];
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await dashboardApi.get();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Occupancy',
      value: `${data?.rooms.occupancyPercent || 0}%`,
      detail: `${data?.rooms.occupied || 0} / ${data?.rooms.total || 0} rooms`,
      icon: BedDouble,
      color: 'text-primary-400',
      bgColor: 'bg-primary-600/20',
    },
    {
      label: "Today's Check-ins",
      value: data?.todayCheckIns || 0,
      detail: 'Expected arrivals',
      icon: ArrowUpRight,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-600/20',
    },
    {
      label: "Today's Check-outs",
      value: data?.todayCheckOuts || 0,
      detail: 'Expected departures',
      icon: ArrowDownRight,
      color: 'text-amber-400',
      bgColor: 'bg-amber-600/20',
    },
    {
      label: 'Pending Bookings',
      value: data?.pendingBookings || 0,
      detail: 'Awaiting confirmation',
      icon: CalendarDays,
      color: 'text-accent-400',
      bgColor: 'bg-accent-600/20',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Dashboard</h1>
        <p className="text-surface-400">Overview for {data?.today || 'today'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-surface-400">{stat.label}</p>
            <p className="text-xs text-surface-500 mt-1">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Bookings */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'New Walk-in Booking', href: '/dashboard/bookings/new', icon: CalendarDays },
              { label: 'Check-in Guest', href: '/dashboard/bookings', icon: ArrowUpRight },
              { label: 'Room Status Board', href: '/dashboard/rooms', icon: BedDouble },
              { label: 'Housekeeping Tasks', href: '/dashboard/housekeeping', icon: ClipboardList },
            ].map((action) => (
              <a key={action.label} href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 group">
                <action.icon className="w-5 h-5 text-surface-400 group-hover:text-primary-400 transition-colors" />
                <span className="text-sm">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Bookings</h2>
            <a href="/dashboard/bookings" className="text-sm text-primary-400 hover:text-primary-300">View all →</a>
          </div>
          <div className="space-y-3">
            {data?.recentBookings?.length ? data.recentBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <p className="text-sm font-medium">{booking.guestName}</p>
                  <p className="text-xs text-surface-500">{booking.bookingNumber} · {booking.numRooms} room(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    booking.status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-400' :
                    booking.status === 'confirmed' ? 'bg-primary-500/20 text-primary-400' :
                    booking.status === 'pending_confirmation' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-surface-500/20 text-surface-400'
                  }`}>
                    {booking.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-surface-500 text-center py-8">No bookings yet. Create your first booking!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
