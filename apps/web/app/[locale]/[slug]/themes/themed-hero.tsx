import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';

export default function ThemedHero({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const headline = config.headline || `Welcome to ${property.name}`;
  const subheadline = config.subheadline || property.description || property.tagline;
  const buttonText = config.buttonText || 'Book Now';

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white px-6 py-20">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 order-2 lg:order-1">
            <h1 className={`text-6xl md:text-8xl font-black text-surface-950 mb-6 tracking-tight leading-[1.1] ${themeTokens.fontHeadingClass}`}>
              {headline}
            </h1>
            <p className={`text-xl md:text-2xl text-surface-600 mb-10 max-w-lg ${themeTokens.fontBodyClass}`}>
              {subheadline}
            </p>
            <button className={`${themeTokens.primaryBg} ${themeTokens.primaryBgHover} text-white px-10 py-5 ${themeTokens.radiusClass} font-bold text-lg shadow-xl shadow-[color:var(--brand-color,#000)]/20 transition-all active:scale-95`}>
              {buttonText}
            </button>
          </div>
          <div className="relative order-1 lg:order-2 h-[400px] lg:h-[600px] w-full">
            {property.heroImage ? (
              <SafeNextImage src={property.heroImage} alt={property.name} containerClassName={`h-full w-full ${themeTokens.radiusClass} shadow-2xl`} className="scale-105 hover:scale-100 transition-transform duration-1000" />
            ) : (
              <div className={`w-full h-full ${themeTokens.primaryBg} ${themeTokens.radiusClass} opacity-10`}></div>
            )}
            <div className={`absolute -bottom-8 -left-8 w-32 h-32 ${themeTokens.primaryBg} rounded-full opacity-20 blur-3xl animate-pulse`}></div>
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section className="relative min-h-[70vh] flex flex-col justify-center bg-surface-50">
        <div className="max-w-7xl mx-auto w-full px-6 pt-32 pb-20">
          <h1 className={`text-5xl md:text-7xl font-semibold text-surface-900 mb-8 max-w-4xl tracking-tight ${themeTokens.fontHeadingClass}`}>
            {headline}
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <p className={`text-xl text-surface-500 max-w-2xl font-light leading-relaxed ${themeTokens.fontBodyClass}`}>
              {subheadline}
            </p>
            <button className={`bg-surface-900 hover:bg-black text-white px-8 py-3 ${themeTokens.radiusClass} uppercase tracking-wider text-sm font-medium transition-colors`}>
              {buttonText}
            </button>
          </div>
          {property.heroImage && (
             <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full h-[50vh] ${themeTokens.radiusClass}`} className="filter brightness-[0.95]" />
          )}
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section className="relative h-[90vh] min-h-[600px] flex items-end overflow-hidden pb-12 px-6">
        {property.heroImage && (
          <div className="absolute inset-0 z-0">
            <SafeNextImage src={property.heroImage} alt={property.name} containerClassName="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-at-top from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />
          </div>
        )}
        <div className={`relative z-20 w-full max-w-7xl mx-auto ${themeTokens.glassPanel} p-10 md:p-16 ${themeTokens.radiusClass}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className={`text-4xl md:text-6xl text-surface-950 mb-4 ${themeTokens.fontHeadingClass}`}>
                {headline}
              </h1>
              <p className={`text-lg text-surface-700 ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
            </div>
            <div className="flex md:justify-end">
              <button className={`${themeTokens.primaryBg} ${themeTokens.primaryBgHover} text-white px-10 py-4 font-medium tracking-wide ${themeTokens.radiusClass} transition-all`}>
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Fallback) ---
  return (
    <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {property.heroImage ? (
        <div className="absolute inset-0 z-0">
          <SafeNextImage src={property.heroImage} alt={property.name} containerClassName="w-full h-full" className="scale-105" />
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
        </div>
      ) : (
        <div className={`absolute inset-0 z-0 bg-surface-900`} />
      )}

      <div className="relative z-20 text-center max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <h1 className={`text-6xl md:text-8xl text-white mb-6 drop-shadow-xl ${themeTokens.fontHeadingClass}`}>
          {headline}
        </h1>
        <div className="w-24 h-1 bg-white/50 mx-auto mb-8 rounded-full"></div>
        <p className={`text-xl md:text-3xl text-white/90 mb-12 drop-shadow-lg ${themeTokens.fontBodyClass}`}>
          {subheadline}
        </p>
        <button className={`bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-10 py-4 ${themeTokens.radiusClass} font-semibold uppercase tracking-widest transition-colors`}>
          {buttonText}
        </button>
      </div>
    </section>
  );
}
