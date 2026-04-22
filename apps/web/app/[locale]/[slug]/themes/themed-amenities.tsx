'use client';
import { ThemeStyleMap } from './theme-tokens';
import { 
  MapPin, Star, User, Wifi, Coffee, Tv, Car, Wind, UserCheck, ShieldCheck,
  Waves, UtensilsCrossed, Bath, Dumbbell, TreePine, Flame, ParkingCircle,
  Baby, Dog, Shirt, Refrigerator, Phone, Lock, Sparkles, Mountain,
  Sun, Sunrise, BedDouble, GlassWater, Umbrella, Gamepad2, Music, BookOpen, Accessibility
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const amenityIcons: Record<string, any> = {
  Wifi, Coffee, Tv, Car, Wind, UserCheck, ShieldCheck, MapPin, Star, User,
  Waves, UtensilsCrossed, Bath, Dumbbell, TreePine, Flame, ParkingCircle,
  Baby, Dog, Shirt, Refrigerator, Phone, Lock, Sparkles, Mountain,
  Sun, Sunrise, BedDouble, GlassWater, Umbrella, Gamepad2, Music, BookOpen, Accessibility
};

export default function ThemedAmenities({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;
  const rawList = config.list || [];
  const list = rawList.map((item: any) => 
    typeof item === 'string' ? { label: item, icon: 'Star' } : item
  );
  if (list.length === 0) return null;

  // --- VIBRANT ARCHETYPE (Playful bubbles, staggered grid) ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="amenities" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-surface-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex flex-col items-center mb-20 relative z-10">
            <span className={`px-6 py-2 rounded-full ${themeTokens.primaryBg}/10 ${themeTokens.primaryText} font-bold tracking-widest uppercase text-xs mb-6`}>Features</span>
            <h2 className={`text-5xl lg:text-[4rem] font-black text-surface-900 leading-tight text-center ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h2>
          </div>
          
          {/* Staggered bubbling layout */}
          <div className="flex flex-wrap justify-center gap-6 relative z-10">
            {list.map((amenity: any, i: number) => {
              const Icon = amenityIcons[amenity.icon] || Star;
              // Add slight random staggering to y-axis based on index
              const translateY = i % 2 === 0 ? 'translate-y-4' : '-translate-y-4';
              return (
                <div key={i} className={`flex flex-col items-center justify-center p-8 bg-surface-50 border-2 border-transparent hover:border-[color:var(--brand-color,#000)] hover:bg-white rounded-[3rem] w-[180px] h-[180px] transition-all duration-500 shadow-sm hover:shadow-2xl hover:scale-105 ${translateY}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-[color:var(--brand-color,#000)] text-white mb-4 shadow-[0_10px_20px_rgba(0,0,0,0.15)]`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className={`text-center font-bold text-surface-800 text-sm leading-tight ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE (Museum-like grid, highly structured with thin lines) ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section id="amenities" className="py-40 bg-white relative">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-4 gap-16">
            <div className="lg:col-span-1">
              <h2 className={`text-2xl lg:text-3xl text-surface-900 font-medium tracking-tight sticky top-32 ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h2>
              <div className="h-px w-full bg-surface-200 mt-8 hidden lg:block" />
            </div>
            
            <div className="lg:col-span-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-surface-200">
                {list.map((amenity: any, i: number) => {
                  const Icon = amenityIcons[amenity.icon] || Star;
                  return (
                    <div key={i} className="flex flex-col p-10 border-r border-b border-surface-200 group hover:bg-surface-50 transition-colors duration-500">
                      <div className={`text-surface-300 group-hover:-translate-y-1 group-hover:text-surface-900 transition-all duration-500 mb-8`}>
                        <Icon className="w-10 h-10 stroke-1" />
                      </div>
                      <span className={`text-sm uppercase tracking-[0.2em] font-medium text-surface-600 group-hover:text-black transition-colors ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE (Dark mode, neon glows, glass panels) ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section id="amenities" className="py-32 bg-surface-950 text-white relative">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
           <div className="flex justify-between items-end mb-16 border-b border-surface-800 pb-10">
             <h2 className={`text-5xl lg:text-6xl text-white font-light tracking-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h2>
             <span className={`hidden md:block text-[10px] uppercase tracking-[0.3em] text-surface-500 ${themeTokens.fontBodyClass}`}>Exclusive access</span>
           </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {list.map((amenity: any, i: number) => {
              const Icon = amenityIcons[amenity.icon] || Star;
              return (
                <div key={i} className={`group relative p-8 border border-white/10 bg-white/5 backdrop-blur-xl ${themeTokens.radiusClass} overflow-hidden hover:border-white/30 transition-all duration-700`}>
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 border border-surface-700 rounded-full flex items-center justify-center mb-8 group-hover:bg-white group-hover:border-white transition-all duration-500`}>
                      <Icon className="w-6 h-6 text-surface-400 group-hover:text-black transition-colors" />
                    </div>
                    <span className={`text-lg tracking-widest uppercase text-surface-300 group-hover:text-white transition-colors block ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Elegant lists, serif accents, gold/brand lines) ---
  return (
    <section id="amenities" className="py-24 bg-[#FCFCFC] relative border-t border-surface-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <div className="w-12 h-px bg-[color:var(--brand-color,#000)] mx-auto mb-6"></div>
          <h3 className={`text-4xl lg:text-5xl text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h3>
          <p className={`text-surface-500 font-serif italic text-lg ${themeTokens.fontBodyClass}`}>Carefully curated for your utmost comfort</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {list.map((amenity: any, i: number) => {
            const Icon = amenityIcons[amenity.icon] || Star;
            return (
              <div key={i} className={`flex items-start gap-6 p-6 ${themeTokens.radiusClass} hover:bg-white hover:shadow-lg transition-all duration-500 border border-transparent hover:border-surface-200 group`}>
                <div className={`mt-1 bg-[color:var(--brand-color,#000)]/5 p-3 rounded-full flex items-center justify-center group-hover:bg-[color:var(--brand-color,#000)] group-hover:text-white transition-colors duration-500`}>
                  <Icon className={`w-6 h-6 ${themeTokens.primaryText} group-hover:text-white transition-colors`} />
                </div>
                <div>
                  <span className={`block font-semibold text-surface-900 text-lg mb-1 ${themeTokens.fontHeadingClass}`}>{amenity.label}</span>
                  <span className={`text-sm text-surface-500 font-serif italic ${themeTokens.fontBodyClass}`}>Complimentary</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
