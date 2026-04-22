import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';

export default function ThemedGallery({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;
  const images = config.images || config.gallery || [];
  if (images.length === 0) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="gallery" className="py-24 bg-surface-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[300px] bg-white -skew-y-3 -translate-y-1/2 z-0 shadow-sm" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className={`text-5xl md:text-6xl font-black text-surface-900 mb-4 ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
              <p className={`text-xl text-surface-500 font-bold ${themeTokens.fontBodyClass}`}>{t('exploreOurProperty')}</p>
            </div>
            <button className={`${themeTokens.primaryBg} text-white px-8 py-3 ${themeTokens.radiusClass} font-bold shadow-lg hover:-translate-y-1 transition-transform`}>
              {t('viewAllPhotos')}
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
            {images.map((img: string, i: number) => (
              <div key={i} className={`min-w-[85vw] sm:min-w-[400px] md:min-w-[500px] h-[400px] md:h-[500px] snap-center shrink-0 ${themeTokens.radiusClass} overflow-hidden shadow-2xl relative group`}>
                <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className="transition-transform duration-700 group-hover:scale-105" />
                <div className={`absolute inset-0 border-8 border-transparent group-hover:border-[color:var(--brand-color,#000)] transition-colors ${themeTokens.radiusClass}`} />
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
      <section id="gallery" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className={`text-4xl font-light tracking-wide text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
            <div className="w-px h-16 bg-surface-300 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {images.map((img: string, i: number) => (
               <div key={i} className={`aspect-[4/5] object-cover relative overflow-hidden group ${themeTokens.radiusClass}`}>
                 <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className="filter grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-105 group-hover:scale-100" />
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
      <section id="gallery" className="py-24 bg-surface-950 relative">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-16">
            <h2 className={`text-4xl md:text-6xl text-white ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[250px]">
            {images.map((img: string, i: number) => {
              const isLarge = i === 0 || i === Math.min(3, images.length - 1);
              return (
                <div key={i} className={`group overflow-hidden relative ${themeTokens.radiusClass} ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className="group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
    <section id="gallery" className="py-24 bg-surface-100 relative border-y border-surface-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className={`text-4xl md:text-5xl font-bold text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
          <div className="w-24 h-1 mx-auto bg-[color:var(--brand-color,#000)]"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((img: string, i: number) => (
            <div key={i} className={`aspect-[4/3] relative overflow-hidden shadow-md border-[4px] border-white group ${themeTokens.radiusClass}`}>
              <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className="group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md border border-white flex items-center justify-center text-white">+</div >
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
