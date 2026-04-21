import { ThemeStyleMap } from './theme-tokens';

export default function ThemedHero({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  // Ultra-premium handling: Optional deep dark overlay or clean minimal gradient
  const overlayClass = config.templateId === 'luxury' || config.templateId === 'chic'
    ? "bg-gradient-to-t from-surface-950 via-surface-950/60 to-surface-900/30"
    : "bg-surface-950/40 backdrop-blur-[2px]";

  return (
    <section className="relative h-[70vh] min-h-[550px] flex items-center justify-center overflow-hidden">
      {property.heroImage ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={property.heroImage} alt={property.name} className="w-full h-full object-cover select-none" />
          <div className={`absolute inset-0 ${overlayClass}`} />
        </div>
      ) : (
        <div className={`absolute inset-0 z-0 bg-gradient-to-br from-surface-900 to-black`} />
      )}

      <div className="relative z-10 text-center max-w-5xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-xl tracking-tight leading-tight">
          {config.heroHeadline || `Welcome to ${property.name}`}
        </h1>
        <p className="text-lg md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-lg font-medium">
          {config.heroSubheadline || property.description || property.tagline}
        </p>
      </div>
    </section>
  );
}
