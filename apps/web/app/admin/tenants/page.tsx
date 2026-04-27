'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, MapPin, Users, CalendarDays, Search, ChevronRight,
} from 'lucide-react';
import { platformApi } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  propertyType: string;
  city?: string;
  state?: string;
  createdAt: string;
  owner: { fullName: string; email: string };
  _count: { rooms: number; bookings: number; memberships: number };
}

export default function AdminTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function fetchTenants() {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '15' };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    platformApi.getTenants(params)
      .then((res: any) => {
        setTenants(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTenants(); }, [page, statusFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  }

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-500/15 text-amber-300',
    active: 'bg-emerald-500/15 text-emerald-300',
    suspended: 'bg-red-500/15 text-red-300',
  };

  const planColors: Record<string, string> = {
    free: 'bg-surface-700 text-surface-300',
    starter: 'bg-blue-500/15 text-blue-300',
    professional: 'bg-purple-500/15 text-purple-300',
    enterprise: 'bg-amber-500/15 text-amber-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">All Properties</h1>
        <p className="text-surface-400 text-sm mt-1">Manage all registered properties on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, or city..."
            className="input-field pl-10 w-full bg-surface-800/50"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field bg-surface-800/50 w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending_approval">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3 font-medium text-surface-400">Property</th>
                    <th className="text-left px-5 py-3 font-medium text-surface-400 hidden md:table-cell">Location</th>
                    <th className="text-left px-5 py-3 font-medium text-surface-400">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-surface-400 hidden lg:table-cell">Plan</th>
                    <th className="text-center px-5 py-3 font-medium text-surface-400 hidden lg:table-cell">Rooms</th>
                    <th className="text-center px-5 py-3 font-medium text-surface-400 hidden lg:table-cell">Bookings</th>
                    <th className="text-center px-5 py-3 font-medium text-surface-400 hidden lg:table-cell">Staff</th>
                    <th className="text-left px-5 py-3 font-medium text-surface-400 hidden xl:table-cell">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} onClick={() => router.push(`/admin/tenants/${t.id}`)} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[180px]">{t.name}</p>
                            <p className="text-xs text-surface-500">{t.propertyType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-surface-400 text-xs">
                          <MapPin className="w-3 h-3" />
                          <span>{[t.city, t.state].filter(Boolean).join(', ') || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status] || 'bg-surface-700 text-surface-300'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[t.plan] || 'bg-surface-700 text-surface-300'}`}>
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell text-surface-400">{t._count.rooms}</td>
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell text-surface-400">{t._count.bookings}</td>
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell text-surface-400">{t._count.memberships}</td>
                      <td className="px-5 py-3.5 hidden xl:table-cell">
                        <p className="text-xs text-surface-300 truncate max-w-[140px]">{t.owner.fullName}</p>
                        <p className="text-xs text-surface-500 truncate max-w-[140px]">{t.owner.email}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <ChevronRight className="w-4 h-4 text-surface-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-surface-800 text-surface-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-surface-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-surface-800 text-surface-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
