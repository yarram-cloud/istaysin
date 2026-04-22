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
  // Normalize: handle both legacy string[] and new {label, icon}[] formats
  const rawList = config.list || [];
  const list = rawList.map((item: any) => 
    typeof item === 'string' ? { label: item, icon: 'Star' } : item
  );
  if (list.length === 0) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="amenities" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-6xl font-black text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {list.map((amenity: any, i: number) => {
              const Icon = amenityIcons[amenity.icon] || Star;
              return (
                <div key={i} className={`flex flex-col items-center justify-center p-8 bg-surface-50 border-2 border-surface-100 hover:border-[color:var(--brand-color,#000)] ${themeTokens.radiusClass} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${themeTokens.primaryBg} text-white mb-6 shadow-md`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className={`text-center font-bold text-surface-800 ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section id="amenities" className="py-32 bg-surface-50 relative">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className={`text-3xl text-surface-900 mb-16 font-light border-b border-surface-300 pb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-8">
            {list.map((amenity: any, i: number) => {
              const Icon = amenityIcons[amenity.icon] || Star;
              return (
                <div key={i} className="flex items-center gap-6 group cursor-default">
                  <div className={`text-surface-400 group-hover:text-black transition-colors duration-500`}>
                    <Icon className="w-8 h-8 stroke-1" />
                  </div>
                  <span className={`text-sm tracking-wide text-surface-600 group-hover:text-black transition-colors ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section id="amenities" className="py-24 bg-surface-950 text-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className={`text-4xl md:text-5xl text-center mb-20 ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((amenity: any, i: number) => {
              const Icon = amenityIcons[amenity.icon] || Star;
              return (
                <div key={i} className={`flex items-center gap-6 p-6 border border-surface-800 hover:border-white/50 bg-black/50 backdrop-blur-sm ${themeTokens.radiusClass} transition-colors group`}>
                  <div className={`p-4 border border-surface-800 rounded-full group-hover:bg-white group-hover:text-black transition-colors`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-lg tracking-widest uppercase text-surface-300 group-hover:text-white transition-colors ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Fallback) ---
  return (
    <section id="amenities" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="w-16 h-[2px] bg-surface-300 mx-auto mb-6"></div>
          <h3 className={`text-3xl md:text-4xl font-bold text-surface-900 ${themeTokens.fontHeadingClass}`}>{config.title || t('facilities')}</h3>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {list.map((amenity: any, i: number) => {
            const Icon = amenityIcons[amenity.icon] || Star;
            return (
              <div key={i} className={`group flex items-center gap-4 bg-surface-50 border border-surface-200 px-8 py-5 ${themeTokens.radiusClass} hover:border-[color:var(--brand-color,#000)] shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                <div className={`w-10 h-10 ${themeTokens.radiusClass} flex items-center justify-center bg-white shadow-inner`}>
                  <Icon className={`w-5 h-5 ${themeTokens.primaryText}`} />
                </div>
                <span className={`font-semibold text-surface-800 ${themeTokens.fontBodyClass}`}>{amenity.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
