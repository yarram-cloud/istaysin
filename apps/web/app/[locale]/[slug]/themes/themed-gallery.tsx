'use client';
import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';

export default function ThemedGallery({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;
  const images = config.images || config.gallery || [];
  if (images.length === 0) return null;

  // --- VIBRANT ARCHETYPE (Masonry-style staggering, huge rounded shapes) ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="gallery" className="py-32 bg-surface-50 relative overflow-hidden">
        {/* Dynamic backdrop blob */}
        <div className={`absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] opacity-[0.05] ${themeTokens.primaryBg} pointer-events-none -translate-y-1/2 translate-x-1/3`} />
        
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <span className={`inline-block px-5 py-2 rounded-full ${themeTokens.primaryBg}/10 ${themeTokens.primaryBg.replace('bg-', 'text-')} text-xs font-black tracking-widest uppercase mb-6 shadow-sm`}>Visuals</span>
              <h2 className={`text-5xl lg:text-[4.5rem] font-black text-surface-950 leading-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
            </div>
            <button className={`${themeTokens.primaryBg} ${themeTokens.primaryBgHover} text-white px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all`}>
              Explore Property
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10">
            {images.map((img: string, i: number) => {
              // Creating a pseudo-masonry staggered layout
              let aspectClass = "aspect-square";
              if (i % 5 === 0) aspectClass = "aspect-[4/5] col-span-2 row-span-2";
              else if (i % 3 === 0) aspectClass = "aspect-[3/4]";
              else if (i % 4 === 0) aspectClass = "aspect-video col-span-2";

              return (
                <div key={i} className={`group ${aspectClass} rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] relative cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 border-4 border-transparent hover:border-[color:var(--brand-color,#000)]`}>
                  <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className="transition-transform duration-[1.5s] group-hover:scale-110 object-cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE (Cinematic horizontal scroll, cinematic aspect ratios) ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section id="gallery" className="py-40 bg-white relative border-b border-surface-200">
        <div className="px-8 lg:px-16 mb-24">
           <div className="flex flex-col items-center text-center">
             <span className={`text-[10px] tracking-[0.4em] uppercase text-surface-400 font-bold mb-8 block ${themeTokens.fontBodyClass}`}>Atmosphere</span>
             <h2 className={`text-5xl lg:text-7xl font-medium tracking-tighter text-surface-900 ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
             <div className="w-px h-24 bg-surface-300 mt-12"></div>
           </div>
        </div>

        {/* Cinematic infinite slider feel */}
        <div className="flex gap-12 lg:gap-24 overflow-x-auto pb-16 px-8 lg:px-24 snap-x snap-mandatory hide-scrollbar">
          {images.map((img: string, i: number) => {
            const isWide = i % 2 !== 0;
            return (
              <div key={i} className={`snap-center shrink-0 ${isWide ? 'w-[80vw] lg:w-[60vw] aspect-[21/9]' : 'w-[75vw] lg:w-[40vw] aspect-[3/2]'} object-cover relative overflow-hidden group shadow-2xl`}>
                <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className={`filter grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[2s] ${isWide ? 'hover:scale-105' : 'hover:scale-110'} ease-[cubic-bezier(0.16,1,0.3,1)]`} />
                <div className="absolute top-8 right-8 text-xs font-bold tracking-widest text-white/50 group-hover:text-white/90 uppercase z-10 transition-colors drop-shadow-md">
                   0{i + 1}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE (Dark mode mosaic, intense hovers, hidden text) ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section id="gallery" className="py-32 bg-surface-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]" />

        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 relative z-10">
          <div className="flex justify-between items-end border-b border-surface-800 pb-12 mb-16">
            <h2 className={`text-5xl lg:text-7xl text-white font-light tracking-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
            <button className="hidden md:block uppercase tracking-[0.2em] text-xs font-bold text-surface-400 hover:text-white transition-colors">
               View Full Archive
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[300px]">
             {images.map((img: string, i: number) => {
              // Creating a distinct mosaic layout
              const isLarge = i === 0 || i === Math.min(3, images.length - 1);
              return (
                <div key={i} className={`group overflow-hidden relative bg-surface-900 border border-white/5 ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full" className="group-hover:scale-110 opacity-70 group-hover:opacity-100 transition-all duration-[1.5s] object-cover ease-out" />
                  
                  {/* Chic intense overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Centered cross icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <div className="w-16 h-16 rounded-full border border-white/30 backdrop-blur-sm flex items-center justify-center text-white/80 font-light text-2xl">
                       +
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC ARCHETYPE (Strict symmetry, framed panels, formal structure) ---
  return (
    <section id="gallery" className="py-32 bg-[#FCFCFC] relative border-y border-surface-200">
      {/* Decorative top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[color:var(--brand-color,#000)]/20 to-transparent"></div>

      <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className={`text-5xl lg:text-6xl font-normal text-surface-900 mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || t('gallery')}</h2>
          <div className="w-16 h-[2px] mx-auto bg-[color:var(--brand-color,#000)] mb-8"></div>
          <p className={`text-[color:var(--brand-color,#000)] font-serif italic text-xl ${themeTokens.fontBodyClass}`}>{t('exploreOurProperty')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {images.map((img: string, i: number) => (
            <div key={i} className="group relative">
               {/* Elegant offset frame */}
               <div className="absolute inset-0 bg-surface-100 translate-x-3 translate-y-3 border border-surface-200 z-0"></div>
               <div className={`aspect-square relative overflow-hidden shadow-sm border-[6px] border-white z-10 ${themeTokens.radiusClass}`}>
                 <SafeNextImage src={img} alt={`Gallery ${i}`} containerClassName="w-full h-full bg-surface-50" className="group-hover:scale-110 transition-transform duration-[2s] ease-in-out" />
                 
                 {/* Formal overlay */}
                 <div className="absolute inset-0 bg-[color:var(--brand-color,#000)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-sm border border-[color:var(--brand-color,#000)]/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <span className={`text-[color:var(--brand-color,#000)] font-serif italic text-sm ${themeTokens.fontBodyClass}`}>View Portrait</span>
                    <span className="w-6 h-[1px] bg-[color:var(--brand-color,#000)] block"></span>
                 </div>
               </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 flex justify-center">
           <button className="border border-[color:var(--brand-color,#000)] text-[color:var(--brand-color,#000)] hover:bg-[color:var(--brand-color,#000)] hover:text-white transition-colors duration-500 px-12 py-4 uppercase tracking-[0.2em] text-xs font-semibold">
              Load More Gallery
           </button>
        </div>
      </div>
    </section>
  );
}
