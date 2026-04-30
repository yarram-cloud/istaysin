'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, MapPin, Users, CalendarDays, Search,
  ChevronRight, BedDouble, SlidersHorizontal,
} from 'lucide-react';
import { useApi } from '@/lib/use-api';

interface Tenant {
  id: string; name: string; slug: string; status: string; plan: string;
  propertyType: string; city?: string; state?: string; createdAt: string;
  owner: { fullName: string; email: string };
  _count: { rooms: number; bookings: number; memberships: number };
}

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  pending_approval: { pill: 'bg-amber-500/15 text-amber-300 border-amber-500/25',   dot: 'bg-amber-400' },
  active:           { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', dot: 'bg-emerald-400' },
  suspended:        { pill: 'bg-red-500/15 text-red-300 border-red-500/25',          dot: 'bg-red-400' },
};

const PLAN_STYLE: Record<string, string> = {
  free:         'bg-surface-700/80 text-surface-300 border-surface-600/40',
  basic:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  professional: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  enterprise:   'bg-amber-500/15 text-amber-300 border-amber-500/25',
};

export default function AdminTenantsPage() {
  const router = useRouter();
  const [search, setSearch]           = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);

  // Build the endpoint string deterministically — same inputs => same SWR key,
  // so navigating away and back hits the cache instead of refetching.
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (committedSearch) params.set('search', committedSearch);
    if (statusFilter) params.set('status', statusFilter);
    return `/platform/tenants?${params.toString()}`;
  }, [page, committedSearch, statusFilter]);

  // `keepPreviousData` keeps the old page on screen while paginating —
  // no flash of empty state between filter / page switches.
  const { data, isLoading } = useApi<{
    data: Tenant[];
    pagination?: { totalPages: number };
  }>(endpoint, { keepPreviousData: true });

  const tenants = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const loading = isLoading;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setCommittedSearch(search);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          All Properties
        </h1>
        <p className="text-surface-400 text-sm mt-1.5">
          Manage all registered properties on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, or city…"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-900/80 border border-white/[0.08] text-white text-sm
              focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:outline-none
              placeholder-surface-600 transition-all"
          />
        </form>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2.5 rounded-xl bg-surface-900/80 border border-white/[0.08] text-white text-sm
              focus:border-primary-500/50 focus:outline-none appearance-none w-full sm:w-44
              transition-all cursor-pointer"
          >
            <option value="" className="bg-surface-900">All Status</option>
            <option value="active" className="bg-surface-900">Active</option>
            <option value="pending_approval" className="bg-surface-900">Pending</option>
            <option value="suspended" className="bg-surface-900">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-surface-900/30">
          <Building2 className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-white font-semibold">No properties found</p>
          <p className="text-surface-500 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/[0.08] bg-surface-900/50 overflow-hidden">
            {/* Table Head */}
            <div className="hidden lg:grid lg:grid-cols-[minmax(200px,2fr)_minmax(160px,1.5fr)_120px_100px_60px_72px_60px_minmax(140px,1fr)_36px] gap-0 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              {['Property', 'Location', 'Status', 'Plan', 'Rooms', 'Bookings', 'Staff', 'Owner', ''].map((h) => (
                <span key={h} className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {tenants.map((t) => {
                const s = STATUS_STYLE[t.status] || { pill: 'bg-surface-700 text-surface-300 border-surface-600/40', dot: 'bg-surface-500' };
                const p = PLAN_STYLE[t.plan]   || 'bg-surface-700/80 text-surface-300 border-surface-600/40';

                return (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/admin/tenants/${t.id}`)}
                    className="grid grid-cols-1 lg:grid-cols-[minmax(200px,2fr)_minmax(160px,1.5fr)_120px_100px_60px_72px_60px_minmax(140px,1fr)_36px]
                      gap-3 lg:gap-0 px-5 py-4 hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  >
                    {/* Property */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{t.name}</p>
                        <p className="text-xs text-surface-500 capitalize">{t.propertyType}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-surface-400 text-xs">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-surface-600" />
                      <span className="truncate">{[t.city, t.state].filter(Boolean).join(', ') || '—'}</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-semibold ${s.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Plan */}
                    <div className="flex items-center">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide ${p}`}>
                        {t.plan}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-1 text-surface-400 text-xs lg:justify-center">
                      <BedDouble className="w-3 h-3 text-surface-600 lg:hidden" />
                      <span className="font-medium text-white/70">{t._count.rooms}</span>
                    </div>
                    <div className="flex items-center gap-1 text-surface-400 text-xs lg:justify-center">
                      <CalendarDays className="w-3 h-3 text-surface-600 lg:hidden" />
                      <span className="font-medium text-white/70">{t._count.bookings}</span>
                    </div>
                    <div className="flex items-center gap-1 text-surface-400 text-xs lg:justify-center">
                      <Users className="w-3 h-3 text-surface-600 lg:hidden" />
                      <span className="font-medium text-white/70">{t._count.memberships}</span>
                    </div>

                    {/* Owner */}
                    <div className="min-w-0">
                      <p className="text-xs text-surface-300 font-medium truncate">{t.owner.fullName}</p>
                      <p className="text-[11px] text-surface-500 truncate">{t.owner.email}</p>
                    </div>

                    {/* Chevron */}
                    <div className="hidden lg:flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-surface-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
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
