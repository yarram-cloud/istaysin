import { ThemeStyleMap } from './theme-tokens';
import { User, BedDouble, ChevronRight } from 'lucide-react';

export default function ThemedRooms({ property, locale, propertySlug, themeTokens }: { property: any, locale: string, propertySlug: string, themeTokens: ThemeStyleMap }) {
  if (!property.roomTypes || property.roomTypes.length === 0) return null;

  return (
    <section id="rooms" className="py-24 bg-surface-50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">Accommodations</h2>
          <p className="text-lg text-surface-600">Find the perfect room for your stay.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {property.roomTypes.map((rt: any) => (
            <div key={rt.id} className="group bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-surface-100 flex flex-col">
              <div className="aspect-[4/3] bg-surface-200 relative overflow-hidden">
                {rt.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rt.photos[0].url} alt={rt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-400">No Image</div>
                )}
                <div className={`absolute top-4 right-4 ${themeTokens.glassPanel} px-4 py-2 rounded-full font-bold text-surface-900 shadow-sm border border-white/50 backdrop-blur-md`}>
                  ₹{rt.baseRate} <span className="text-xs font-normal text-surface-600">/ night</span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-surface-900 mb-3">{rt.name}</h3>
                <p className="text-surface-500 mb-6 flex-1 line-clamp-3 leading-relaxed">{rt.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-surface-600 mb-8 font-medium">
                  <div className="flex items-center gap-1.5"><User className={`w-4 h-4 ${themeTokens.primaryText}`} /> Up to {rt.baseOccupancy} guests</div>
                  <div className="flex items-center gap-1.5"><BedDouble className={`w-4 h-4 ${themeTokens.primaryText}`} /> {rt.bedType}</div>
                </div>

                <a
                  href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:gap-3 ${themeTokens.primaryBg} ${themeTokens.primaryBgHover} text-white shadow-lg`}
                >
                  Book this Room
                  <ChevronRight className="w-5 h-5 opacity-80" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
