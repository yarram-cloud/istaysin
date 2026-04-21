import { ThemeStyleMap } from './theme-tokens';
import { MapPin } from 'lucide-react';

export default function ThemedNearby({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const POIs = config.pointsOfInterest || [];
  if (POIs.length === 0) return null;

  return (
    <section className="py-20 bg-surface-50">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-3xl md:text-4xl font-bold text-surface-900 mb-12 text-center">In the Neighborhood</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POIs.map((poi: any, i: number) => (
            <div key={i} className="bg-white p-6 rounded-3xl flex items-start gap-4 border border-surface-100 hover:shadow-lg transition-shadow">
              <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${themeTokens.primaryBg} bg-opacity-10`}>
                <MapPin className={`w-5 h-5 ${themeTokens.primaryText}`} />
              </div>
              <div>
                <h4 className="font-bold text-surface-900 text-lg">{poi.name}</h4>
                <p className="text-sm text-surface-500 mt-1">{poi.description || poi.distance}</p>
                {poi.distance && <span className={`inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full bg-surface-100 ${themeTokens.primaryText}`}>{poi.distance}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
