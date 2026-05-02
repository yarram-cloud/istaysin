'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, IndianRupee, Loader2, Search, Phone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { billingApi } from '@/lib/api';
import { usePropertyType } from '@/lib/property-context';

interface ChargeRow {
  id: string;
  chargeDate: string;
  category: string;
  description: string;
  totalPrice: number;
  paidAmount: number;
  remaining: number;
  status: 'paid' | 'partial' | 'due' | 'overdue';
}
interface MonthBucket {
  period: string;
  charges: ChargeRow[];
  totalDue: number;
  totalPaid: number;
  status: 'paid' | 'partial' | 'due' | 'overdue';
}
interface Resident {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  rooms: { number: string | null; type: string | null }[];
  months: MonthBucket[];
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  paid:     { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', label: 'Paid' },
  partial:  { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   label: 'Partial' },
  due:      { bg: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-200',     label: 'Due' },
  overdue:  { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     label: 'Overdue' },
};

function formatPeriodLabel(period: string) {
  // period format "YYYY-MM"
  const [y, m] = period.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  return dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

export default function RentRollPage() {
  const { isLongStay, propertyType } = usePropertyType();
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [graceDays, setGraceDays] = useState(5);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'partial' | 'paid'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLongStay) return;
    let alive = true;
    (async () => {
      try {
        const res = await billingApi.getRentRoll();
        if (!alive) return;
        if (res.success) {
          setResidents(res.data.residents || []);
          setGraceDays(res.data.graceDays || 5);
        } else {
          toast.error(res.error || 'Failed to load rent roll');
        }
      } catch (e: any) {
        toast.error(e.message || 'Failed to load rent roll');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isLongStay]);

  // Property-type gate. PG/Hostel only.
  if (!isLongStay) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
        <AlertCircle className="w-12 h-12 text-surface-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Rent Roll is only for PG &amp; Hostel properties</h2>
        <p className="text-sm text-surface-500 mb-6">
          Your property type is <span className="font-semibold capitalize">{propertyType.replace('_', ' ')}</span>.
          For nightly properties, use the Bookings or Billing pages instead.
        </p>
        <Link href="/dashboard/bookings" className="inline-block bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors">
          Go to Bookings
        </Link>
      </div>
    );
  }

  // Build the list of unique months across all residents (used as columns)
  const monthColumns: string[] = useMemo(() => {
    const set = new Set<string>();
    residents.forEach(r => r.months.forEach(m => set.add(m.period)));
    return Array.from(set).sort();
  }, [residents]);

  // Apply filters
  const filteredResidents = useMemo(() => {
    let result = residents;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.guestName.toLowerCase().includes(q) ||
        r.bookingNumber.toLowerCase().includes(q) ||
        (r.guestPhone || '').includes(q) ||
        r.rooms.some(rm => (rm.number || '').toLowerCase().includes(q)),
      );
    }
    if (filter !== 'all') {
      result = result.filter(r => r.months.some(m => m.status === filter));
    }
    return result;
  }, [residents, search, filter]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalOverdue = 0;
    let totalDue = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    residents.forEach(r => {
      r.months.forEach(m => {
        const owed = Math.max(0, m.totalDue - m.totalPaid);
        if (m.status === 'overdue') {
          totalOverdue += owed;
          overdueCount += 1;
        }
        if (m.status === 'due' || m.status === 'partial') totalDue += owed;
        totalPaid += m.totalPaid;
      });
    });
    return { totalOverdue, totalDue, totalPaid, overdueCount, residentCount: residents.length };
  }, [residents]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-surface-100 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-surface-100 rounded-xl" />)}
        </div>
        <div className="h-96 bg-surface-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">Rent Roll</h1>
          <p className="text-sm text-surface-500">
            Monthly bills for {stats.residentCount} active resident{stats.residentCount !== 1 ? 's' : ''}
            <span className="mx-1">·</span>
            <span className="font-medium text-surface-600">Overdue after {graceDays} days</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3 border bg-red-50 border-red-200">
          <p className="text-xs text-red-700 font-medium">Overdue</p>
          <p className="text-xl font-bold text-red-800">₹{stats.totalOverdue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-red-600 mt-0.5">{stats.overdueCount} month{stats.overdueCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl p-3 border bg-sky-50 border-sky-200">
          <p className="text-xs text-sky-700 font-medium">Due (within grace)</p>
          <p className="text-xl font-bold text-sky-800">₹{stats.totalDue.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl p-3 border bg-emerald-50 border-emerald-200">
          <p className="text-xs text-emerald-700 font-medium">Collected</p>
          <p className="text-xl font-bold text-emerald-800">₹{stats.totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl p-3 border bg-surface-50 border-surface-200">
          <p className="text-xs text-surface-500 font-medium">Active residents</p>
          <p className="text-xl font-bold text-surface-900">{stats.residentCount}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name, room, phone, or booking #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
          />
        </div>
        <div className="flex items-center border border-surface-200 rounded-xl overflow-hidden h-10 bg-white">
          {(['all', 'overdue', 'partial', 'paid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-full px-3 text-xs font-semibold capitalize transition-colors border-l first:border-l-0 border-surface-200 ${
                filter === f ? 'bg-primary-50 text-primary-700' : 'bg-white text-surface-500 hover:bg-surface-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredResidents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
          <IndianRupee className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 mb-2">
            {residents.length === 0 ? 'No active residents' : 'No matches'}
          </h3>
          <p className="text-sm text-surface-500">
            {residents.length === 0
              ? 'Once residents check in, their monthly bills will appear here.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider sticky left-0 bg-surface-50 z-10 min-w-[200px]">Resident</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">Room</th>
                  <th className="text-right px-3 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">Balance</th>
                  {monthColumns.map(p => (
                    <th key={p} className="text-center px-3 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">
                      {formatPeriodLabel(p)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredResidents.map(r => {
                  const isExpanded = expandedId === r.bookingId;
                  return (
                    <Fragment key={r.bookingId}>
                      <tr
                        className="hover:bg-surface-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : r.bookingId)}
                      >
                        <td className="px-4 py-2.5 sticky left-0 bg-white z-[1]">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-surface-900 truncate">{r.guestName}</p>
                              <p className="text-[11px] text-surface-500 font-mono truncate">{r.bookingNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-surface-600 whitespace-nowrap">
                          {r.rooms.map(rm => rm.number).filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-right font-semibold whitespace-nowrap">
                          {r.balanceDue > 0
                            ? <span className="text-red-700">₹{r.balanceDue.toLocaleString('en-IN')}</span>
                            : <span className="text-emerald-700">Settled</span>}
                        </td>
                        {monthColumns.map(p => {
                          const m = r.months.find(mm => mm.period === p);
                          if (!m) return <td key={p} className="px-3 py-2.5 text-center text-xs text-surface-300">—</td>;
                          const s = STATUS_STYLE[m.status];
                          return (
                            <td key={p} className="px-3 py-2.5 text-center">
                              <span className={`inline-flex flex-col gap-0.5 px-2 py-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}>
                                <span>{s.label}</span>
                                <span className="font-bold">₹{m.totalDue.toLocaleString('en-IN')}</span>
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      {isExpanded && (
                        <tr className="bg-surface-50/40">
                          <td colSpan={3 + monthColumns.length} className="px-4 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 flex-wrap text-xs text-surface-600">
                                {r.guestPhone && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" /> {r.guestPhone}
                                  </span>
                                )}
                                <span>Total billed: <span className="font-semibold text-surface-900">₹{r.totalAmount.toLocaleString('en-IN')}</span></span>
                                <span>Paid: <span className="font-semibold text-emerald-700">₹{r.advancePaid.toLocaleString('en-IN')}</span></span>
                                <Link
                                  href={`/dashboard/bookings?selected=${r.bookingId}`}
                                  className="ml-auto text-xs font-semibold text-primary-700 hover:text-primary-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open booking →
                                </Link>
                              </div>

                              <div className="overflow-x-auto rounded-lg border border-surface-200 bg-white">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-surface-50 border-b border-surface-200">
                                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Month</th>
                                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Description</th>
                                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Category</th>
                                      <th className="text-right px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Total</th>
                                      <th className="text-right px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Paid</th>
                                      <th className="text-right px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Owed</th>
                                      <th className="text-center px-3 py-2 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-surface-100">
                                    {r.months.flatMap(m => m.charges).map(c => {
                                      const s = STATUS_STYLE[c.status];
                                      return (
                                        <tr key={c.id}>
                                          <td className="px-3 py-2 text-xs text-surface-700 whitespace-nowrap">
                                            {new Date(c.chargeDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' })}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-surface-700">{c.description}</td>
                                          <td className="px-3 py-2 text-xs text-surface-500 capitalize">{c.category}</td>
                                          <td className="px-3 py-2 text-xs text-right font-medium text-surface-900 whitespace-nowrap">₹{c.totalPrice.toLocaleString('en-IN')}</td>
                                          <td className="px-3 py-2 text-xs text-right text-emerald-700 whitespace-nowrap">₹{c.paidAmount.toLocaleString('en-IN')}</td>
                                          <td className="px-3 py-2 text-xs text-right font-semibold text-red-700 whitespace-nowrap">
                                            {c.remaining > 0 ? `₹${c.remaining.toLocaleString('en-IN')}` : '—'}
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                                              {s.label}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
