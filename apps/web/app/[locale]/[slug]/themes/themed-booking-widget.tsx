"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { ThemeStyleMap } from './theme-tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { publicApi } from '@/lib/api';

export default function BookingWidgetWrapper({ propertySlug, locale, config, themeTokens }: { propertySlug: string, locale: string, config: any, themeTokens: ThemeStyleMap }) {
  const router = useRouter();

  // Enforce IST localization
  const todayIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const tmrwIST = new Date(todayIST);
  tmrwIST.setDate(tmrwIST.getDate() + 1);

  const [checkIn, setCheckIn] = useState<Date>(todayIST);
  const [checkOut, setCheckOut] = useState<Date>(tmrwIST);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('PropertySite');

  const [hints, setHints] = useState<{ roomsLeftToday: number; recentBookings: number; dynamicPricingActive: boolean } | null>(null);
  const [showUrgency, setShowUrgency] = useState(false);

  useEffect(() => {
    publicApi.getAvailabilityHints(propertySlug).then(res => {
      if (res.success) {
        setHints(res.data);
        setTimeout(() => setShowUrgency(true), 2000);
      }
    }).catch(console.error);
  }, [propertySlug]);

  const renderUrgencyPills = (isVertical = false) => {
    if (!showUrgency || !hints) return null;
    
    return (
      <div data-testid="urgency-triggers" className={`flex ${isVertical ? 'flex-col items-start' : 'items-center'} gap-2 ${isVertical ? 'mt-4' : 'mt-2'} px-1`}>
        {hints.roomsLeftToday <= 3 && hints.roomsLeftToday > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-tight">
            {t('urgencyRoomsLeft', { count: hints.roomsLeftToday })}
          </motion.div>
        )}
        {hints.recentBookings > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-tight">
            {t('urgencyRecentBookings', { count: hints.recentBookings })}
          </motion.div>
        )}
        {hints.dynamicPricingActive && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 uppercase tracking-tight">
            {t('urgencyPriceWarning')}
          </motion.div>
        )}
      </div>
    );
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      guests: guests.toString(),
      rooms: rooms.toString(),
    });
    router.push(`/${locale}/${propertySlug}/book?${query.toString()}`);
  };

  // Modern Horizontal Bar (Used across modern, playful, eco themes)
  const renderHorizontalBar = () => (
    <div className="fixed bottom-0 md:bottom-8 left-0 right-0 z-50 flex justify-center px-4 md:px-0 pointer-events-none">
       <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }} 
         className={`pointer-events-auto w-full md:w-auto p-3 md:p-2 rounded-t-3xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-3 backdrop-blur-xl bg-white/90 border border-white/50`}>
          <form onSubmit={handleBooking} className="flex flex-col md:flex-row items-center w-full gap-2 md:gap-4 px-2">
            
            <div className="flex w-full md:w-auto items-center justify-between gap-4 py-2 md:py-0 border-b md:border-b-0 md:border-r border-gray-200 md:pr-6">
               <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Check-in</span>
                  <input type="date" value={formatDate(checkIn)} onChange={(e) => setCheckIn(new Date(e.target.value))} className="bg-transparent text-sm font-semibold text-gray-900 border-none p-0 outline-none w-28 cursor-pointer" />
               </div>
               <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Check-out</span>
                  <input type="date" value={formatDate(checkOut)} onChange={(e) => setCheckOut(new Date(e.target.value))} className="bg-transparent text-sm font-semibold text-gray-900 border-none p-0 outline-none w-28 cursor-pointer" />
               </div>
            </div>

            <div className="flex w-full md:w-auto items-center justify-between gap-4 py-2 md:py-0 md:pr-4">
               <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Guests</span>
                  <div className="text-sm font-semibold text-gray-900 w-32">{guests} Guests, {rooms} Room</div>
               </div>
            </div>

            <button type="submit" style={{ backgroundColor: 'var(--brand-color)' }} className="w-full md:w-auto px-8 py-3.5 rounded-2xl md:rounded-full text-white font-bold whitespace-nowrap shadow-lg hover:scale-105 transition-transform">
              Check Availability
            </button>
          </form>
          <div className="hidden md:block">
            {renderUrgencyPills(false)}
          </div>
          <div className="md:hidden w-full px-2">
            {renderUrgencyPills(true)}
          </div>
       </motion.div>
    </div>
  );

  // Discreet Floating Button + Sidebar Modal (Used in elegant, dark, classic luxury themes)
  const renderFloatingSidebar = () => (
    <>
      <div className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-50">
         <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }} onClick={() => setIsExpanded(true)}
           style={{ backgroundColor: 'var(--brand-color)' }} className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl text-white`}>
            <span className="text-xs uppercase font-bold tracking-widest leading-none text-center">Book<br/>Now</span>
         </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-end">
             <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />
             <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
               className="relative w-full max-w-md bg-white h-full shadow-[0_0_80px_rgba(0,0,0,0.2)] flex flex-col pt-12 p-8">
               
               <button onClick={() => setIsExpanded(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                  <ArrowRight className="w-5 h-5" />
               </button>

               <div className="mb-10 mt-8">
                  <h3 className={`text-4xl font-light text-gray-900 ${themeTokens.fontHeadingClass}`}>Reserve your stay</h3>
                  <p className={`text-gray-500 mt-4 leading-relaxed ${themeTokens.fontBodyClass}`}>Experience the pinnacle of hospitality. Select your dates below.</p>
               </div>

               <form onSubmit={handleBooking} className="flex flex-col gap-6 flex-1">
                  <div className="flex flex-col border-b border-gray-200 pb-4">
                     <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Check In</span>
                     <input type="date" value={formatDate(checkIn)} onChange={(e) => setCheckIn(new Date(e.target.value))} className="text-2xl font-light text-gray-900 bg-transparent border-none p-0 outline-none" />
                  </div>
                  
                  <div className="flex flex-col border-b border-gray-200 pb-4">
                     <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Check Out</span>
                     <input type="date" value={formatDate(checkOut)} onChange={(e) => setCheckOut(new Date(e.target.value))} className="text-2xl font-light text-gray-900 bg-transparent border-none p-0 outline-none" />
                  </div>

                  <div className="flex flex-col border-b border-gray-200 pb-4">
                     <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Guests & Rooms</span>
                     <div className="text-2xl font-light text-gray-900 bg-transparent border-none p-0 outline-none flex items-center justify-between">
                       <span>{guests} Guests, {rooms} Room</span>
                       <ChevronDown className="w-5 h-5 text-gray-300" />
                     </div>
                  </div>

                  <div className="mt-auto">
                    {renderUrgencyPills(true)}
                    <button type="submit" style={{ backgroundColor: 'var(--brand-color)' }} className={`mt-4 w-full py-6 text-sm uppercase tracking-[0.2em] font-bold text-white transition-all shadow-xl hover:-translate-y-1`}>
                      Check Availability
                    </button>
                  </div>
               </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // Classic Embedded Right Sidebar (Used for default, corporate) - floating using fixed positioning so it works with full-width layouts
  const renderClassicSidebar = () => (
    <div className="hidden lg:block fixed top-32 right-8 z-40 w-full max-w-[380px]">
       <div className={`overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] border border-gray-100`}>
        <div className={`absolute top-0 left-0 right-0 py-1.5 text-center text-[10px] font-bold tracking-wider text-white uppercase bg-gradient-to-r from-amber-500 to-orange-400`}>
          {config.promoText || 'Best Price Guarantee'}
        </div>

        <div className="mt-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">Book Your Stay</h3>
          <p className="text-sm text-gray-500 mt-1">Select dates to view available prices.</p>
        </div>

        <form onSubmit={handleBooking} className="flex flex-col gap-4">
          <div className="flex bg-gray-50 border border-gray-200 rounded-2xl p-1 relative">
            <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-white rounded-xl transition-colors">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Check In</span>
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <Calendar className={`w-4 h-4 ${themeTokens.primaryText}`} />
                <input type="date" value={formatDate(checkIn)} onChange={(e) => setCheckIn(new Date(e.target.value))} className="bg-transparent border-none p-0 outline-none w-full text-sm font-semibold cursor-pointer" />
              </div>
            </div>
            <div className="w-[1px] bg-gray-200 mx-1 absolute left-1/2 top-3 bottom-3" />
            <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-white rounded-xl transition-colors">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Check Out</span>
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <input type="date" value={formatDate(checkOut)} onChange={(e) => setCheckOut(new Date(e.target.value))} className="bg-transparent border-none p-0 outline-none w-full text-sm font-semibold cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="flex bg-gray-50 border border-gray-200 rounded-2xl p-1">
            <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-white rounded-xl transition-colors">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Guests & Rooms</span>
              <div className="flex items-center justify-between text-gray-900 font-medium">
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${themeTokens.primaryText}`} />
                  <span className="text-sm font-semibold">{guests} Guests, {rooms} Room</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <button type="submit" style={{ backgroundColor: 'var(--brand-color)' }} className={`mt-2 w-full py-4 text-base font-bold text-white rounded-xl shadow-lg transition-all`}>
            Check Availability
          </button>
        </form>
        {renderUrgencyPills(true)}
      </div>
    </div>
  );

  switch (themeTokens.templateId) {
    case 'modern-minimal':
    case 'playful-vibrant':
    case 'nature-eco':
    case 'resort-tropical':
      return renderHorizontalBar();
      
    case 'luxury-gold':
    case 'boutique-chic':
    case 'dark-elegance':
    case 'classic-heritage':
    case 'retro-vintage':
    case 'abstract-art':
      return renderFloatingSidebar();

    case 'corporate-trust':
    case 'compact-urban':
    default:
      // Fixed right sidebar on desktop, horizontal bar on mobile
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      return (
        <>
          <div className="lg:hidden">{renderHorizontalBar()}</div>
          <div className="hidden lg:block">{renderClassicSidebar()}</div>
        </>
      );
  }
}
