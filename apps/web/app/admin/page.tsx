'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, CalendarDays, ClipboardCheck, TrendingUp,
  ArrowRight, Activity, Sparkles, ChevronRight,
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

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  glow: string;
  href: string;
  trend?: string;
  highlight?: boolean;
}

export default function AdminOverviewPage() {
  const router = useRouter();
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
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-white/[0.06] rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
        <p className="font-semibold text-red-300">Failed to load platform analytics</p>
        <p className="text-sm mt-1 text-red-400/70">{error}</p>
      </div>
    );
  }

  const cards: StatCard[] = [
    {
      label: 'Total Properties',
      value: stats?.totalTenants || 0,
      icon: Building2,
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-blue-600/5',
      glow: 'shadow-blue-500/10',
      href: '/admin/tenants',
      trend: 'All registered properties',
    },
    {
      label: 'Active Properties',
      value: stats?.activeTenants || 0,
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/20 to-emerald-600/5',
      glow: 'shadow-emerald-500/10',
      href: '/admin/tenants',
      trend: 'Live on platform',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: ClipboardCheck,
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-amber-600/5',
      glow: 'shadow-amber-500/10',
      href: '/admin/registrations',
      highlight: (stats?.pendingApprovals || 0) > 0,
      trend: (stats?.pendingApprovals || 0) > 0 ? 'Needs your attention' : 'All clear',
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: CalendarDays,
      color: 'text-violet-400',
      bg: 'from-violet-500/20 to-violet-600/5',
      glow: 'shadow-violet-500/10',
      href: '/admin/tenants',
      trend: 'Across all properties',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-pink-400',
      bg: 'from-pink-500/20 to-pink-600/5',
      glow: 'shadow-pink-500/10',
      href: '/admin/tenants',
      trend: 'Registered accounts',
    },
    {
      label: 'New Registrations',
      value: stats?.recentRegistrations || 0,
      icon: Sparkles,
      color: 'text-cyan-400',
      bg: 'from-cyan-500/20 to-cyan-600/5',
      glow: 'shadow-cyan-500/10',
      href: '/admin/registrations',
      trend: 'Last 30 days',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Platform Overview
          </h1>
          <p className="text-surface-400 text-sm mt-1.5">
            Monitor properties, users, and bookings across the iStays platform
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Pending Approvals Alert Banner */}
      {(stats?.pendingApprovals || 0) > 0 && (
        <Link
          href="/admin/registrations"
          className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-600/5 border border-amber-500/30 hover:border-amber-400/50 hover:from-amber-500/20 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-200 text-sm sm:text-base">
                {stats?.pendingApprovals} propert{stats?.pendingApprovals === 1 ? 'y' : 'ies'} awaiting approval
              </p>
              <p className="text-xs sm:text-sm text-surface-400 mt-0.5">
                Review and approve new property registrations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-medium text-amber-400/80">Review Now</span>
            <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => router.push(card.href)}
            className={`
              relative group text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300
              bg-gradient-to-br ${card.bg}
              shadow-lg ${card.glow}
              hover:scale-[1.02] hover:shadow-xl
              ${card.highlight
                ? 'border-amber-500/40 ring-1 ring-amber-500/20 hover:border-amber-400/60'
                : 'border-white/[0.08] hover:border-white/[0.16]'
              }
            `}
          >
            {/* Animated highlight pulse for pending approvals */}
            {card.highlight && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}

            {/* Top row: icon + chevron */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-black/20 backdrop-blur border border-white/[0.08] flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Value */}
            <p className="text-4xl font-display font-black text-white tracking-tight mb-1">
              {card.value.toLocaleString('en-IN')}
            </p>

            {/* Label */}
            <p className="text-sm font-semibold text-white/80">{card.label}</p>

            {/* Trend */}
            {card.trend && (
              <p className={`text-xs mt-1 ${card.highlight && card.value > 0 ? 'text-amber-400' : 'text-white/30'}`}>
                {card.trend}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Quick Nav Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Review Approvals', href: '/admin/registrations', color: 'hover:border-amber-500/40 hover:text-amber-300', icon: ClipboardCheck },
          { label: 'All Properties', href: '/admin/tenants', color: 'hover:border-blue-500/40 hover:text-blue-300', icon: Building2 },
          { label: 'Platform Settings', href: '/admin/settings', color: 'hover:border-violet-500/40 hover:text-violet-300', icon: TrendingUp },
          { label: 'Back to Dashboard', href: '/dashboard', color: 'hover:border-emerald-500/40 hover:text-emerald-300', icon: Activity },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-surface-400 text-sm font-medium transition-all group ${item.color}`}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="w-4 h-4" />
              {item.label}
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
