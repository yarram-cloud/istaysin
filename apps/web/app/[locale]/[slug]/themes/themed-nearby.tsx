'use client';
import { ThemeStyleMap } from './theme-tokens';
import { MapPin, Navigation, Map } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemedNearby({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config.enabled) return null;
  const POIs = config.places || config.pointsOfInterest || [];
  if (POIs.length === 0) return null;

  // --- VIBRANT ARCHETYPE (Bold cards, massive floating backgrounds, dynamic staggered lists) ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Playful Map Background Context */}
        <div className={`absolute top-0 left-0 w-full h-[60vh] ${themeTokens.primaryBg}/5 -skew-y-3 transform-gpu z-0 opacity-50`} />
        
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10">
            <div className="max-w-3xl">
              <span className={`inline-block px-5 py-2 rounded-full ${themeTokens.primaryBg}/10 ${themeTokens.primaryBg.replace('bg-', 'text-')} text-xs font-black tracking-widest uppercase mb-6 shadow-sm`}>Location</span>
              <h3 className={`text-6xl font-black text-surface-950 leading-none tracking-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
            </div>
            <div className={`w-20 h-20 rounded-[2rem] ${themeTokens.primaryBg} text-white flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500`}>
               <Map className="w-10 h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {POIs.map((poi: any, i: number) => {
              // Staggered layout translation
              const translateY = i % 3 === 1 ? 'lg:translate-y-12' : i % 3 === 2 ? 'lg:translate-y-24' : '';
              return (
                <div key={i} className={`bg-white p-10 lg:p-12 ${themeTokens.radiusClass} shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group border-2 border-transparent hover:border-[color:var(--brand-color,#000)] ${translateY}`}>
                  
                  {/* Decorative background blob per card */}
                  <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${themeTokens.primaryBg} opacity-[0.03] group-hover:scale-[3] transition-transform duration-[1s] ease-in-out z-0`} />
                  
                  <div className={`mb-8 w-16 h-16 rounded-[2rem] flex items-center justify-center ${themeTokens.primaryBg} text-white shadow-lg relative z-10 group-hover:scale-110 transition-transform`}>
                    <MapPin className="w-8 h-8" />
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className={`font-black text-surface-950 text-3xl mb-4 ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                    <p className={`text-surface-600 mb-8 font-medium text-lg leading-relaxed ${themeTokens.fontBodyClass}`}>{poi.description}</p>
                    
                    {poi.distance && (
                      <span className={`inline-flex items-center gap-3 font-black px-6 py-3 rounded-full bg-surface-50 ${themeTokens.primaryText} text-sm uppercase tracking-widest border border-surface-100 group-hover:bg-white transition-colors`}>
                        <Navigation className="w-5 h-5" /> {poi.distance}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE (Massive cinematic lines, huge numbers, sparse whitespace) ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section className="py-40 bg-[#FAFAFA] border-y border-surface-200">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b-2 border-surface-900 pb-12 mb-20 gap-10">
             <div>
               <span className={`text-[10px] tracking-[0.4em] uppercase text-surface-400 font-bold mb-6 block ${themeTokens.fontBodyClass}`}>Surroundings</span>
               <h3 className={`text-5xl lg:text-7xl font-light text-surface-900 tracking-tighter ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
             </div>
             <p className={`text-xl text-surface-500 font-light max-w-sm ${themeTokens.fontBodyClass}`}>A curated directory of exceptional local establishments and landscapes.</p>
          </div>

          <div className="flex flex-col">
            {POIs.map((poi: any, i: number) => (
              <div key={i} className="flex flex-col md:flex-row justify-between md:items-center py-12 border-b border-surface-200 group relative">
                
                {/* Hover line indicator */}
                <div className="absolute left-0 bottom-[-1px] w-0 h-px bg-surface-900 group-hover:w-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"></div>

                <div className="flex items-start md:items-center gap-8 md:gap-16 w-full md:w-auto mb-6 md:mb-0">
                  <span className={`text-surface-200 font-light text-6xl md:text-8xl w-24 group-hover:text-surface-400 transition-colors duration-500 track-tighter ${themeTokens.fontHeadingClass}`}>
                    0{i+1}
                  </span>
                  <div>
                     {poi.distance && <span className={`text-xs font-bold tracking-[0.3em] uppercase text-surface-400 mb-2 block ${themeTokens.fontBodyClass}`}>{poi.distance}</span>}
                    <h4 className={`text-3xl lg:text-5xl text-surface-900 group-hover:-translate-y-1 transition-transform duration-500 tracking-tight ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                  </div>
                </div>
                
                <p className={`text-lg text-surface-500 font-light max-w-xl md:text-right group-hover:text-surface-700 transition-colors duration-500 ${themeTokens.fontBodyClass}`}>{poi.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE (Dark mode mosaic, deep glassmorphism blocks) ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section className="py-32 bg-surface-950 relative overflow-hidden">
        {/* Deep ambient glow */}
        <div className="absolute top-0 right-0 w-[800px] h-full bg-white/[0.02] blur-[150px] pointer-events-none skew-x-12" />

        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 relative z-10 text-white">
           <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-12 border-b border-white/10 pb-16">
             <div>
               <MapPin className="w-12 h-12 text-surface-600 mb-10" />
               <h3 className={`text-5xl lg:text-[5rem] text-white font-light tracking-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
             </div>
             <p className={`text-surface-400 max-w-md text-lg leading-relaxed ${themeTokens.fontBodyClass}`}>{t('exploreDestinations')} We have mapped out the most distinguished locations nearby.</p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {POIs.map((poi: any, i: number) => (
                <div key={i} className={`group bg-surface-900 border border-white/5 hover:border-white/20 p-12 lg:p-14 transition-all duration-700 hover:bg-white/5 flex flex-col justify-between h-full ${themeTokens.radiusClass}`}>
                   <div className="mb-16">
                      <div className="flex justify-between items-start mb-8">
                         <h4 className={`text-3xl text-white tracking-widest uppercase font-bold ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                      </div>
                      <p className={`text-surface-400 leading-relaxed text-lg ${themeTokens.fontBodyClass}`}>{poi.description}</p>
                   </div>
                   
                   {poi.distance && (
                     <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-8 group-hover:border-white/30 transition-colors duration-700">
                         <span className={`text-xs tracking-[0.25em] uppercase text-surface-500 font-bold ${themeTokens.fontBodyClass}`}>Distance</span>
                         <span className={`text-sm tracking-[0.2em] uppercase text-white font-bold bg-white/10 px-4 py-2 ${themeTokens.radiusClass}`}>{poi.distance}</span>
                     </div>
                   )}
                </div>
             ))}
           </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC (Heritage formal list, dual column, elegant lines) ---
  return (
    <section className="py-32 bg-[#FCFCFC] relative border-b border-surface-200">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <div className={`mx-auto w-16 h-16 rounded-full border border-[color:var(--brand-color,#000)]/20 flex items-center justify-center mb-8`}>
            <MapPin className={`w-6 h-6 text-[color:var(--brand-color,#000)]`} />
          </div>
          <h3 className={`text-5xl lg:text-6xl font-normal text-surface-900 mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || t('inTheNeighborhood')}</h3>
          <div className="w-24 h-[2px] bg-[color:var(--brand-color,#000)] mx-auto mb-8"></div>
          <p className={`font-serif italic text-xl text-surface-500 ${themeTokens.fontBodyClass}`}>Discover the distinguished surroundings of our estate.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {POIs.map((poi: any, i: number) => (
            <div key={i} className={`flex items-start gap-8 group`}>
              <div className={`mt-2 w-12 h-12 flex items-center justify-center shrink-0 border border-[color:var(--brand-color,#000)]/20 rounded-full group-hover:bg-[color:var(--brand-color,#000)] transition-colors duration-500`}>
                <Navigation className={`w-4 h-4 text-[color:var(--brand-color,#000)] group-hover:text-white transition-colors duration-500`} />
              </div>
              
              <div className="flex-1 border-b border-surface-200 pb-12 group-hover:border-[color:var(--brand-color,#000)]/30 transition-colors duration-500">
                <div className="flex justify-between items-baseline mb-4 gap-4 flex-wrap">
                  <h4 className={`font-semibold text-surface-900 text-3xl ${themeTokens.fontHeadingClass}`}>{poi.name}</h4>
                  {poi.distance && <span className={`inline-block text-sm font-serif italic text-surface-500`}>{poi.distance} away</span>}
                </div>
                <p className={`text-surface-600 leading-[1.8] font-serif text-lg ${themeTokens.fontBodyClass}`}>{poi.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 text-center">
           <button className="border border-[color:var(--brand-color,#000)] text-[color:var(--brand-color,#000)] px-10 py-4 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-[color:var(--brand-color,#000)] hover:text-white transition-all duration-500">
              View Map Directory
           </button>
        </div>
      </div>
    </section>
  );
}
