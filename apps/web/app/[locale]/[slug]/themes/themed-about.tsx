import { ThemeStyleMap } from './theme-tokens';

export default function ThemedAbout({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  if (!config.aboutHtml && !property.description) return null;

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative ultra-premium minimal background elements */}
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 ${themeTokens.primaryBg} pointer-events-none -translate-y-1/2 translate-x-1/3`} />

      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3">
            <span className={`w-12 h-[2px] ${themeTokens.primaryBg}`} />
            <span className={`text-sm font-bold uppercase tracking-widest ${themeTokens.primaryText}`}>Discover</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-surface-900 leading-tight">
            About Our Property
          </h2>
          <div className="prose prose-lg text-surface-600">
            {config.aboutHtml ? (
              <div dangerouslySetInnerHTML={{ __html: config.aboutHtml }} />
            ) : (
              <p>{property.description}</p>
            )}
          </div>
        </div>

        {/* If we had highly specific hero images or multiple gallery images, we could render a masonry collage here. For now we use standard elegant blocking */}
        <div className="w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-surface-100 p-8 flex items-center justify-center">
            <span className="text-surface-300 font-medium">Visual branding space</span>
          </div>
        </div>
      </div>
    </section>
  );
}
