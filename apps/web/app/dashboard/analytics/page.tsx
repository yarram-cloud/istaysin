'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart3, TrendingUp, BedDouble, CalendarDays,
  IndianRupee, Users, Printer, Lock, ArrowRight, Utensils,
  Clock, AlertTriangle, CheckCircle2, ChevronDown,
  ArrowUpRight, ArrowDownRight, RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { analyticsApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import PlanGate from '@/app/dashboard/_components/plan-gate';
import { getCurrentPlan, hasAccess } from '@/lib/plan-gate';

const SOURCE_LABELS: Record<string, string> = {
  walkin:          'Walk-in',   // stored without underscore
  phone:           'Phone',
  website:         'Website',
  email:           'Email',
  ota_booking_com: 'Booking.com',
  ota_makemytrip:  'MakeMyTrip',
  ota_goibibo:     'Goibibo',
  ota_other:       'Other OTA',
  agent:           'Travel Agent',
};

// ─── Date range presets ──────────────────────────────────────────────────────
function getPresetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === 'today') {
    const s = fmt(now);
    return { from: s, to: s };
  }
  if (preset === '7d') {
    const s = new Date(now); s.setDate(now.getDate() - 6);
    return { from: fmt(s), to: fmt(now) };
  }
  if (preset === '30d') {
    const s = new Date(now); s.setDate(now.getDate() - 29);
    return { from: fmt(s), to: fmt(now) };
  }
  // This month (default)
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: fmt(s), to: fmt(now) };
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading analytics">
      <div className="h-8 w-48 bg-surface-100 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-100 p-6 h-32" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-100 p-6 h-28" />
        ))}
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  growth?: number | null;
  locked?: boolean;
}
function StatCard({ label, value, detail, icon: Icon, color, bg, growth, locked }: StatCardProps) {
  return (
    <div className="stat-card relative overflow-hidden">
      {locked && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
          <Lock className="w-5 h-5 text-surface-300" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {growth !== null && growth !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
            growth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold mb-0.5 tabular-nums">{value}</p>
      <p className="text-xs text-surface-400 leading-snug">{label}</p>
      {detail && <p className="text-xs text-surface-500 mt-1">{detail}</p>}
    </div>
  );
}

// ─── Today panel card ────────────────────────────────────────────────────────
function TodayCard({ label, value, icon: Icon, urgent }: {
  label: string; value: number; icon: React.ElementType; urgent?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${
      urgent && value > 0
        ? 'bg-red-50 border-red-200'
        : 'bg-white border-surface-100'
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        urgent && value > 0 ? 'bg-red-100' : 'bg-surface-100'
      }`}>
        <Icon className={`w-4 h-4 ${urgent && value > 0 ? 'text-red-600' : 'text-surface-500'}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold tabular-nums ${urgent && value > 0 ? 'text-red-600' : 'text-surface-900'}`}>
          {value}
        </p>
        <p className="text-xs text-surface-400 leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ─── KPI health indicator ────────────────────────────────────────────────────
function KpiHealth({ label, value, suffix = '%', thresholds }: {
  label: string; value: number; suffix?: string;
  thresholds: { good: number; ok: number }; // value < good = green, < ok = amber, else red
}) {
  const status = value <= thresholds.good ? 'good' : value <= thresholds.ok ? 'ok' : 'bad';
  const cls = status === 'good' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : status === 'ok' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${cls}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold tabular-nums">{value}{suffix}</span>
    </div>
  );
}

// ─── Pro upsell banner ───────────────────────────────────────────────────────
function ProUpsellBanner() {
  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white border border-primary-100 flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-primary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-900 text-sm">Unlock ADR, RevPAR & Advanced KPIs</p>
        <p className="text-xs text-surface-500 mt-0.5">
          Upgrade to Professional for ADR, RevPAR, repeat guest rate, top room types, and health indicators.
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

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const t = useTranslations('Dashboard');
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [plan, setPlan]         = useState('free');
  const [preset, setPreset]     = useState('month');
  const [customFrom, setFrom]   = useState('');
  const [customTo, setTo]       = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const customPickerRef = useRef<HTMLDivElement>(null);

  // Close custom date picker when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (customPickerRef.current && !customPickerRef.current.contains(e.target as Node)) {
        setShowCustom(false);
      }
    }
    if (showCustom) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showCustom]);

  const isProfessional = hasAccess(plan, 'professional');

  const fetchData = useCallback(async (params?: { from?: string; to?: string }) => {
    setLoading(true);
    try {
      const res = await analyticsApi.getOverviewV2(params);
      if (res.success) setData(res.data);
    } catch (err) {
      console.error('Analytics v2 fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPlan(getCurrentPlan());
    const range = getPresetRange('month');
    fetchData(range);
  }, [fetchData]);

  function handlePreset(p: string) {
    setPreset(p);
    setShowCustom(false);
    fetchData(getPresetRange(p));
  }

  function handleCustomApply() {
    if (customFrom && customTo && customFrom <= customTo) {
      setPreset('custom');
      fetchData({ from: customFrom, to: customTo });
      setShowCustom(false);
    }
  }

  // Derived
  const occ     = data?.occupancy    || { current: 0, total: 0, percent: 0 };
  const rev     = data?.revenue      || {};
  const kpi     = data?.kpi          || {};
  const today   = data?.today        || {};
  const sources = data?.bookingSources || {};
  const topRTs  = data?.topRoomTypes || [];

  const sourceEntries = Object.entries(sources).sort((a: any, b: any) => b[1] - a[1]);
  const maxSource = sourceEntries.length > 0 ? Math.max(...sourceEntries.map((e: any) => e[1])) : 1;
  const maxRT     = topRTs.length > 0 ? topRTs[0].revenue : 1;

  return (
    <PlanGate requiredPlan="basic" featureName="Analytics">
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">

          {/* Header */}
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

          {/* Date range picker */}
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {(['today', '7d', '30d', 'month'] as const).map(p => (
              <button key={p} onClick={() => handlePreset(p)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  preset === p
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'
                }`}>
                {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'This month'}
              </button>
            ))}
            <div className="relative" ref={customPickerRef}>
              <button onClick={() => setShowCustom(!showCustom)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  preset === 'custom'
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'
                }`}>
                Custom <ChevronDown className="w-3 h-3" />
              </button>
              {showCustom && (
                <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-surface-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[240px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider block mb-1">From</label>
                      <input type="date" value={customFrom} onChange={e => setFrom(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-surface-200 text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider block mb-1">To</label>
                      <input type="date" value={customTo} onChange={e => setTo(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-surface-200 text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                    </div>
                  </div>
                  <button onClick={handleCustomApply}
                    disabled={!customFrom || !customTo || customFrom > customTo}
                    className="h-8 rounded-lg bg-primary-700 text-white text-xs font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40">
                    Apply
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => { setPreset('month'); fetchData(getPresetRange('month')); }}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-surface-200 text-surface-400 hover:text-surface-700 hover:bg-surface-50 transition-colors" title="Refresh">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── TODAY AT-A-GLANCE ── */}
          <div className="glass-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Today At-a-Glance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <TodayCard label="Arrivals Expected"   value={today.arrivalsExpected   || 0} icon={ArrowUpRight} />
              <TodayCard label="Departures Due"      value={today.departuresExpected || 0} icon={ArrowDownRight} />
              <TodayCard label="Overdue Check-outs"  value={today.overdueCheckouts  || 0} icon={AlertTriangle} urgent />
              <TodayCard label="Pending Confirmation" value={today.pendingConfirmation || 0} icon={Clock} />
            </div>
          </div>

          {/* ── PRIMARY STAT CARDS (2×2 mobile, 4-wide desktop) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              label="Occupancy"
              value={`${occ.percent}%`}
              detail={`${occ.current} of ${occ.total} rooms occupied`}
              icon={BedDouble} color="text-primary-400" bg="bg-primary-600/20"
            />
            <StatCard
              label="Room Revenue"
              value={`₹${(rev.period || 0).toLocaleString('en-IN')}`}
              detail={rev.fnb ? `+ ₹${rev.fnb.toLocaleString('en-IN')} F&B` : undefined}
              icon={IndianRupee} color="text-emerald-400" bg="bg-emerald-600/20"
              growth={rev.growth}
            />
            <StatCard
              label="ADR"
              value={`₹${(kpi.adr || 0).toLocaleString('en-IN')}`}
              detail="Avg Daily Rate per booking"
              icon={TrendingUp} color="text-amber-400" bg="bg-amber-600/20"
              locked={!isProfessional}
            />
            <StatCard
              label="RevPAR"
              value={`₹${(kpi.revpar || 0).toLocaleString('en-IN')}`}
              detail="Revenue per available room/day"
              icon={BarChart3} color="text-accent-400" bg="bg-accent-600/20"
              locked={!isProfessional}
            />
          </div>

          {/* ── SECONDARY KPIS (2×2 → 4-wide) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              label="Avg Stay Length"
              value={`${kpi.avgLengthOfStay || 0} nights`}
              detail="Per confirmed booking"
              icon={CalendarDays} color="text-sky-400" bg="bg-sky-600/20"
              locked={!isProfessional}
            />
            <StatCard
              label="Repeat Guests"
              value={`${kpi.repeatGuestPercent || 0}%`}
              detail="Guests with 2+ bookings"
              icon={Users} color="text-violet-400" bg="bg-violet-600/20"
              locked={!isProfessional}
            />
            <StatCard
              label="Total Bookings"
              value={data?.bookings?.period || 0}
              detail={`${data?.bookings?.pending || 0} pending confirmation`}
              icon={CheckCircle2} color="text-teal-400" bg="bg-teal-600/20"
            />
            <StatCard
              label="Total Guests"
              value={data?.guestCount || 0}
              detail="Registered profiles"
              icon={Users} color="text-rose-400" bg="bg-rose-600/20"
            />
          </div>

          {/* ── PROFESSIONAL SECTION ── */}
          {isProfessional ? (
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Booking Sources */}
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary-400" /> Booking Sources
                </h2>
                {sourceEntries.length === 0 ? (
                  <p className="text-surface-500 text-sm text-center py-8">No bookings this period</p>
                ) : (
                  <div className="space-y-3">
                    {sourceEntries.map(([source, count]) => (
                      <div key={source}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-surface-400 truncate mr-2">{SOURCE_LABELS[source] || source}</span>
                          <span className="font-semibold tabular-nums shrink-0">{count as number}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700"
                            style={{ width: `${((count as number) / maxSource) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Room Types */}
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-emerald-400" /> Top Room Types
                </h2>
                {topRTs.length === 0 ? (
                  <p className="text-surface-500 text-sm text-center py-8">No bookings this period</p>
                ) : (
                  <div className="space-y-3">
                    {topRTs.map((rt: any, i: number) => (
                      <div key={rt.name}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-surface-400 truncate mr-2 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-surface-100 flex items-center justify-center text-[9px] font-bold text-surface-500 shrink-0">{i + 1}</span>
                            {rt.name}
                          </span>
                          <span className="font-semibold tabular-nums text-emerald-400 shrink-0">
                            ₹{rt.revenue.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                            style={{ width: `${(rt.revenue / maxRT) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* KPI Health + F&B */}
              <div className="glass-card p-5 sm:p-6 space-y-3">
                <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> KPI Health
                </h2>
                <KpiHealth label="No-Show Rate"      value={kpi.noShowRate      || 0} thresholds={{ good: 5, ok: 10 }} />
                <KpiHealth label="Cancellation Rate" value={kpi.cancellationRate || 0} thresholds={{ good: 10, ok: 20 }} />

                {/* F&B Revenue */}
                {rev.fnb > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" /> F&B Revenue
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-surface-400">Room Revenue</span>
                        <span className="font-semibold tabular-nums">₹{(rev.period || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-400">F&B / POS</span>
                        <span className="font-semibold tabular-nums text-amber-400">₹{rev.fnb.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/[0.06] pt-2 font-bold">
                        <span>Total Revenue</span>
                        <span className="tabular-nums text-emerald-400">₹{(rev.total || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ProUpsellBanner />
          )}

        </div>
      )}
    </PlanGate>
  );
}
