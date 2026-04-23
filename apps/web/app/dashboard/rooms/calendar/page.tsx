'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, AlertTriangle, Printer, RotateCcw, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { roomsApi } from '@/lib/api';
import TapeChart from './tape-chart';
import BookingDetailPanel from './booking-detail-panel';

function getISTToday(): Date {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  ist.setHours(0, 0, 0, 0);
  return ist;
}

function formatISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('en-IN', { ...opts, timeZone: 'Asia/Kolkata' });
  const endStr = end.toLocaleDateString('en-IN', { ...opts, year: 'numeric', timeZone: 'Asia/Kolkata' });
  return `${startStr} — ${endStr}`;
}

// Responsive defaults: phone=5, tablet=7, desktop=14
function getDefaultDayCount(): number {
  if (typeof window === 'undefined') return 14;
  const w = window.innerWidth;
  if (w < 640) return 5;    // Phone
  if (w < 1024) return 7;   // Tablet / iPad
  return 14;                 // Desktop
}

const VIEW_OPTIONS = [
  { value: 5, label: '5D' },
  { value: 7, label: '7D' },
  { value: 14, label: '14D' },
  { value: 21, label: '21D' },
  { value: 30, label: '30D' },
] as const;

export default function RoomCalendarPage() {
  const t = useTranslations('Dashboard');
  const router = useRouter();

  const [startDate, setStartDate] = useState(() => getISTToday());
  const [dayCount, setDayCount] = useState(() => getDefaultDayCount());
  const endDate = useMemo(() => addDays(startDate, dayCount), [startDate, dayCount]);

  const [gridData, setGridData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchGrid = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await roomsApi.getAvailabilityGrid(formatISO(startDate), formatISO(endDate));
      if (res.success) {
        setGridData(res.data);
      } else {
        setError(res.error || 'Failed to load');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchGrid(); }, [fetchGrid]);

  function goToday() {
    setStartDate(getISTToday());
    setSelectedBooking(null);
  }

  function goPrev() {
    setStartDate((d) => addDays(d, -dayCount));
    setSelectedBooking(null);
  }

  function goNext() {
    setStartDate((d) => addDays(d, dayCount));
    setSelectedBooking(null);
  }

  const isOnToday = formatISO(startDate) === formatISO(getISTToday());
  const unassignedCount = gridData?.unassigned?.length || 0;

  return (
    <div className="space-y-3 sm:space-y-4" data-testid="room-calendar-page">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-surface-900">
            {t('roomCalendar') || 'Room Calendar'}
          </h1>
          <p className="text-surface-500 text-xs sm:text-sm hidden sm:block">
            {t('roomCalendarSub') || 'Visual room × date grid for front desk operations'}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={goToday}
            className={`px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 ${
              isOnToday
                ? 'bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100'
                : 'bg-primary-700 text-white hover:bg-primary-600'
            }`}
            data-testid="today-button"
          >
            {t('today') || 'Today'}
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2 text-xs sm:text-sm shadow-sm p-2 sm:px-3 sm:py-2"
            title="Print calendar"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Controls Bar: Date Navigation + View Selector ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 print:flex-row">
        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-surface-200 shadow-sm px-2 sm:px-3 py-2 flex-1 print:shadow-none print:border-surface-300">
          <button
            onClick={goPrev}
            className="p-2 rounded-xl hover:bg-surface-50 text-surface-600 hover:text-surface-900 transition-colors active:scale-95"
            data-testid="date-nav-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-surface-700">
            <CalendarDays className="w-4 h-4 text-primary-500 hidden sm:block" />
            <span data-testid="date-range-label">{formatDateRange(startDate, addDays(endDate, -1))}</span>
          </div>
          <button
            onClick={goNext}
            className="p-2 rounded-xl hover:bg-surface-50 text-surface-600 hover:text-surface-900 transition-colors active:scale-95"
            data-testid="date-nav-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Duration Selector (segmented control) */}
        <div className="flex items-center bg-white rounded-2xl border border-surface-200 shadow-sm p-1 print:hidden" data-testid="view-selector">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDayCount(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dayCount === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Unassigned Bookings Alert (CLICKABLE) ── */}
      {unassignedCount > 0 && (
        <button
          onClick={() => router.push('/dashboard/bookings?filter=unassigned')}
          className="w-full flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer active:scale-[0.99] group"
          data-testid="unassigned-alert"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>⚠️ {unassignedCount} {t('unassignedBookings') || 'bookings need room assignment'}</span>
          </div>
          <ExternalLink className="w-4 h-4 text-amber-500 group-hover:text-amber-700 transition-colors shrink-0" />
        </button>
      )}

      {/* ── Content Area ── */}
      <div className={`flex flex-col lg:flex-row gap-0 transition-all duration-300 ${selectedBooking ? 'lg:gap-4' : ''}`}>
        {/* Grid */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedBooking ? 'lg:w-[calc(100%-360px)]' : 'w-full'}`}>
          {loading ? (
            <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 sm:p-6" data-testid="calendar-skeleton">
              <div className="space-y-2 sm:space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-9 sm:h-10 bg-surface-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-8 sm:p-12 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-surface-600 font-medium mb-3 text-sm">{error}</p>
              <button onClick={fetchGrid} className="btn-primary text-sm inline-flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : (
            <TapeChart
              rooms={gridData?.rooms || []}
              startDate={startDate}
              dayCount={dayCount}
              selectedBookingId={selectedBooking?.id}
              onSelectBooking={(b: any) => setSelectedBooking(
                selectedBooking?.id === b.id ? null : b
              )}
            />
          )}
        </div>

        {/* ── Inline Booking Detail Panel (NOT a modal) ── */}
        {selectedBooking && (
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </div>
    </div>
  );
}
