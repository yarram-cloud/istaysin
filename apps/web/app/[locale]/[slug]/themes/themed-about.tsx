import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';

export default function ThemedAbout({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');

  if (!config.enabled) return null;
  const content = config.contentHtml || property.description;
  if (!content) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="about" className="py-24 bg-surface-50 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 ${themeTokens.primaryBg} pointer-events-none -translate-y-1/2 translate-x-1/3`} />
        
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-6 order-2 md:order-1">
            <h2 className={`text-5xl md:text-6xl font-black text-surface-900 leading-tight ${themeTokens.fontHeadingClass}`}>
              {config.title || t('aboutOurProperty')}
            </h2>
            <div className={`prose prose-lg text-surface-600 ${themeTokens.fontBodyClass}`}>
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
            <button className={`${themeTokens.primaryBg} text-white px-8 py-3 ${themeTokens.radiusClass} font-bold shadow-lg hover:-translate-y-1 transition-transform`}>
              {t('discoverMore')}
            </button>
          </div>
          <div className="relative order-1 md:order-2">
            <div className={`w-full aspect-square ${themeTokens.radiusClass} overflow-hidden shadow-2xl z-10 relative bg-white`}>
              {config.image ? (
                <SafeNextImage src={config.image} alt={t('aboutOurProperty')} containerClassName="w-full h-full" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center opacity-10 ${themeTokens.primaryBg}`}>{t('visualSpace')}</div>
              )}
            </div>
            <div className={`absolute -bottom-6 -left-6 w-full h-full border-4 border-[color:var(--brand-color,#000)] ${themeTokens.radiusClass} z-0 opacity-20`}></div>
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section id="about" className="py-32 bg-white relative">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <h2 className={`text-4xl md:text-5xl font-light text-surface-900 tracking-tight ${themeTokens.fontHeadingClass}`}>
            {config.title || t('aboutOurProperty')}
          </h2>
          <div className={`text-xl md:text-2xl text-surface-500 font-light leading-relaxed max-w-4xl mx-auto ${themeTokens.fontBodyClass}`}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          {config.image && (
            <div className={`w-full h-[60vh] mt-16 ${themeTokens.radiusClass} overflow-hidden`}>
              <SafeNextImage src={config.image} alt={t('aboutOurProperty')} containerClassName="w-full h-full" className="grayscale hover:grayscale-0 transition-all duration-700" />
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section id="about" className="py-24 bg-surface-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-4">
              <span className={`w-16 h-[1px] ${themeTokens.primaryBg}`} />
              <span className={`text-sm uppercase tracking-[0.2em] ${themeTokens.primaryText}`}>{t('discover')}</span>
            </div>
            <h2 className={`text-4xl md:text-6xl text-white ${themeTokens.fontHeadingClass}`}>
              {config.title || t('aboutOurProperty')}
            </h2>
            <div className={`text-surface-400 text-lg leading-relaxed ${themeTokens.fontBodyClass}`}>
               <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
          <div className="md:col-span-7">
            {config.image ? (
              <div className={`w-full aspect-[4/3] ${themeTokens.radiusClass} overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}>
                <SafeNextImage src={config.image} alt={t('aboutOurProperty')} containerClassName="w-full h-full" />
              </div>
            ) : (
               <div className={`w-full aspect-[4/3] ${themeTokens.radiusClass} border border-surface-800 flex items-center justify-center text-surface-700`}>{t('visualSpace')}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Fallback) ---
  return (
    <section id="about" className="py-24 bg-white relative">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 relative">
           {config.image ? (
            <div className={`w-full aspect-[3/4] ${themeTokens.radiusClass} overflow-hidden shadow-xl`}>
              <SafeNextImage src={config.image} alt={t('aboutOurProperty')} containerClassName="w-full h-full" />
            </div>
          ) : (
            <div className={`w-full aspect-[3/4] ${themeTokens.radiusClass} bg-surface-100 flex items-center justify-center shadow-inner`}>{t('image')}</div>
          )}
        </div>
        <div className="space-y-6 order-1 md:order-2 text-center md:text-left">
          <h2 className={`text-4xl md:text-5xl text-surface-900 ${themeTokens.fontHeadingClass}`}>
            {config.title || t('aboutOurProperty')}
          </h2>
          <div className="w-16 h-1 bg-surface-900 mx-auto md:mx-0"></div>
          <div className={`prose prose-lg text-surface-600 ${themeTokens.fontBodyClass}`}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      </div>
    </section>
  );
}
