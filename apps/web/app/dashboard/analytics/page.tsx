'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, BedDouble, CalendarDays, IndianRupee, Users } from 'lucide-react';
import { analyticsApi } from '@/lib/api';

interface AnalyticsData {
  occupancy: { current: number; total: number; percent: number };
  revenue: { today: number; thisMonth: number; lastMonth: number };
  bookings: { today: number; thisMonth: number; pending: number };
  guestCount: number;
  bookingSources?: Record<string, number>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getOverview()
      .then((res) => { if (res.success) setData(res.data); })
      .catch((err) => console.error('Analytics fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-6 h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="glass-card p-6 h-64" />)}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Occupancy Rate',
      value: `${data?.occupancy?.percent || 0}%`,
      detail: `${data?.occupancy?.current || 0} of ${data?.occupancy?.total || 0} rooms`,
      icon: BedDouble, color: 'text-primary-400', bg: 'bg-primary-600/20',
    },
    {
      label: 'Revenue (This Month)',
      value: `₹${(data?.revenue?.thisMonth || 0).toLocaleString('en-IN')}`,
      detail: `Last month: ₹${(data?.revenue?.lastMonth || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-600/20',
    },
    {
      label: 'Bookings (This Month)',
      value: data?.bookings?.thisMonth || 0,
      detail: `${data?.bookings?.pending || 0} pending confirmation`,
      icon: CalendarDays, color: 'text-amber-400', bg: 'bg-amber-600/20',
    },
    {
      label: 'Total Guests',
      value: data?.guestCount || 0,
      detail: 'Registered guest profiles',
      icon: Users, color: 'text-accent-400', bg: 'bg-accent-600/20',
    },
  ];

  // Booking sources data for bar chart
  const sources = data?.bookingSources || {};
  const sourceEntries = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  const maxSourceValue = Math.max(...Object.values(sources), 1);

  const sourceLabels: Record<string, string> = {
    walk_in: 'Walk-in', phone: 'Phone', website: 'Website', email: 'Email',
    ota_booking_com: 'Booking.com', ota_makemytrip: 'MakeMyTrip', ota_goibibo: 'Goibibo',
    ota_other: 'Other OTA', agent: 'Travel Agent',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Analytics</h1>
        <p className="text-surface-400">Property performance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold mb-1">{card.value}</p>
            <p className="text-sm text-surface-400">{card.label}</p>
            <p className="text-xs text-surface-500 mt-1">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Comparison */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Revenue Summary
          </h2>
          <div className="space-y-5">
            {[
              { label: 'Today', value: data?.revenue?.today || 0, max: data?.revenue?.thisMonth || 1 },
              { label: 'This Month', value: data?.revenue?.thisMonth || 0, max: Math.max(data?.revenue?.thisMonth || 0, data?.revenue?.lastMonth || 0, 1) },
              { label: 'Last Month', value: data?.revenue?.lastMonth || 0, max: Math.max(data?.revenue?.thisMonth || 0, data?.revenue?.lastMonth || 0, 1) },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-400">{item.label}</span>
                  <span className="font-medium">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Sources */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" /> Booking Sources
          </h2>
          {sourceEntries.length === 0 ? (
            <p className="text-surface-500 text-sm text-center py-8">No booking source data yet</p>
          ) : (
            <div className="space-y-4">
              {sourceEntries.map(([source, count]) => (
                <div key={source}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-surface-400">{sourceLabels[source] || source}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700"
                      style={{ width: `${(count / maxSourceValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
