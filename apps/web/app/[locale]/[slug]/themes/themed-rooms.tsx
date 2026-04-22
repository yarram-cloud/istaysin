import { ThemeStyleMap } from './theme-tokens';
import { User, BedDouble, ChevronRight } from 'lucide-react';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';

export default function ThemedRooms({ property, locale, propertySlug, themeTokens, config }: { property: any, locale: string, propertySlug: string, themeTokens: ThemeStyleMap, config: any }) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;
  if (!property.roomTypes || property.roomTypes.length === 0) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="rooms" className="py-24 bg-surface-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className={`text-5xl md:text-6xl font-black text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('accommodations')}</h2>
            <p className={`text-lg text-surface-600 ${themeTokens.fontBodyClass}`}>{config.subtitle || t('findPerfectRoom')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {property.roomTypes.slice(0, config.limit || 6).map((rt: any) => (
              <div key={rt.id} className={`group bg-white ${themeTokens.radiusClass} overflow-hidden shadow-xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-[color:var(--brand-color,#000)] flex flex-col`}>
                <div className="aspect-[4/3] bg-surface-200 relative overflow-hidden p-3 rounded-t-[1.5rem]">
                  {rt.photos?.[0] ? (
                    <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className={`group-hover:scale-110 transition-transform duration-700 ease-out`} />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-surface-100 ${themeTokens.radiusClass}`}>{t('noImage')}</div>
                  )}
                  <div className={`absolute bottom-6 left-6 ${themeTokens.primaryBg} text-white px-5 py-2 font-black text-lg shadow-lg rotate-[-2deg] ${themeTokens.radiusClass}`}>
                    ₹{rt.baseRate} <span className="text-xs font-normal opacity-80">/ {t('night')}</span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <h3 className={`text-2xl font-black text-surface-900 mb-3 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                  <p className={`text-surface-500 mb-6 flex-1 line-clamp-2 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                  <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className={`w-full py-4 text-center ${themeTokens.radiusClass} font-bold ${themeTokens.primaryText} bg-surface-100 hover:bg-surface-200 transition-colors uppercase tracking-widest text-sm`}>
                    {t('reserve')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section id="rooms" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className={`text-4xl font-light text-surface-900 mb-4 ${themeTokens.fontHeadingClass}`}>{config.title || t('accommodations')}</h2>
            <div className="w-12 h-[1px] bg-surface-300 mb-6"></div>
            <p className={`text-surface-500 max-w-xl font-light ${themeTokens.fontBodyClass}`}>{config.subtitle || t('findPerfectRoom')}</p>
          </div>

          <div className="space-y-16">
            {property.roomTypes.slice(0, config.limit || 6).map((rt: any) => (
              <div key={rt.id} className="grid md:grid-cols-12 gap-8 md:gap-16 group items-center">
                <div className={`md:col-span-7 aspect-[16/9] bg-surface-50 ${themeTokens.radiusClass} overflow-hidden`}>
                  {rt.photos?.[0] ? (
                    <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="filter grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400">{t('noImage')}</div>
                  )}
                </div>
                <div className="md:col-span-5 flex flex-col justify-center">
                  <div className={`text-sm tracking-[0.2em] uppercase text-surface-400 mb-4 ${themeTokens.fontBodyClass}`}>{t('from')} ₹{rt.baseRate} / {t('night')}</div>
                  <h3 className={`text-3xl text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                  <p className={`text-surface-600 font-light leading-relaxed mb-8 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                  
                  <div className={`flex flex-wrap gap-6 text-sm text-surface-500 mb-10 ${themeTokens.fontBodyClass}`}>
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /> {rt.baseOccupancy} {t('guests')}</div>
                    <div className="flex items-center gap-2"><BedDouble className="w-4 h-4" /> {rt.bedType}</div>
                  </div>

                  <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className={`inline-flex items-center gap-4 text-surface-900 hover:text-black uppercase tracking-widest text-sm font-medium transition-colors ${themeTokens.fontHeadingClass} group-hover:translate-x-2 duration-300`}>
                    {t('viewRoom')} <span className="w-8 h-[1px] bg-black block"></span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section id="rooms" className="py-24 bg-surface-950 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl text-white ${themeTokens.fontHeadingClass}`}>{config.title || t('accommodations')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {property.roomTypes.slice(0, config.limit || 6).map((rt: any) => (
              <div key={rt.id} className={`group relative aspect-square md:aspect-[4/5] bg-surface-900 overflow-hidden ${themeTokens.radiusClass}`}>
                {rt.photos?.[0] ? (
                  <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="absolute inset-0 w-full h-full" className="opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-1000" />
                ) : (
                  <div className="absolute inset-0 bg-surface-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col justify-end translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className={`text-4xl text-white mb-2 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                  <div className={`text-surface-300 uppercase tracking-widest text-xs mb-6 ${themeTokens.fontBodyClass}`}>₹{rt.baseRate} {t('perNight')}</div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <p className={`line-clamp-2 text-surface-400 mb-8 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                    <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className={`inline-block border border-white/30 hover:bg-white hover:text-black text-white px-8 py-3 uppercase tracking-widest text-xs transition-colors backdrop-blur-sm ${themeTokens.radiusClass}`}>
                      {t('reserve')}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Fallback) ---
  return (
    <section id="rooms" className="py-24 bg-surface-50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className={`text-4xl md:text-5xl font-bold text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('accommodations')}</h2>
          <div className="w-24 h-1 bg-surface-300 mx-auto mb-6"></div>
          <p className={`text-lg text-surface-600 ${themeTokens.fontBodyClass}`}>{config.subtitle || t('findPerfectRoom')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {property.roomTypes.slice(0, config.limit || 6).map((rt: any) => (
            <div key={rt.id} className={`group bg-white ${themeTokens.radiusClass} overflow-hidden hover:shadow-2xl transition-all duration-300 border border-surface-100 flex flex-col`}>
              <div className="aspect-[4/3] bg-surface-200 relative overflow-hidden">
                {rt.photos?.[0] ? (
                  <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-400">{t('noImage')}</div>
                )}
                <div className={`absolute top-4 right-4 ${themeTokens.glassPanel} px-4 py-2 rounded-full font-bold text-surface-900 shadow-sm backdrop-blur-md`}>
                  ₹{rt.baseRate} <span className="text-xs font-normal text-surface-600">/ {t('night')}</span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className={`text-2xl font-bold text-surface-900 mb-3 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                <p className={`text-surface-500 mb-6 flex-1 line-clamp-3 leading-relaxed ${themeTokens.fontBodyClass}`}>{rt.description}</p>

                <div className={`flex flex-wrap gap-4 text-sm text-surface-600 mb-8 font-medium ${themeTokens.fontBodyClass}`}>
                  <div className="flex items-center gap-1.5"><User className={`w-4 h-4 ${themeTokens.primaryText}`} /> {t('upToGuests', { count: rt.baseOccupancy })}</div>
                  <div className="flex items-center gap-1.5"><BedDouble className={`w-4 h-4 ${themeTokens.primaryText}`} /> {rt.bedType}</div>
                </div>

                <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className={`w-full py-4 text-center ${themeTokens.radiusClass} font-bold transition-all ${themeTokens.primaryBg} hover:opacity-90 text-white shadow-md uppercase tracking-wider text-sm`}>
                  {t('selectRoom')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
