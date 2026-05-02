'use client';
import { ThemeStyleMap } from './theme-tokens';

export default function ThemedStats({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  if (!config.enabled) return null;
  const stats = config.stats || [];
  if (stats.length === 0) return null;

  // --- VIBRANT ARCHETYPE (Massive sticker-like fluid shapes, playful gradient boxes) ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="py-24 bg-surface-50 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className={`p-12 md:p-20 bg-gradient-to-br from-brand/10 via-brand/5 to-surface-50 rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden`}>
            {/* Playful background blobs inside the module */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand opacity-5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 relative z-10">
              {stats.map((stat: any, i: number) => {
                // Stagger rotation
                const rotate = i % 2 === 0 ? '-rotate-3' : 'rotate-3';
                return (
                  <div key={i} className={`flex flex-col items-center justify-center bg-white/80 backdrop-blur-md rounded-[2.5rem] p-10 shadow-lg ${rotate} hover:rotate-0 hover:scale-105 transition-all duration-300 border border-surface-200`}>
                    <span className={`text-6xl lg:text-8xl font-black mb-4 text-surface-900 ${themeTokens.fontHeadingClass} tracking-tighter`}>
                      {stat.value}
                    </span>
                    <span className={`text-surface-500 font-bold tracking-widest text-sm uppercase ${themeTokens.fontBodyClass}`}>
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE (Ultra-clean typography, museum grid, subtle scale) ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section className="py-32 bg-white border-y border-surface-200">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8">
            {stats.map((stat: any, i: number) => (
              <div key={i} className="flex flex-col items-center justify-center text-center group cursor-default">
                <span className={`text-7xl lg:text-8xl font-light text-surface-900 mb-6 tracking-tighter group-hover:scale-110 transition-transform duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] ${themeTokens.fontHeadingClass}`}>
                  {stat.value}
                </span>
                <div className="h-4 w-px bg-surface-300 mb-6"></div>
                <span className={`text-surface-400 uppercase tracking-[0.3em] text-[10px] font-bold transition-colors duration-500 group-hover:text-surface-900 ${themeTokens.fontBodyClass}`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE (Huge hollow numerals, intense dark mode, tight kerning) ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section className="py-40 bg-surface-950 text-white relative border-b border-surface-800">
        <div className="absolute inset-0 bg-[#050505] opacity-50" />
        
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="flex flex-col gap-16 md:gap-8 lg:flex-row lg:justify-between">
            {stats.map((stat: any, i: number) => (
              <div key={i} className="group relative pr-16 lg:pr-32 border-b lg:border-b-0 lg:border-r border-surface-800 last:border-0 pb-12 lg:pb-0">
                <span className={`block text-8xl lg:text-[10rem] font-black tracking-tighter leading-none mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 group-hover:to-white transition-all duration-700 ${themeTokens.fontHeadingClass}`}>
                  {stat.value}
                </span>
                <span className={`flex items-center gap-4 text-surface-500 text-xs tracking-[0.4em] uppercase ${themeTokens.fontBodyClass}`}>
                  <span className="w-12 h-px bg-surface-700 group-hover:w-24 group-hover:bg-white transition-all duration-700"></span>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Elegant borders, symmetric centered layout, serif italic labels) ---
  return (
    <section className="py-32 bg-[#FCFCFC] relative border-b border-surface-200">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat: any, i: number) => (
            <div key={i} className={`flex flex-col items-center justify-center p-12 bg-white shadow-md hover:shadow-2xl transition-shadow duration-700 ${themeTokens.radiusClass} border border-surface-200 relative group`}>
              {/* Elegant corner accents invisible until hover */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[color:var(--brand-color,#000)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[color:var(--brand-color,#000)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <span className={`text-6xl lg:text-7xl font-normal mb-8 text-[color:var(--brand-color,#000)] group-hover:-translate-y-2 transition-transform duration-700 ${themeTokens.fontHeadingClass}`}>
                {stat.value}
              </span>
              <div className="w-8 h-px bg-surface-200 mb-6 group-hover:bg-[color:var(--brand-color,#000)] transition-colors duration-700"></div>
              <span className={`text-surface-600 font-serif italic text-lg ${themeTokens.fontBodyClass}`}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
