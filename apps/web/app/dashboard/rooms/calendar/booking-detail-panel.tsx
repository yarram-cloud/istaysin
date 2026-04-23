'use client';

import { X, Phone, Mail, CalendarDays, Users, CreditCard, ExternalLink, Globe, Zap, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  confirmed:            { bg: 'bg-emerald-50 border-emerald-200',   text: 'text-emerald-700', label: 'Confirmed' },
  checked_in:           { bg: 'bg-blue-50 border-blue-200',         text: 'text-blue-700',    label: 'Checked In' },
  pending_confirmation: { bg: 'bg-amber-50 border-amber-200',       text: 'text-amber-700',   label: 'Pending' },
  no_show:              { bg: 'bg-surface-100 border-surface-300',   text: 'text-surface-600', label: 'No Show' },
  checked_out:          { bg: 'bg-surface-50 border-surface-200',    text: 'text-surface-500', label: 'Checked Out' },
  cancelled:            { bg: 'bg-red-50 border-red-200',            text: 'text-red-600',     label: 'Cancelled' },
};

const SOURCE_ICONS: Record<string, { icon: typeof Globe; label: string }> = {
  website: { icon: Globe, label: 'Direct Website' },
  walkin:  { icon: Building2, label: 'Walk-In' },
  phone:   { icon: Phone, label: 'Phone Booking' },
  ota:     { icon: Zap, label: 'OTA' },
};

interface BookingDetailPanelProps {
  booking: any;
  onClose: () => void;
}

export default function BookingDetailPanel({ booking, onClose }: BookingDetailPanelProps) {
  const router = useRouter();
  const t = useTranslations('Dashboard');

  if (!booking) return null;

  const status = STATUS_BADGES[booking.status] || STATUS_BADGES.confirmed;
  const source = SOURCE_ICONS[booking.source] || SOURCE_ICONS.website;
  const SourceIcon = source.icon;

  const checkIn = new Date(booking.checkInDate).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  });
  const checkOut = new Date(booking.checkOutDate).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  });
  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <AnimatePresence>
      {/* ── Inline side panel (no backdrop overlay, no modal) ── */}
      <motion.div
        key="booking-panel"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden lg:block w-[340px] shrink-0"
        data-testid="booking-detail-panel"
      >
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden sticky top-20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 bg-surface-50">
            <h3 className="text-sm font-bold text-surface-900">
              {t('bookingDetails') || 'Booking Details'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Status + Booking Number */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${status.bg} ${status.text}`}>
                {status.label}
              </span>
              <span className="text-xs font-mono text-surface-400">{booking.bookingNumber}</span>
            </div>

            {/* Guest Info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                  {booking.guestName?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-surface-900 truncate">{booking.guestName || 'Guest'}</p>
                  <div className="flex items-center gap-1 text-surface-400">
                    <SourceIcon className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{source.label}</span>
                  </div>
                </div>
              </div>

              {booking.guestPhone && (
                <a href={`tel:${booking.guestPhone}`} className="flex items-center gap-2 text-xs text-surface-600 hover:text-primary-600 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-surface-400" />
                  <span>{booking.guestPhone}</span>
                </a>
              )}
              {booking.guestEmail && (
                <a href={`mailto:${booking.guestEmail}`} className="flex items-center gap-2 text-xs text-surface-600 hover:text-primary-600 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-surface-400" />
                  <span className="truncate">{booking.guestEmail}</span>
                </a>
              )}
            </div>

            {/* Stay Details */}
            <div className="bg-surface-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-surface-600">{checkIn}</span>
                <span className="text-surface-400">→</span>
                <span className="text-surface-600">{checkOut}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-surface-500">
                  <span className="font-semibold text-surface-700">{nights}</span>
                  <span>{nights === 1 ? 'night' : 'nights'}</span>
                </div>
                {(booking.numAdults || booking.numChildren) && (
                  <div className="flex items-center gap-1.5 text-surface-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{booking.numAdults || 0} adults{booking.numChildren ? `, ${booking.numChildren} child` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            {booking.totalAmount != null && (
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Total Amount</span>
                </div>
                <span className="text-sm font-bold text-emerald-800">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Action */}
            <button
              onClick={() => router.push(`/dashboard/bookings?highlight=${booking.id}`)}
              className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" />
              {t('viewFullBooking') || 'View Full Booking'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Mobile: Bottom sheet style (inline, not modal) ── */}
      <motion.div
        key="booking-panel-mobile"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="lg:hidden mt-4"
        data-testid="booking-detail-panel-mobile"
      >
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <h3 className="text-sm font-bold text-surface-900">
              {t('bookingDetails') || 'Booking Details'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact mobile content */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                  {booking.guestName?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-900">{booking.guestName || 'Guest'}</p>
                  <p className="text-[10px] font-mono text-surface-400">{booking.bookingNumber}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-surface-600">
              <CalendarDays className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span>{checkIn} → {checkOut}</span>
              <span className="text-surface-400">({nights}N)</span>
            </div>

            <div className="flex items-center justify-between">
              {booking.totalAmount != null && (
                <span className="text-sm font-bold text-emerald-700">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
              )}
              <button
                onClick={() => router.push(`/dashboard/bookings?highlight=${booking.id}`)}
                className="flex items-center gap-1.5 bg-primary-700 hover:bg-primary-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Booking
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
