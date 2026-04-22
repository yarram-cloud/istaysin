import { ThemeStyleMap } from './theme-tokens';

export default function ThemedStats({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  if (!config.enabled) return null;
  const stats = config.stats || [];
  if (stats.length === 0) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`p-12 md:p-16 ${themeTokens.primaryBg} ${themeTokens.radiusClass} shadow-2xl relative overflow-hidden`}>
            {/* Playful background blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-xl translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center relative z-10">
              {stats.map((stat: any, i: number) => (
                <div key={i} className="flex flex-col items-center justify-center">
                  <span className={`text-5xl md:text-7xl font-black mb-3 text-white drop-shadow-md ${themeTokens.fontHeadingClass}`}>
                    {stat.value}
                  </span>
                  <span className={`text-white/90 font-bold tracking-wide text-sm md:text-base ${themeTokens.fontBodyClass}`}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section className="py-24 bg-surface-50 border-y border-surface-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-16 text-center">
            {stats.map((stat: any, i: number) => (
              <div key={i} className="flex flex-col items-center justify-center relative">
                {i !== 0 && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-surface-200"></div>}
                <span className={`text-5xl font-light text-surface-900 mb-4 ${themeTokens.fontHeadingClass}`}>
                  {stat.value}
                </span>
                <span className={`text-surface-500 uppercase tracking-[0.2em] text-xs font-medium ${themeTokens.fontBodyClass}`}>
                  {stat.label}
                </span>
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
      <section className="py-32 bg-surface-950 text-white relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[-0.05] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat: any, i: number) => (
              <div key={i} className="group border-l hover:border-l-4 transition-all duration-300 border-surface-800 hover:border-white pl-8 py-4">
                <span className={`block text-6xl font-serif italic mb-4 text-white opacity-90 group-hover:opacity-100 transition-opacity ${themeTokens.fontHeadingClass}`}>
                  {stat.value}
                </span>
                <span className={`block text-surface-400 text-sm tracking-widest uppercase ${themeTokens.fontBodyClass}`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Fallback) ---
  return (
    <section className="py-20 bg-surface-100 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat: any, i: number) => (
            <div key={i} className={`flex flex-col items-center justify-center p-8 bg-white shadow-lg ${themeTokens.radiusClass} border-b-4 border-[color:var(--brand-color,#000)]`}>
              <span className={`text-4xl font-bold mb-2 text-surface-900 ${themeTokens.fontHeadingClass}`}>
                {stat.value}
              </span>
              <span className={`text-surface-600 font-medium ${themeTokens.fontBodyClass}`}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
