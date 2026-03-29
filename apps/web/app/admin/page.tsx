'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, CalendarDays, ClipboardCheck, TrendingUp, ArrowRight,
} from 'lucide-react';
import { platformApi } from '@/lib/api';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  pendingApprovals: number;
  totalBookings: number;
  totalUsers: number;
  recentRegistrations: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    platformApi.getAnalytics()
      .then((res: any) => setStats(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-center">
        <p className="font-medium">Failed to load analytics</p>
        <p className="text-sm mt-1 text-red-400">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Properties',
      value: stats?.totalTenants || 0,
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Active Properties',
      value: stats?.activeTenants || 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: ClipboardCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      highlight: (stats?.pendingApprovals || 0) > 0,
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: CalendarDays,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
    },
    {
      label: 'New (Last 30 days)',
      value: stats?.recentRegistrations || 0,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Platform Overview</h1>
        <p className="text-surface-400 text-sm mt-1">Monitor properties, users, and bookings across the platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`glass-card p-5 rounded-2xl border ${card.border} ${card.highlight ? 'ring-1 ring-amber-500/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {card.highlight && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium animate-pulse">
                  Needs Action
                </span>
              )}
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-surface-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {(stats?.pendingApprovals || 0) > 0 && (
        <Link
          href="/admin/registrations"
          className="flex items-center justify-between p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-200">
                {stats?.pendingApprovals} propert{stats?.pendingApprovals === 1 ? 'y' : 'ies'} awaiting approval
              </p>
              <p className="text-sm text-surface-400 mt-0.5">Review and approve new property registrations</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
