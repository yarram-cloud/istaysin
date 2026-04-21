import { ThemeStyleMap } from './theme-tokens';

export default function ThemedGallery({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  if (!config.gallery || config.gallery.length === 0) return null;

  return (
    <section id="gallery" className="py-24 bg-surface-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Gallery</h2>
          <p className="text-lg text-surface-400">Explore our property in detail.</p>
        </div>

        {/* Masonry-like modern layout, mobile friendly horizontal scroll or wrap */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {config.gallery.map((img: string, i: number) => {
            // Give some dynamic sizing for masonry feel
            const isLarge = i === 0 || i === 3;
            return (
              <div key={i} className={`group overflow-hidden rounded-2xl relative ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}>
                <div className="absolute inset-0 bg-surface-800 animate-pulse" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Gallery Image ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-in-out relative z-10"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
