import { ThemeStyleMap } from './theme-tokens';
import { MapPin, Star, User, Wifi, Coffee, Tv, Car, Wind, UserCheck, ShieldCheck } from 'lucide-react';

const amenityIcons: Record<string, any> = {
  Wifi, Coffee, Tv, Car, Wind, UserCheck, ShieldCheck, MapPin, Star, User
};

export default function ThemedAmenities({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  if (!config.amenities || config.amenities.length === 0) return null;

  return (
    <section id="amenities" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-surface-400 text-center mb-12">Featured Amenities</h3>

        <div className="flex flex-wrap justify-center gap-6">
          {config.amenities.map((amenity: any, i: number) => {
            const Icon = amenityIcons[amenity.icon] || Star;
            return (
              <div
                key={i}
                className={`group flex items-center gap-4 bg-surface-50 border border-surface-200 px-6 py-4 rounded-2xl w-full sm:w-auto hover:border-transparent ${themeTokens.shadowStrong} transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${themeTokens.primaryText}`} />
                </div>
                <span className="font-semibold text-surface-800">{amenity.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
