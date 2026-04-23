'use client';

import { useEffect, useState } from 'react';
import { BedDouble, CalendarDays, Users, ArrowRight, TrendingUp, ClipboardList, IndianRupee, PieChart, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
        <div className="h-8 w-48 bg-surface-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalRevenueThisMonth = analytics?.revenue?.thisMonth || 0;
  const totalBookingsThisMonth = analytics?.bookings?.thisMonth || 0;
  const adr = totalBookingsThisMonth > 0 ? (totalRevenueThisMonth / totalBookingsThisMonth) : 0;
  const revPar = data?.rooms.total ? (totalRevenueThisMonth / (data.rooms.total * 30)) : 0;

  const stats = [
    {
      label: 'Monthly Revenue',
      value: `₹${totalRevenueThisMonth.toLocaleString('en-IN')}`,
      detail: `${totalBookingsThisMonth} total bookings`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      href: '/dashboard/analytics',
    },
    {
      label: 'Occupancy',
      value: `${data?.rooms.occupancyPercent || 0}%`,
      detail: `${data?.rooms.occupied || 0} / ${data?.rooms.total || 0} rooms`,
      icon: BedDouble,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-100',
      href: '/dashboard/rooms',
    },
    {
      label: 'Average Daily Rate (ADR)',
      value: `₹${Math.round(adr).toLocaleString('en-IN')}`,
      detail: 'Average rate per booking',
      icon: IndianRupee,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      href: '/dashboard/analytics',
    },
    {
      label: 'RevPAR',
      value: `₹${Math.round(revPar).toLocaleString('en-IN')}`,
      detail: 'Revenue per available room',
      icon: PieChart,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
      href: '/dashboard/analytics',
    },
  ];

  const operations = [
    { label: 'Expected Check-ins', value: data?.todayCheckIns || 0, color: 'text-emerald-600 bg-emerald-50', href: '/dashboard/bookings?status=confirmed' },
    { label: 'Expected Check-outs', value: data?.todayCheckOuts || 0, color: 'text-amber-600 bg-amber-50', href: '/dashboard/bookings?status=checked_in' },
    { label: 'Pending Bookings', value: data?.pendingBookings || 0, color: 'text-primary-600 bg-primary-50', href: '/dashboard/bookings?status=pending_confirmation' },
    { label: 'Housekeeping Tasks', value: data?.pendingHousekeeping || 0, color: 'text-surface-600 bg-surface-100', href: '/dashboard/housekeeping' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold mb-1 text-surface-900">Analytics Dashboard</h1>
        <p className="text-surface-500 text-sm">Key Performance Indicators & Overview for {data?.today || 'today'}</p>
      </div>

      {/* Stats Grid — Clickable Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => router.push(stat.href)}
            className={`stat-card group cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-left border ${stat.borderColor}`}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
              <ChevronRight className="w-4 h-4 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold mb-0.5 text-surface-900">{stat.value}</p>
            <p className="text-xs sm:text-sm text-surface-500">{stat.label}</p>
            <p className="text-[10px] sm:text-xs text-surface-400 mt-0.5 sm:mt-1">{stat.detail}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Operations Overview — Clickable Rows */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5 sm:p-6 border-t-[3px] border-t-primary-500">
          <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-surface-900">
            <ClipboardList className="w-5 h-5 text-primary-500" /> Daily Operations
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {operations.map((op) => (
              <button
                key={op.label}
                onClick={() => router.push(op.href)}
                className="w-full flex justify-between items-center p-3 rounded-xl bg-surface-50 hover:bg-primary-50 hover:shadow-sm transition-all group cursor-pointer active:scale-[0.99]"
              >
                <span className="text-sm text-surface-600 group-hover:text-surface-900 transition-colors">{op.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base sm:text-lg font-bold px-2 py-0.5 rounded-lg ${op.color}`}>{op.value}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Booking Sources Distribution */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5 sm:p-6 border-t-[3px] border-t-amber-500">
          <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-surface-900">
            <Users className="w-5 h-5 text-amber-500" /> Booking Sources
          </h2>
          <div className="space-y-4 mt-2">
            {Object.keys(analytics?.bookingSources || {}).length > 0 ? (
              Object.entries(analytics.bookingSources).map(([source, count]: [string, any]) => {
                const percentage = Math.round((count / totalBookingsThisMonth) * 100) || 0;
                return (
                  <div key={source} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-surface-700 font-medium">{source.replace(/_/g, ' ')}</span>
                      <span className="text-surface-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-surface-400 text-center py-8">No source data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity — Clickable */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5 sm:p-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-surface-900">Recent Operations</h2>
            <button onClick={() => router.push('/dashboard/bookings')} className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1 font-medium">
              All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {data?.recentBookings?.length ? data.recentBookings.map((booking: any) => (
              <button
                key={booking.id}
                onClick={() => router.push(`/dashboard/bookings?selected=${booking.id}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-50 hover:bg-primary-50 transition-all group cursor-pointer text-left active:scale-[0.99]"
              >
                <div>
                  <p className="text-sm font-medium text-surface-900">{booking.guestName}</p>
                  <p className="text-xs text-surface-500">{booking.bookingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${
                    booking.status === 'checked_in' ? 'bg-emerald-100 text-emerald-700' :
                    booking.status === 'confirmed' ? 'bg-primary-100 text-primary-700' :
                    booking.status === 'pending_confirmation' ? 'bg-amber-100 text-amber-700' :
                    'bg-surface-100 text-surface-500'
                  }`}>
                    {booking.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </button>
            )) : (
              <p className="text-sm text-surface-400 text-center py-8">No bookings yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
