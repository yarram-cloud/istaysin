'use client';

import { useMemo } from 'react';

// ── Helpers ──────────────────────────────────────────────────────
function formatISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getISTToday(): string {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  ist.setHours(0, 0, 0, 0);
  return formatISO(ist);
}

// Color system — verified against actual BOOKING_STATUS and ROOM_STATUS enums
const BOOKING_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  confirmed:              { bg: 'bg-emerald-500',  border: 'border-emerald-600', text: 'text-white',       label: 'Confirmed' },
  checked_in:             { bg: 'bg-blue-500',     border: 'border-blue-600',    text: 'text-white',       label: 'Checked In' },
  pending_confirmation:   { bg: 'bg-amber-400',    border: 'border-amber-500',   text: 'text-amber-900',   label: 'Pending' },
  no_show:                { bg: 'bg-surface-300',  border: 'border-surface-400', text: 'text-surface-700', label: 'No Show' },
  checked_out:            { bg: 'bg-surface-200',  border: 'border-surface-300', text: 'text-surface-500', label: 'Checked Out' },
};

const ROOM_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  maintenance: { bg: 'bg-red-100',    text: 'text-red-700',    label: '🔧 Maintenance' },
  blocked:     { bg: 'bg-red-50',     text: 'text-red-600',    label: '🚫 Blocked' },
  dirty:       { bg: 'bg-orange-50',  text: 'text-orange-600', label: '🟠 Dirty' },
  cleaning:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',   label: '🧹 Cleaning' },
};

// Stable HSL hue from string for room type color dots
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

// Responsive column sizing based on day count
function getColumnConfig(dayCount: number) {
  // Phone (5 days): wider cells, narrower labels
  if (dayCount <= 5) return { labelWidth: '100px', minCell: '56px' };
  // Tablet (7 days): balanced
  if (dayCount <= 7) return { labelWidth: '120px', minCell: '52px' };
  // Desktop (14+ days): compact
  return { labelWidth: '140px', minCell: '48px' };
}

// ── Types ────────────────────────────────────────────────────────
interface TapeChartProps {
  rooms: any[];
  startDate: Date;
  dayCount: number;
  selectedBookingId?: string;
  onSelectBooking: (booking: any) => void;
}

// ── Component ────────────────────────────────────────────────────
export default function TapeChart({ rooms, startDate, dayCount, selectedBookingId, onSelectBooking }: TapeChartProps) {
  const today = getISTToday();
  const colConfig = getColumnConfig(dayCount);

  // Generate date columns
  const dates = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) => {
      const d = addDays(startDate, i);
      return {
        date: d,
        iso: formatISO(d),
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
        monthName: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }),
        isToday: formatISO(d) === today,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
  }, [startDate, dayCount, today]);

  // Group rooms by floor
  const floorGroups = useMemo(() => {
    const groups: { floor: { id: string; name: string; sortOrder: number }; rooms: any[] }[] = [];
    const floorMap = new Map<string, { floor: any; rooms: any[] }>();

    for (const room of rooms) {
      const floorId = room.floor?.id || 'unknown';
      if (!floorMap.has(floorId)) {
        floorMap.set(floorId, {
          floor: room.floor || { id: 'unknown', name: 'Ungrouped', sortOrder: 999 },
          rooms: [],
        });
      }
      floorMap.get(floorId)!.rooms.push(room);
    }

    groups.push(...Array.from(floorMap.values()));
    groups.sort((a, b) => a.floor.sortOrder - b.floor.sortOrder);
    return groups;
  }, [rooms]);

  // Find today column index for the marker
  const todayColIndex = dates.findIndex((d) => d.isToday);

  // Empty state
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-8 sm:p-12 text-center">
        <CalendarIcon className="w-12 h-12 text-surface-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-surface-900 mb-1">No rooms configured</h3>
        <p className="text-surface-500 text-sm">Add rooms in the Rooms page to see them here.</p>
      </div>
    );
  }

  // The min-width scales with day count — 5 days doesn't need to be as wide as 30
  const minGridWidth = dayCount <= 5
    ? '400px'
    : dayCount <= 7
    ? '560px'
    : dayCount <= 14
    ? '920px'
    : dayCount <= 21
    ? '1200px'
    : '1500px';

  return (
    <div
      className="tape-chart-container bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden relative"
      data-testid="tape-chart-grid"
    >
      {/* Scrollable grid wrapper */}
      <div
        className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-260px)] relative"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `${colConfig.labelWidth} repeat(${dayCount}, minmax(${colConfig.minCell}, 1fr))`,
            minWidth: minGridWidth,
          }}
        >
          {/* ── Corner Cell (sticky both axes) ── */}
          <div className="sticky left-0 top-0 z-30 bg-surface-50 border-b border-r border-surface-200 px-2 sm:px-3 py-2 flex items-center">
            <span className="text-[9px] sm:text-[10px] font-bold text-surface-400 uppercase tracking-wider">Room</span>
          </div>

          {/* ── Date Headers (sticky top) ── */}
          {dates.map((d) => (
            <div
              key={d.iso}
              className={`sticky top-0 z-20 border-b border-r border-surface-200 px-0.5 sm:px-1 py-1.5 sm:py-2 text-center transition-colors ${
                d.isToday
                  ? 'bg-primary-50 border-b-2 border-b-primary-500'
                  : d.isWeekend
                  ? 'bg-surface-50/80'
                  : 'bg-surface-50'
              }`}
            >
              <div className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide ${d.isToday ? 'text-primary-600' : 'text-surface-400'}`}>
                {d.dayName}
              </div>
              <div className={`text-xs sm:text-sm font-bold ${d.isToday ? 'text-primary-700' : 'text-surface-800'}`}>
                {d.dayNum}
              </div>
              <div className={`text-[8px] sm:text-[9px] ${d.isToday ? 'text-primary-500 font-semibold' : 'text-surface-400'}`}>
                {d.monthName}
              </div>
            </div>
          ))}

          {/* ── Floor Groups + Room Rows ── */}
          {floorGroups.map((group) => (
            <FloorSection
              key={group.floor.id}
              floor={group.floor}
              rooms={group.rooms}
              dates={dates}
              dayCount={dayCount}
              startDate={startDate}
              selectedBookingId={selectedBookingId}
              onSelectBooking={onSelectBooking}
            />
          ))}
        </div>

        {/* ── Today Vertical Line ── */}
        {todayColIndex >= 0 && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-red-500/60 pointer-events-none z-10"
            style={{
              left: `calc(${colConfig.labelWidth} + (${todayColIndex} * ((100% - ${colConfig.labelWidth}) / ${dayCount})) + ((100% - ${colConfig.labelWidth}) / ${dayCount} / 2))`,
            }}
            data-testid="today-marker"
          />
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5 border-t border-surface-100 bg-surface-50/50 flex-wrap print:hidden">
        <span className="text-[9px] sm:text-[10px] font-bold text-surface-400 uppercase tracking-wider mr-0.5 sm:mr-1">Status:</span>
        {Object.entries(BOOKING_COLORS).slice(0, 4).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1 sm:gap-1.5">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${val.bg}`} />
            <span className="text-[9px] sm:text-[10px] font-medium text-surface-500">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-red-400" />
          <span className="text-[9px] sm:text-[10px] font-medium text-surface-500">Maintenance</span>
        </div>
      </div>
    </div>
  );
}

// ── Floor Section ────────────────────────────────────────────────
function FloorSection({
  floor, rooms, dates, dayCount, startDate, selectedBookingId, onSelectBooking,
}: {
  floor: any; rooms: any[]; dates: any[]; dayCount: number; startDate: Date;
  selectedBookingId?: string; onSelectBooking: (b: any) => void;
}) {
  return (
    <>
      {/* Floor separator row */}
      <div
        className="sticky left-0 z-10 bg-surface-100/80 backdrop-blur-sm border-b border-surface-200 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center"
        style={{ gridColumn: `1 / -1` }}
      >
        <span className="text-[9px] sm:text-[10px] font-bold text-surface-500 uppercase tracking-wider">
          {floor.name}
        </span>
      </div>

      {/* Room rows */}
      {rooms.map((room) => (
        <RoomRow
          key={room.id}
          room={room}
          dates={dates}
          dayCount={dayCount}
          startDate={startDate}
          selectedBookingId={selectedBookingId}
          onSelectBooking={onSelectBooking}
        />
      ))}
    </>
  );
}

// ── Room Row ─────────────────────────────────────────────────────
function RoomRow({
  room, dates, dayCount, startDate, selectedBookingId, onSelectBooking,
}: {
  room: any; dates: any[]; dayCount: number; startDate: Date;
  selectedBookingId?: string; onSelectBooking: (b: any) => void;
}) {
  const endDate = addDays(startDate, dayCount);
  const roomTypeHue = stringToHue(room.roomType?.id || '');
  const isBlocked = ['maintenance', 'blocked'].includes(room.status);
  const isDirty = ['dirty', 'cleaning'].includes(room.status);
  const statusStyle = ROOM_STATUS_COLORS[room.status];

  // Build booking bars for this room
  const bars = useMemo(() => {
    if (!room.bookingRooms?.length) return [];
    return room.bookingRooms.map((br: any) => {
      const booking = br.booking;
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);

      // Clamp to visible range
      const visStart = checkIn < startDate ? startDate : checkIn;
      const visEnd = checkOut > endDate ? endDate : checkOut;

      const colStart = daysBetween(startDate, visStart); // 0-indexed day offset
      const colSpan = Math.max(1, daysBetween(visStart, visEnd));

      const colors = BOOKING_COLORS[booking.status] || BOOKING_COLORS.confirmed;
      const isNoShow = booking.status === 'no_show';
      const isSelected = selectedBookingId === booking.id;

      return {
        ...booking,
        colStart,
        colSpan,
        colors,
        isNoShow,
        isSelected,
        checkIn: checkIn.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
        checkOut: checkOut.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
      };
    });
  }, [room.bookingRooms, startDate, endDate, selectedBookingId]);

  return (
    <>
      {/* Room label cell (sticky left) */}
      <div className="sticky left-0 z-10 bg-white border-b border-r border-surface-200 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 min-h-[44px]">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: `hsl(${roomTypeHue}, 65%, 55%)` }}
          title={room.roomType?.name}
        />
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-surface-900 leading-tight truncate">{room.roomNumber}</div>
          <div className="text-[9px] sm:text-[10px] text-surface-400 font-medium truncate">{room.roomType?.name}</div>
        </div>
      </div>

      {/* Day cells — relative container for booking bars */}
      {dates.map((d, colIdx) => {
        // Check if a bar starts at this column
        const barHere = bars.find((b: any) => b.colStart === colIdx);

        return (
          <div
            key={d.iso}
            className={`relative border-b border-r border-surface-100 min-h-[44px] transition-colors ${
              d.isToday ? 'bg-primary-50/30' : d.isWeekend ? 'bg-surface-50/40' : ''
            } ${
              isBlocked ? (statusStyle?.bg || 'bg-red-50') : ''
            } ${
              isDirty && !isBlocked ? (statusStyle?.bg || '') : ''
            } ${
              !isBlocked && !isDirty ? 'hover:bg-primary-50/40 cursor-pointer' : ''
            }`}
            onClick={() => {
              if (!isBlocked && !barHere) {
                window.location.href = `/dashboard/bookings?newBooking=true&roomId=${room.id}&date=${d.iso}`;
              }
            }}
            title={isBlocked ? statusStyle?.label : isDirty ? statusStyle?.label : 'Click to create booking'}
          >
            {/* Booking bar rendered here if it starts at this column */}
            {barHere && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBooking(barHere);
                }}
                className={`absolute top-1/2 -translate-y-1/2 left-0.5 h-[26px] sm:h-[28px] rounded-md flex items-center px-1.5 sm:px-2 gap-1 text-[10px] sm:text-[11px] font-semibold cursor-pointer transition-all duration-150 border shadow-sm z-[5]
                  ${barHere.colors.bg} ${barHere.colors.border} ${barHere.colors.text}
                  ${barHere.isSelected ? 'ring-2 ring-primary-400 ring-offset-1 scale-[1.02]' : ''}
                  hover:shadow-md hover:scale-[1.02] active:scale-100
                `}
                style={{
                  width: `calc(${barHere.colSpan * 100}% - 4px)`,
                  backgroundImage: barHere.isNoShow
                    ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)'
                    : undefined,
                }}
                data-testid="booking-bar"
                title={`${barHere.guestName} • ${barHere.checkIn} → ${barHere.checkOut} • ${barHere.colors.label}`}
              >
                <span className="truncate max-w-full">{barHere.guestName || 'Guest'}</span>
              </button>
            )}

            {/* Room status indicator for blocked/maintenance */}
            {isBlocked && colIdx === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wide ${statusStyle?.text || 'text-red-600'}`}>
                  {statusStyle?.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Simple calendar icon for empty state
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
