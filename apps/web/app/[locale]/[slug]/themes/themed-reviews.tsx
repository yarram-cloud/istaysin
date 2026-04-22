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

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section id="reviews" className="py-24 bg-[color:var(--brand-color,#000)] relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-16 text-center">
            <h2 className={`text-4xl md:text-5xl font-black text-white mb-4 ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar">
            {reviews.slice(0, limit).map((rev: any, i: number) => (
              <div key={rev.id || i} className={`min-w-[85vw] sm:min-w-[400px] snap-center shrink-0 bg-white p-8 ${themeTokens.radiusClass} shadow-xl hover:-translate-y-2 transition-transform`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex bg-surface-100 p-2 rounded-full">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'}`} />
                    ))}
                  </div>
                  <Quote className={`w-10 h-10 ${themeTokens.primaryText} opacity-20`} />
                </div>
                <p className={`text-surface-700 font-bold text-lg mb-8 line-clamp-4 ${themeTokens.fontBodyClass}`}>"{rev.text}"</p>
                <div className="flex items-center gap-4 border-t border-surface-100 pt-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white ${themeTokens.primaryBg}`}>
                    {(rev.guestProfile?.fullName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className={`font-bold text-surface-900 ${themeTokens.fontHeadingClass}`}>{rev.guestProfile?.fullName || t('anonymousGuest')}</h4>
                  </div>
                </div>
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
      <section id="reviews" className="py-32 bg-white border-y border-surface-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className={`text-3xl text-surface-900 mb-16 text-center font-light ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
          
          <div className="space-y-16">
            {reviews.slice(0, limit).map((rev: any, i: number) => (
              <div key={rev.id || i} className="text-center group">
                <div className="flex justify-center gap-1 mb-8">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'text-surface-900 fill-surface-900' : 'text-surface-200'} transition-all`} />
                    ))}
                </div>
                <p className={`text-xl md:text-2xl text-surface-600 font-light leading-relaxed mb-8 ${themeTokens.fontBodyClass}`}>
                  "{rev.text}"
                </p>
                <div className="flex items-center justify-center gap-4 text-surface-400">
                  <span className={`w-8 h-[1px] bg-surface-300 group-hover:bg-black transition-colors`}></span>
                  <span className={`text-sm tracking-widest uppercase text-surface-900 font-medium ${themeTokens.fontBodyClass}`}>
                    {rev.guestProfile?.fullName || t('anonymous')}
                  </span>
                  <span className={`w-8 h-[1px] bg-surface-300 group-hover:bg-black transition-colors`}></span>
                </div>
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
      <section id="reviews" className="py-24 bg-surface-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-4">
              <h2 className={`text-4xl md:text-5xl text-surface-900 mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
              <p className={`text-surface-500 mb-8 ${themeTokens.fontBodyClass}`}>{t('discoverMemorable')}</p>
              <div className="hidden md:flex gap-2">
                <button className="w-12 h-12 border border-surface-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors rounded-full">←</button>
                <button className="w-12 h-12 border border-surface-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors rounded-full">→</button>
              </div>
            </div>
            
            <div className="md:col-span-8 flex gap-6 overflow-x-auto hide-scrollbar">
               {reviews.slice(0, limit).map((rev: any, i: number) => (
                  <div key={rev.id || i} className={`min-w-[80vw] md:min-w-[400px] bg-white p-10 ${themeTokens.radiusClass} border border-surface-200 shrink-0`}>
                     <Quote className="w-12 h-12 text-surface-200 mb-6" />
                     <p className={`text-lg text-surface-700 italic mb-10 ${themeTokens.fontBodyClass}`}>"{rev.text}"</p>
                     
                     <div className="flex justify-between items-end">
                       <div>
                         <h4 className={`text-sm tracking-[0.2em] uppercase font-bold text-surface-900 ${themeTokens.fontBodyClass}`}>{rev.guestProfile?.fullName || t('anonymous')}</h4>
                       </div>
                       <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'text-black fill-black' : 'text-surface-200'}`} />
                          ))}
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

  // --- CLASSIC (Default) ---
  return (
    <section id="reviews" className="py-24 bg-surface-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className={`text-4xl md:text-5xl font-bold text-surface-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('guestExperiences')}</h2>
          <div className="w-24 h-1 bg-surface-300 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.slice(0, limit).map((rev: any, i: number) => (
            <div key={rev.id || i} className={`bg-white p-8 ${themeTokens.radiusClass} shadow-sm border border-surface-200 relative group hover:shadow-xl transition-shadow`}>
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}`} />
                ))}
              </div>

              <p className={`text-surface-700 italic mb-8 leading-relaxed font-medium ${themeTokens.fontBodyClass}`}>"{rev.text}"</p>

              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${themeTokens.primaryBg}`}>
                  {(rev.guestProfile?.fullName || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className={`font-bold text-surface-900 ${themeTokens.fontHeadingClass}`}>{rev.guestProfile?.fullName || t('anonymous')}</h4>
                  <p className="text-xs text-surface-400 uppercase tracking-widest mt-1 font-semibold">{t('verifiedStay')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
