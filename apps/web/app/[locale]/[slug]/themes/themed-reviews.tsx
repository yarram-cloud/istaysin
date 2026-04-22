'use client';
import { ThemeStyleMap } from './theme-tokens';
import { Star, Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemedReviews({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config.enabled) return null;
  
  // Prefer CMS curated reviews (config.items) over API property.reviews
  const cmsReviews = (config.items || []).map((r: any, i: number) => ({
    id: `cms-${i}`,
    rating: r.rating || 5,
    text: r.text || '',
    guestProfile: { fullName: r.author || '' }
  }));
  const apiReviews = (property.reviews || []).map((r: any) => ({
    id: r.id,
    rating: r.rating || 5,
    text: r.text || r.comment || '',
    guestProfile: r.guestProfile || { fullName: 'Guest' }
  }));
  const reviews = cmsReviews.length > 0 ? cmsReviews : apiReviews;
  if (reviews.length === 0) return null;
  const limit = config.limit || reviews.length;

  // --- VIBRANT ARCHETYPE (Floating chat bubbles, bold star clusters, neon gradients) ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="reviews" className="py-32 bg-surface-50 relative overflow-hidden">
        {/* Playful background shapes */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-[60vh] bg-gradient-to-r from-transparent via-[color:var(--brand-color,#ccc)]/10 to-transparent -skew-y-6 transform-gpu`}></div>

        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="mb-24 flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full ${themeTokens.primaryBg} flex items-center justify-center text-white mb-8 shadow-2xl`}>
               <Quote className="w-10 h-10" />
            </div>
            <h2 className={`text-5xl lg:text-[4.5rem] font-black text-surface-950 mb-4 tracking-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
            <p className={`text-xl font-bold text-surface-400 ${themeTokens.fontBodyClass}`}>What they say about us</p>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-16 pt-8 snap-x snap-mandatory hide-scrollbar">
            {reviews.slice(0, limit).map((rev: any, i: number) => {
              // Stagger bubbles up and down
              const translateY = i % 2 === 0 ? 'translate-y-0' : '-translate-y-12';
              return (
                <div key={rev.id || i} className={`min-w-[85vw] md:min-w-[450px] snap-center shrink-0 ${translateY}`}>
                  {/* Bubble body */}
                  <div className={`bg-white p-12 rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] relative border-2 border-transparent hover:border-[color:var(--brand-color,#000)] transition-colors duration-500 group`}>
                    
                    <div className="flex bg-surface-50 p-3 rounded-full w-max mb-8 group-hover:bg-[color:var(--brand-color,#000)]/5 transition-colors">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-5 h-5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'} mx-0.5`} />
                      ))}
                    </div>
                    
                    <p className={`text-surface-800 font-bold text-xl lg:text-2xl mb-12 leading-snug line-clamp-4 ${themeTokens.fontBodyClass}`}>"{rev.text}"</p>
                    
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-xl ${themeTokens.primaryBg} shadow-lg shadow-[color:var(--brand-color,#000)]/30`}>
                        {(rev.guestProfile?.fullName || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className={`font-black text-xl text-surface-900 ${themeTokens.fontHeadingClass}`}>{rev.guestProfile?.fullName || t('anonymousGuest')}</h4>
                        <span className="text-xs uppercase tracking-widest font-bold text-surface-400">Verified</span>
                      </div>
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

  // --- MINIMAL ARCHETYPE (Massive centering, delicate text, no visible containers) ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section id="reviews" className="py-40 bg-[#FAFAFA] border-y border-surface-200 relative overflow-hidden">
        {/* Subtle huge quote mark in bg */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40rem] text-surface-200/50 font-serif leading-none pointer-events-none select-none tracking-tighter ${themeTokens.fontHeadingClass}`}>"</div>

        <div className="max-w-6xl mx-auto px-8 relative z-10">
          <div className="text-center mb-24">
             <span className={`text-[10px] tracking-[0.4em] uppercase text-surface-400 font-bold ${themeTokens.fontBodyClass}`}>{config.title || t('guestExperiences')}</span>
          </div>
          
          <div className="flex gap-16 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-10">
            {reviews.slice(0, limit).map((rev: any, i: number) => (
              <div key={rev.id || i} className="min-w-full snap-center text-center group cursor-default px-4">
                <div className="flex justify-center gap-2 mb-12">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-5 h-5 ${s <= rev.rating ? 'text-surface-900 fill-surface-900' : 'text-surface-200'} transition-all`} />
                    ))}
                </div>
                <p className={`text-3xl lg:text-5xl text-surface-600 font-light leading-[1.4] tracking-tight mb-16 max-w-4xl mx-auto ${themeTokens.fontBodyClass}`}>
                  "{rev.text}"
                </p>
                <div className="flex flex-col items-center justify-center text-surface-400">
                  <span className={`text-xs tracking-[0.3em] uppercase text-surface-900 font-bold mb-4 ${themeTokens.fontBodyClass}`}>
                    {rev.guestProfile?.fullName || t('anonymous')}
                  </span>
                  <span className={`w-12 h-px bg-surface-300 group-hover:bg-black transition-colors duration-700`}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE (Deep dark mode offset cards, slick neon quotes) ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section id="reviews" className="py-40 bg-surface-950 relative">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-4 lg:sticky lg:top-40">
              <Quote className="w-16 h-16 text-white/10 mb-8" />
              <h2 className={`text-5xl lg:text-7xl text-white font-light tracking-tight mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
              <p className={`text-surface-400 text-lg leading-relaxed ${themeTokens.fontBodyClass}`}>{t('discoverMemorable')} Hand-picked stories from our most valued guests.</p>
            </div>
            
            <div className="lg:col-span-8 flex flex-col gap-8">
               {reviews.slice(0, limit).map((rev: any, i: number) => (
                  <div key={rev.id || i} className={`bg-surface-900/50 backdrop-blur-xl p-10 lg:p-14 ${themeTokens.radiusClass} border border-white/5 hover:border-white/20 transition-all duration-700 hover:-translate-y-2 group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]`}>
                     <div className="flex gap-1 mb-8">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'text-white fill-white' : 'text-surface-700'}`} />
                        ))}
                     </div>
                     <p className={`text-xl lg:text-2xl text-surface-300 leading-relaxed font-light mb-12 ${themeTokens.fontBodyClass}`}>"{rev.text}"</p>
                     
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white font-bold bg-surface-800">
                          {(rev.guestProfile?.fullName || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                         <h4 className={`text-xs tracking-[0.25em] uppercase font-bold text-white mb-1 ${themeTokens.fontBodyClass}`}>{rev.guestProfile?.fullName || t('anonymous')}</h4>
                         <span className="text-[10px] text-surface-500 uppercase tracking-[0.2em]">Verified Collection</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC (Heritage newspaper layout, formal serif typographic quotes) ---
  return (
    <section id="reviews" className="py-32 bg-[#FCFCFC] relative border-b border-surface-200">
      <div className="absolute top-0 inset-x-0 h-px bg-[color:var(--brand-color,#000)]/10"></div>
      
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
        <div className="mb-24 text-center max-w-3xl mx-auto">
          <Quote className={`w-12 h-12 md:w-16 md:h-16 text-[color:var(--brand-color,#000)]/20 mx-auto mb-8`} />
          <h2 className={`text-5xl lg:text-6xl font-normal text-surface-900 mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
          <div className="w-16 h-px bg-[color:var(--brand-color,#000)] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {reviews.slice(0, limit).map((rev: any, i: number) => (
            <div key={rev.id || i} className={`relative pt-12`}>
              {/* Top border abstract line */}
              <div className="absolute top-0 left-0 w-12 h-1 bg-[color:var(--brand-color,#000)] opacity-40"></div>
              
              <div className="flex items-center gap-2 mb-8 border-b border-surface-200 pb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'text-[color:var(--brand-color,#000)] fill-[color:var(--brand-color,#000)]' : 'text-surface-200'}`} />
                ))}
              </div>

              <p className={`text-surface-600 font-serif italic mb-10 text-xl leading-loose ${themeTokens.fontBodyClass}`}>"{rev.text}"</p>

              <div>
                <h4 className={`text-sm uppercase tracking-[0.2em] font-semibold text-surface-900 mb-1 ${themeTokens.fontHeadingClass}`}>{rev.guestProfile?.fullName || t('anonymous')}</h4>
                <p className={`text-xs font-serif italic text-surface-500`}>A Distinguished Guest</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
