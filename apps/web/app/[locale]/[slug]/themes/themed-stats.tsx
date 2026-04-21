import { ThemeStyleMap } from './theme-tokens';

export default function ThemedStats({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const stats = config.stats || [];
  if (stats.length === 0) return null;

  return (
    <section className="py-24 bg-surface-900 border-y border-surface-800 text-white relative">
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-[var(--brand-color,${themeTokens.primaryBg})] to-transparent pointer-events-none`} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat: any, i: number) => (
            <div key={i} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <span className={`text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-surface-400`}>
                {stat.value}
              </span>
              <span className="text-surface-300 font-medium uppercase tracking-widest text-xs">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
