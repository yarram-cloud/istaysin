import { ThemeStyleMap } from './theme-tokens';
import { MapPin, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemedNearby({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config.enabled) return null;
  const POIs = config.places || config.pointsOfInterest || [];
  if (POIs.length === 0) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="py-24 bg-surface-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className={`text-5xl md:text-6xl font-black text-surface-900 mb-16 text-center ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {POIs.map((poi: any, i: number) => (
              <div key={i} className={`bg-white p-8 ${themeTokens.radiusClass} shadow-xl hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group`}>
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${themeTokens.primaryBg} opacity-10 group-hover:scale-150 transition-transform duration-500`} />
                <div className={`mb-6 w-14 h-14 rounded-2xl flex items-center justify-center ${themeTokens.primaryBg} text-white shadow-lg`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className={`font-black text-surface-900 text-2xl mb-2 ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                <p className={`text-surface-600 mb-6 ${themeTokens.fontBodyClass}`}>{poi.description}</p>
                {poi.distance && <span className={`inline-flex items-center gap-2 font-bold px-4 py-2 ${themeTokens.radiusClass} bg-surface-100 ${themeTokens.primaryText} text-sm`}><Navigation className="w-4 h-4" /> {poi.distance}</span>}
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
      <section className="py-32 bg-white border-y border-surface-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-end border-b border-surface-200 pb-8 mb-12">
             <h3 className={`text-3xl font-light text-surface-900 tracking-wide ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
          </div>
          <div className="space-y-6">
            {POIs.map((poi: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-6 border-b border-surface-50 group hover:pl-6 transition-all duration-300">
                <div className="flex items-center gap-6">
                  <span className={`text-surface-300 font-light text-2xl`}>0{i+1}</span>
                  <div>
                    <h4 className={`text-xl text-surface-900 mb-1 group-hover:text-black ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                    <p className={`text-sm text-surface-500 font-light ${themeTokens.fontBodyClass}`}>{poi.description}</p>
                  </div>
                </div>
                {poi.distance && <span className={`text-sm font-medium tracking-widest uppercase text-surface-400 group-hover:text-black transition-colors ${themeTokens.fontBodyClass}`}>{poi.distance}</span>}
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
      <section className="py-24 bg-surface-950">
        <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
             <h3 className={`text-4xl text-white mb-6 leading-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
             <p className={`text-surface-400 ${themeTokens.fontBodyClass}`}>{t('exploreDestinations')}</p>
          </div>
          <div className="md:col-span-3 grid sm:grid-cols-2 gap-px bg-surface-800 border border-surface-800">
            {POIs.map((poi: any, i: number) => (
              <div key={i} className={`bg-surface-950 p-10 hover:bg-black transition-colors flex flex-col justify-between`}>
                 <div>
                   <h4 className={`text-xl text-white mb-3 tracking-wide ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                   <p className={`text-surface-500 leading-relaxed mb-8 ${themeTokens.fontBodyClass}`}>{poi.description}</p>
                 </div>
                 {poi.distance && (
                   <div className="inline-flex items-center gap-3 border border-surface-800 self-start px-6 py-2">
                     <span className={`text-xs tracking-[0.2em] uppercase text-surface-300 ${themeTokens.fontBodyClass}`}>{poi.distance}</span>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC (Default) ---
  return (
    <section className="py-20 bg-surface-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className={`text-3xl md:text-4xl font-bold text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
          <div className="w-20 h-1 bg-[color:var(--brand-color,#000)] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POIs.map((poi: any, i: number) => (
            <div key={i} className={`bg-white p-8 ${themeTokens.radiusClass} flex items-start gap-4 shadow-md border-t-4 border-[color:var(--brand-color,#000)] hover:shadow-xl transition-shadow`}>
              <div className={`mt-1 w-10 h-10 flex items-center justify-center shrink-0`}>
                <MapPin className={`w-6 h-6 ${themeTokens.primaryText}`} />
              </div>
              <div>
                <h4 className={`font-bold text-surface-900 text-lg ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                <p className={`text-surface-600 mt-2 mb-4 leading-relaxed ${themeTokens.fontBodyClass}`}>{poi.description}</p>
                {poi.distance && <span className={`inline-block text-xs font-bold px-3 py-1 bg-surface-100 text-surface-700 ${themeTokens.fontBodyClass}`}>{poi.distance}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
