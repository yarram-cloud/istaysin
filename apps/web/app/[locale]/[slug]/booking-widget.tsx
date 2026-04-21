'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { getThemeTokens } from './themes/theme-tokens';

interface BookingWidgetProps {
  propertySlug: string;
  locale: string;
  config: any;
}

export default function BookingWidget({ propertySlug, locale, config }: BookingWidgetProps) {
  const router = useRouter();

  // Enforce IST localization
  const todayIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const tmrwIST = new Date(todayIST);
  tmrwIST.setDate(tmrwIST.getDate() + 1);

  const [checkIn, setCheckIn] = useState<Date>(todayIST);
  const [checkOut, setCheckOut] = useState<Date>(tmrwIST);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const themeTokens = getThemeTokens(config.templateId || 'default', config.primaryColor);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      guests: guests.toString(),
      rooms: rooms.toString(),
    });
    // Static subpath routing injection
    router.push(`/${locale}/${propertySlug}/book?${query.toString()}`);
  };

  return (
    <div className={`sticky top-24 z-30 overflow-hidden ${themeTokens.glassPanel} rounded-3xl p-6 ${themeTokens.shadowStrong}`}>
      {/* Promo Banner Placeholder mapping */}
      <div className={`absolute top-0 left-0 right-0 py-1.5 text-center text-[10px] font-bold tracking-wider text-white uppercase bg-gradient-to-r from-amber-500 to-orange-400`}>
        {config.promoText || 'Best Price Guarantee'}
      </div>

      <div className="mt-4 mb-6">
        <h3 className="text-xl font-bold text-surface-900 leading-tight">Book Your Stay</h3>
        <p className="text-sm text-surface-500 mt-1">Select dates to view available prices.</p>
      </div>

      <form onSubmit={handleBooking} className="flex flex-col gap-4">
        {/* Date Selectors */}
        <div className="flex bg-surface-50 border border-surface-200 rounded-2xl p-1 relative">
          <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-surface-100/50 rounded-xl transition-colors">
            <span className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">Check In</span>
            <div className="flex items-center gap-2 text-surface-900 font-medium">
              <Calendar className={`w-4 h-4 ${themeTokens.primaryText}`} />
              <input type="date" value={formatDate(checkIn)}
                onChange={(e) => setCheckIn(new Date(e.target.value))}
                className="bg-transparent border-none p-0 outline-none w-full text-sm font-semibold cursor-pointer" />
            </div>
          </div>
          <div className="w-[1px] bg-surface-200 mx-1 absolute left-1/2 top-3 bottom-3" />
          <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-surface-100/50 rounded-xl transition-colors">
            <span className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">Check Out</span>
            <div className="flex items-center gap-2 text-surface-900 font-medium">
              <input type="date" value={formatDate(checkOut)}
                onChange={(e) => setCheckOut(new Date(e.target.value))}
                className="bg-transparent border-none p-0 outline-none w-full text-sm font-semibold cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Guests Selector */}
        <div className="flex bg-surface-50 border border-surface-200 rounded-2xl p-1">
          <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-surface-100/50 rounded-xl transition-colors">
            <span className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">Guests & Rooms</span>
            <div className="flex items-center justify-between text-surface-900 font-medium">
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${themeTokens.primaryText}`} />
                <span className="text-sm font-semibold">{guests} Guests, {rooms} Room</span>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className={`mt-2 w-full py-4 text-base font-bold text-white rounded-xl shadow-lg transition-all ${themeTokens.primaryBg} ${themeTokens.primaryBgHover}`}>
          Check Availability
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-surface-100">
        <div className="flex items-center gap-2 text-xs text-surface-500 justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>No hidden fees</span>
          <span className="w-1 h-1 rounded-full bg-surface-300 mx-1" />
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>Instant Confirmation</span>
        </div>
      </div>
    </div>
  );
}
