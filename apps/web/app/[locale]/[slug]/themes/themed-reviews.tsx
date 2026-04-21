import { ThemeStyleMap } from './theme-tokens';
import { Star, Quote } from 'lucide-react';

export default function ThemedReviews({ property, themeTokens }: { property: any, themeTokens: ThemeStyleMap }) {
  if (!property.reviews || property.reviews.length === 0) return null;

  return (
    <section id="reviews" className="py-24 bg-surface-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">Guest Experiences</h2>
          <p className="text-lg text-surface-600">See what our guests have to say about their stay.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {property.reviews.slice(0, 3).map((rev: any, i: number) => (
            <div key={rev.id || i} className="bg-white p-8 rounded-3xl shadow-sm border border-surface-200 relative group hover:shadow-xl transition-shadow">
              <Quote className={`absolute top-6 right-6 w-12 h-12 opacity-5 group-hover:opacity-10 transition-opacity ${themeTokens.primaryText}`} />

              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}`} />
                ))}
              </div>

              <p className="text-surface-700 italic mb-8 leading-relaxed font-medium">"{rev.text}"</p>

              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${themeTokens.primaryBg}`}>
                  {(rev.guestProfile?.fullName || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-surface-900">{rev.guestProfile?.fullName || 'Anonymous Guest'}</h4>
                  <p className="text-xs text-surface-400 uppercase tracking-widest mt-1">Verified Stay</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
