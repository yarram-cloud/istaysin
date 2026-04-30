'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  IndianRupee, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Clock, Search, SlidersHorizontal, RefreshCw,
  ChevronRight, Calendar, CreditCard, Building2, ArrowUpRight,
} from 'lucide-react';
import { useApi, useApiMutate } from '@/lib/use-api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RevenueRow {
  subscriptionId:     string | null;
  plan:               string;
  billingCycle:       'monthly' | 'yearly';
  status:             string;
  currentPeriodStart: string | null;
  renewsAt:           string | null;
  isOverdue:          boolean;
  daysUntilRenewal:   number | null;
  // Plan-derived billing — `expectedAmount` is the bill for the current cycle
  // (effectiveMonthly × 1 or effectiveYearlyPerMonth × 12). `isCustomPriced`
  // flags rows that have a per-tenant override in tenant.config.customPlanPricing.
  expectedAmount:          number;
  effectiveMonthly:        number;
  effectiveYearlyPerMonth: number;
  isCustomPriced:          boolean;
  tenant: {
    id: string; name: string; slug: string;
    contactEmail?: string; city?: string; state?: string;
    tenantStatus?: string;
    owner: { fullName: string; email: string };
  };
  lastPayment: {
    id: string; amount: number; status: string;
    paidAt: string; receiptNumber: string;
  } | null;
}

interface Summary {
  totalRevenue: number;
  activeCount:  number;
  overdueCount: number;
  totalCount:   number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_STYLE: Record<string, string> = {
  free:         'bg-surface-700/80 text-surface-300 border-surface-600/40',
  basic:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  professional: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  enterprise:   'bg-amber-500/15 text-amber-300 border-amber-500/25',
};

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function PayBadge({ row }: { row: RevenueRow }) {
  const pay = row.lastPayment;
  if (!pay) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-surface-700/60 text-surface-400 border-surface-600/40 font-semibold">
        <XCircle className="w-3 h-3" /> No payment
      </span>
    );
  }
  if (pay.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/25 font-semibold">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  }
  if (pay.status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/25 font-semibold">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-red-500/15 text-red-300 border-red-500/25 font-semibold">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
}

function RenewalBadge({ row }: { row: RevenueRow }) {
  if (!row.renewsAt) {
    return <span className="text-[11px] text-surface-600 italic">No subscription</span>;
  }
  if (row.isOverdue) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Overdue by {Math.abs(row.daysUntilRenewal ?? 0)}d
        </span>
        <span className="text-[10px] text-surface-500">{fmtDate(row.renewsAt)}</span>
      </div>
    );
  }
  if ((row.daysUntilRenewal ?? 999) <= 7) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> {row.daysUntilRenewal}d left
        </span>
        <span className="text-[10px] text-surface-500">{fmtDate(row.renewsAt)}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-white/70">{fmtDate(row.renewsAt)}</span>
      <span className="text-[10px] text-surface-500">{row.daysUntilRenewal}d away</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminRevenuePage() {
  const [page, setPage]           = useState(1);

  // Filters
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [plan, setPlan]                 = useState('');
  const [billingCycle, setBillingCycle] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [overdueOnly, setOverdueOnly]   = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build a stable cache key from the current filters. Same key = SWR cache hit.
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (plan)            params.set('plan', plan);
    if (billingCycle)    params.set('billingCycle', billingCycle);
    if (paymentStatus)   params.set('paymentStatus', paymentStatus);
    if (overdueOnly)     params.set('overdue', 'true');
    return `/platform/revenue?${params.toString()}`;
  }, [page, debouncedSearch, plan, billingCycle, paymentStatus, overdueOnly]);

  const { data, isLoading, isValidating, mutate: revalidate } = useApi<{
    data: RevenueRow[];
    summary?: Summary;
    pagination: { total: number; totalPages: number };
  }>(endpoint, { keepPreviousData: true });

  const rows = data?.data || [];
  const summary = data?.summary || null;
  const totalPages = data?.pagination?.totalPages || 1;
  const total = data?.pagination?.total || 0;
  const loading = isLoading;
  const refreshing = isValidating && !isLoading;

  // Debounced search input — wait 400ms after the last keystroke before
  // committing to a new SWR key (otherwise every keystroke fires a request).
  function handleSearchChange(v: string) {
    setSearch(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(v);
    }, 400);
  }

  function resetFilters() {
    setSearch(''); setDebouncedSearch('');
    setPlan(''); setBillingCycle(''); setPaymentStatus(''); setOverdueOnly(false);
    setPage(1);
  }

  const hasFilter = !!(search || plan || billingCycle || paymentStatus || overdueOnly);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Revenue & Subscriptions
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Track all client subscriptions, billing cycles, payments, and renewals
          </p>
        </div>
        <button
          onClick={() => revalidate()}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] text-surface-400 hover:text-white hover:bg-white/[0.05] text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue Collected', value: fmtINR(summary.totalRevenue), icon: IndianRupee, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/20' },
            { label: 'Active Subscriptions',    value: String(summary.activeCount),  icon: TrendingUp,  color: 'text-blue-400',    bg: 'from-blue-500/20 to-blue-600/5',       border: 'border-blue-500/20' },
            { label: 'Overdue Renewals',         value: String(summary.overdueCount), icon: AlertTriangle, color: 'text-red-400',   bg: 'from-red-500/20 to-red-600/5',         border: 'border-red-500/20' },
            { label: 'Total Subscriptions',      value: String(summary.totalCount),   icon: Building2,   color: 'text-violet-400',  bg: 'from-violet-500/20 to-violet-600/5',   border: 'border-violet-500/20' },
          ].map((c) => (
            <div key={c.label} className={`p-4 sm:p-5 rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-black/20 border border-white/[0.08] flex items-center justify-center">
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-display font-black text-white">{c.value}</p>
              <p className="text-xs text-white/40 mt-1 font-medium">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        {/* Search always full-width */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search property name, slug, email…"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-900/80 border border-white/[0.08] text-white text-sm
              focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:outline-none
              placeholder-surface-600 transition-all"
          />
        </div>

        {/* Dropdowns — 2-col on mobile, 3-col on sm */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Plan filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500 pointer-events-none" />
            <select
              value={plan}
              onChange={(e) => { setPlan(e.target.value); setPage(1); }}
              className="pl-8 pr-6 py-2.5 rounded-xl bg-surface-900/80 border border-white/[0.08] text-white text-sm
                focus:border-primary-500/50 focus:outline-none appearance-none w-full transition-all cursor-pointer"
            >
              <option value="" className="bg-surface-900">All Plans</option>
              <option value="free"         className="bg-surface-900">Free</option>
              <option value="basic"        className="bg-surface-900">Basic</option>
              <option value="professional" className="bg-surface-900">Pro</option>
              <option value="enterprise"   className="bg-surface-900">Enterprise</option>
            </select>
          </div>

          {/* Billing Cycle */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500 pointer-events-none" />
            <select
              value={billingCycle}
              onChange={(e) => { setBillingCycle(e.target.value); setPage(1); }}
              className="pl-8 pr-6 py-2.5 rounded-xl bg-surface-900/80 border border-white/[0.08] text-white text-sm
                focus:border-primary-500/50 focus:outline-none appearance-none w-full transition-all cursor-pointer"
            >
              <option value="" className="bg-surface-900">All Cycles</option>
              <option value="monthly" className="bg-surface-900">Monthly</option>
              <option value="yearly"  className="bg-surface-900">Yearly</option>
            </select>
          </div>

          {/* Payment status */}
          <div className="relative col-span-2 sm:col-span-1">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500 pointer-events-none" />
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="pl-8 pr-6 py-2.5 rounded-xl bg-surface-900/80 border border-white/[0.08] text-white text-sm
                focus:border-primary-500/50 focus:outline-none appearance-none w-full transition-all cursor-pointer"
            >
              <option value=""        className="bg-surface-900">All Payments</option>
              <option value="paid"    className="bg-surface-900">Paid</option>
              <option value="unpaid"  className="bg-surface-900">Unpaid</option>
              <option value="pending" className="bg-surface-900">Pending</option>
            </select>
          </div>
        </div>

        {/* Second row: Overdue toggle + active filters + clear */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setOverdueOnly(!overdueOnly); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              overdueOnly
                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                : 'text-surface-500 border-white/[0.06] hover:text-white hover:border-white/[0.14]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue Only
          </button>

          {hasFilter && (
            <button
              onClick={resetFilters}
              className="text-xs text-surface-500 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-all"
            >
              ✕ Clear all filters
            </button>
          )}

          <span className="text-xs text-surface-500 ml-auto">
            {total} subscription{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-surface-900/30">
          <TrendingUp className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">No subscriptions found</p>
          <p className="text-surface-500 text-sm mt-1">
            {hasFilter ? 'Try adjusting your filters.' : 'No active subscriptions yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface-900/50 overflow-hidden">
            {/* Head */}
            <div className="hidden xl:grid xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_36px] px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              {['Property', 'Plan', 'Billing', 'Payment', 'Amount', 'Renews', ''].map((h) => (
                <span key={h} className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {rows.map((row) => (
                <Link
                  key={row.subscriptionId}
                  href={`/admin/tenants/${row.tenant.id}`}
                  className={`flex flex-col xl:grid xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_36px]
                    gap-3 xl:gap-0 px-5 py-4 hover:bg-white/[0.025] transition-colors group
                    ${row.isOverdue ? 'border-l-2 border-red-500/50' : ''}`}
                >
                  {/* Property */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{row.tenant.name}</p>
                      <p className="text-[11px] text-surface-500 truncate">{row.tenant.owner.email}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="flex items-center">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide ${PLAN_STYLE[row.plan] || PLAN_STYLE.free}`}>
                      {row.plan}
                    </span>
                  </div>

                  {/* Billing cycle */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-semibold ${
                      row.billingCycle === 'yearly'
                        ? 'bg-violet-500/15 text-violet-300 border-violet-500/25'
                        : 'bg-surface-700/60 text-surface-400 border-surface-600/40'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      {row.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                    </span>
                  </div>

                  {/* Payment status */}
                  <div className="flex items-center">
                    <PayBadge row={row} />
                  </div>

                  {/* Amount — plan-derived bill for the current cycle, with last-payment as secondary info */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-white tabular-nums">
                        {row.expectedAmount > 0 ? fmtINR(row.expectedAmount) : '—'}
                      </span>
                      <span className="text-[10px] text-surface-500 font-medium">
                        /{row.billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                      {row.isCustomPriced && (
                        <span
                          title="This tenant has a custom price override applied"
                          className="text-[10px] px-1.5 py-0.5 rounded-md border bg-violet-500/15 text-violet-300 border-violet-500/25 font-bold uppercase tracking-wide"
                        >
                          Custom
                        </span>
                      )}
                    </div>
                    {row.lastPayment && row.lastPayment.amount !== row.expectedAmount && (
                      <span className="text-[10px] text-surface-500 tabular-nums">
                        Last paid {fmtINR(row.lastPayment.amount)}
                      </span>
                    )}
                  </div>

                  {/* Renewal */}
                  <div className="flex items-center">
                    <RenewalBadge row={row} />
                  </div>

                  {/* Arrow */}
                  <div className="hidden xl:flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-surface-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-surface-900 border border-white/[0.08] text-surface-400 hover:text-white hover:border-white/[0.16] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <span className="text-sm text-surface-500 tabular-nums">
                Page <strong className="text-white">{page}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-surface-900 border border-white/[0.08] text-surface-400 hover:text-white hover:border-white/[0.16] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
