'use client';

import { useEffect, useState } from 'react';
import { BedDouble, CalendarDays, Users, ArrowUpRight, ArrowDownRight, TrendingUp, ClipboardList, IndianRupee, PieChart } from 'lucide-react';
import { dashboardApi, analyticsApi } from '@/lib/api';

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
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          dashboardApi.get(),
          analyticsApi.getOverview()
        ]);
        if (dashRes.success) setData(dashRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
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

  // Calculate ADR and RevPAR
  const totalRevenueThisMonth = analytics?.revenue?.thisMonth || 0;
  const totalBookingsThisMonth = analytics?.bookings?.thisMonth || 0;
  
  // These calculations exist on backend but we can compute safely if missing
  const adr = totalBookingsThisMonth > 0 ? (totalRevenueThisMonth / totalBookingsThisMonth) : 0;
  const revPar = data?.rooms.total ? (totalRevenueThisMonth / (data.rooms.total * 30)) : 0; // Approximating 30 days for month

  const stats = [
    {
      label: 'Monthly Revenue',
      value: `₹${totalRevenueThisMonth.toLocaleString('en-IN')}`,
      detail: `${totalBookingsThisMonth} total bookings`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-600/20',
    },
    {
      label: 'Occupancy',
      value: `${data?.rooms.occupancyPercent || 0}%`,
      detail: `${data?.rooms.occupied || 0} / ${data?.rooms.total || 0} rooms`,
      icon: BedDouble,
      color: 'text-primary-400',
      bgColor: 'bg-primary-600/20',
    },
    {
      label: 'Average Daily Rate (ADR)',
      value: `₹${Math.round(adr).toLocaleString('en-IN')}`,
      detail: 'Average rate per booking',
      icon: IndianRupee,
      color: 'text-amber-400',
      bgColor: 'bg-amber-600/20',
    },
    {
      label: 'RevPAR',
      value: `₹${Math.round(revPar).toLocaleString('en-IN')}`,
      detail: 'Revenue per available room',
      icon: PieChart,
      color: 'text-accent-400',
      bgColor: 'bg-accent-600/20',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Analytics Dashboard</h1>
        <p className="text-surface-400">Key Performance Indicators & Overview for {data?.today || 'today'}</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Operations Overview */}
        <div className="glass-card p-6 border-t-[3px] border-t-primary-500">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-400" /> Daily Operations
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-800/50">
              <span className="text-surface-300">Expected Check-ins</span>
              <span className="text-lg font-bold text-emerald-400">{data?.todayCheckIns || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-800/50">
              <span className="text-surface-300">Expected Check-outs</span>
              <span className="text-lg font-bold text-amber-400">{data?.todayCheckOuts || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-800/50">
              <span className="text-surface-300">Pending Bookings</span>
              <span className="text-lg font-bold text-accent-400">{data?.pendingBookings || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-800/50">
              <span className="text-surface-300">Housekeeping Tasks</span>
              <span className="text-lg font-bold text-surface-100">{data?.pendingHousekeeping || 0}</span>
            </div>
          </div>
        </div>

        {/* Booking Sources Distribution */}
        <div className="glass-card p-6 border-t-[3px] border-t-accent-500">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-400" /> Booking Sources
          </h2>
          <div className="space-y-4 mt-2">
            {Object.keys(analytics?.bookingSources || {}).length > 0 ? (
              Object.entries(analytics.bookingSources).map(([source, count]: [string, any]) => {
                const percentage = Math.round((count / totalBookingsThisMonth) * 100) || 0;
                return (
                  <div key={source} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{source.replace(/_/g, ' ')}</span>
                      <span className="text-surface-400">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-surface-800 rounded-full h-2">
                      <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-surface-500 text-center py-8">No source data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Operations</h2>
            <a href="/dashboard/bookings" className="text-sm text-primary-400 hover:text-primary-300">All →</a>
          </div>
          <div className="space-y-3">
            {data?.recentBookings?.length ? data.recentBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02]">
                <div>
                  <p className="text-sm font-medium">{booking.guestName}</p>
                  <p className="text-xs text-surface-500">{booking.bookingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
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
              <p className="text-sm text-surface-500 text-center py-8">No bookings yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
