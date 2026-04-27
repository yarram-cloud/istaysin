'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, BedDouble, CalendarDays,
  IndianRupee, Users, Printer, Lock, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { analyticsApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import PlanGate from '@/app/dashboard/_components/plan-gate';
import { getCurrentPlan, hasAccess } from '@/lib/plan-gate';

// Stable lookup — defined outside component to prevent recreation each render
const SOURCE_LABELS: Record<string, string> = {
  walk_in:        'Walk-in',
  phone:          'Phone',
  website:        'Website',
  email:          'Email',
  ota_booking_com:'Booking.com',
  ota_makemytrip: 'MakeMyTrip',
  ota_goibibo:    'Goibibo',
  ota_other:      'Other OTA',
  agent:          'Travel Agent',
};

interface AnalyticsData {
  occupancy: { current: number; total: number; percent: number };
  revenue:   { today: number; thisMonth: number; lastMonth: number };
  bookings:  { today: number; thisMonth: number; pending: number };
  guestCount: number;
  bookingSources?: Record<string, number>;
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading analytics">
      <div className="h-8 w-48 bg-surface-100 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-100 p-6 h-32" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-100 p-6 h-64" />
        ))}
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}
function StatCard({ label, value, detail, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-display font-bold mb-1">{value}</p>
      <p className="text-sm text-surface-400">{label}</p>
      <p className="text-xs text-surface-500 mt-1">{detail}</p>
    </div>
  );
}

// ─── Professional upsell banner (shown inside Starter view) ───────────────────
function ProUpsellBanner() {
  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white border border-primary-100 flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-primary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-900 text-sm">Unlock Revenue & Booking Source Charts</p>
        <p className="text-xs text-surface-500 mt-0.5">
          Upgrade to Professional for trend charts, booking source breakdown, and historical comparison.
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Upgrade <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const t = useTranslations('Dashboard');
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan]       = useState('free');

  useEffect(() => {
    setPlan(getCurrentPlan());
    analyticsApi.getOverview()
      .then((res) => { if (res.success) setData(res.data); })
      .catch((err) => console.error('Analytics fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const isProfessional = hasAccess(plan, 'professional');

  const cards: StatCardProps[] = [
    {
      label:  t('analyticsPage.occupancyRate'),
      value:  `${data?.occupancy?.percent || 0}%`,
      detail: `${data?.occupancy?.current || 0} ${t('analyticsPage.ofRooms', { total: data?.occupancy?.total || 0 })}`,
      icon: BedDouble, color: 'text-primary-400', bg: 'bg-primary-600/20',
    },
    {
      label:  t('analyticsPage.revenueThisMonth'),
      value:  `₹${(data?.revenue?.thisMonth || 0).toLocaleString('en-IN')}`,
      detail: `${t('analyticsPage.lastMonth')}: ₹${(data?.revenue?.lastMonth || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-600/20',
    },
    {
      label:  t('analyticsPage.bookingsThisMonth'),
      value:  data?.bookings?.thisMonth || 0,
      detail: `${data?.bookings?.pending || 0} ${t('analyticsPage.pendingConfirmation')}`,
      icon: CalendarDays, color: 'text-amber-400', bg: 'bg-amber-600/20',
    },
    {
      label:  t('analyticsPage.totalGuests'),
      value:  data?.guestCount || 0,
      detail: t('analyticsPage.registeredProfiles'),
      icon: Users, color: 'text-accent-400', bg: 'bg-accent-600/20',
    },
  ];

  // Charts data — only computed when Professional
  const sources      = data?.bookingSources || {};
  const sourceEntries = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  const maxSourceValue = Object.values(sources).length > 0
    ? Math.max(...Object.values(sources))
    : 1;

  return (
    // Gate outer: Starter (basic) and above
    <PlanGate requiredPlan="basic" featureName="Analytics">
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Page header */}
          <div className="flex items-start sm:items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold mb-1">{t('analytics')}</h1>
              <p className="text-surface-400 text-sm">{t('analyticsSub')}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="btn-secondary flex items-center gap-2 print:hidden text-sm"
            >
              <Printer className="w-4 h-4" /> {t('printReport')}
            </button>
          </div>

          {/* Stat cards — available to all Starter+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Charts section — Professional only */}
          {isProfessional ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Comparison */}
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  {t('analyticsPage.revenueSummary')}
                </h2>
                <div className="space-y-4 sm:space-y-5">
                  {[
                    {
                      label: t('today'),
                      value: data?.revenue?.today || 0,
                      max:   Math.max(data?.revenue?.thisMonth || 0, data?.revenue?.today || 0, 1),
                    },
                    {
                      label: t('analyticsPage.thisMonth'),
                      value: data?.revenue?.thisMonth || 0,
                      max:   Math.max(data?.revenue?.thisMonth || 0, data?.revenue?.lastMonth || 0, 1),
                    },
                    {
                      label: t('analyticsPage.lastMonth'),
                      value: data?.revenue?.lastMonth || 0,
                      max:   Math.max(data?.revenue?.thisMonth || 0, data?.revenue?.lastMonth || 0, 1),
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-surface-400">{item.label}</span>
                        <span className="font-medium tabular-nums">
                          ₹{item.value.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                          style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Sources */}
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-5 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-400" />
                  {t('analyticsPage.bookingSources')}
                </h2>
                {sourceEntries.length === 0 ? (
                  <p className="text-surface-500 text-sm text-center py-8">
                    {t('analyticsPage.noSourceData')}
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {sourceEntries.map(([source, count]) => (
                      <div key={source}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-surface-400 truncate mr-2">
                            {SOURCE_LABELS[source] || source}
                          </span>
                          <span className="font-medium tabular-nums shrink-0">{count}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700"
                            style={{ width: `${(count / maxSourceValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Starter plan: show upsell banner instead of charts
            <ProUpsellBanner />
          )}
        </div>
      )}
    </PlanGate>
  );
}
