'use client';
import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';

export default function ThemedAbout({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');

  if (!config.enabled) return null;
  const content = config.contentHtml || property.description;
  if (!content) return null;

  const title = config.title || t('aboutOurProperty');
  const radius = themeTokens.radiusClass;

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <section id="about" className="py-32 md:py-48 bg-white relative overflow-hidden text-black">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-16 grid lg:grid-cols-12 gap-16 items-start">
             <div className="lg:col-span-5 space-y-12">
                <div className="w-8 h-1 bg-black" />
                <h2 className={`text-4xl md:text-6xl font-light tracking-tighter ${themeTokens.fontHeadingClass} leading-[1.1]`}>
                  {title}
                </h2>
             </div>
             <div className="lg:col-span-7 space-y-12 lg:pt-24">
                <div className={`prose prose-xl prose-stone font-light text-gray-500 leading-relaxed ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
                {config.image && (
                   <div className="mt-12">
                     <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-video ${radius} overflow-hidden bg-gray-100`} className="object-cover" />
                   </div>
                )}
             </div>
          </div>
        </section>
      );

    case 'luxury-gold':
      return (
        <section id="about" className="py-40 bg-[#0A0A0A] relative border-y border-white/5 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1">
              {config.image ? (
                <div className="relative p-4 border border-brand/20">
                   <div className="absolute inset-0 border border-brand/40 scale-105 pointer-events-none" />
                   <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-[3/4] overflow-hidden" className="object-cover hover:scale-110 transition-transform duration-[3s]" />
                </div>
              ) : <div className="w-full aspect-[3/4] border border-brand/20" />}
            </div>
            <div className="order-1 md:order-2 space-y-8 relative z-10 text-white">
              <span className="text-brand uppercase tracking-[0.3em] text-xs font-bold">The Vision</span>
              <h2 className={`text-5xl lg:text-7xl font-serif text-white leading-tight ${themeTokens.fontHeadingClass}`}>
                {title}
              </h2>
              <div className={`prose prose-invert prose-lg text-gray-400 font-light ${themeTokens.fontBodyClass}`}>
                 <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          </div>
        </section>
      );

    case 'nature-eco':
      return (
        <section id="about" className="py-32 bg-[#F6F8F6] relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 flex flex-col lg:flex-row gap-16 items-center">
             <div className="lg:w-1/2 space-y-10">
                <h2 className={`text-5xl md:text-6xl text-green-950 font-medium tracking-tight ${themeTokens.fontHeadingClass}`}>
                  {title}
                </h2>
                <div className={`prose prose-lg text-green-900/70 font-light leading-relaxed ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
             </div>
             <div className="lg:w-1/2 relative">
               {config.image && (
                 <div className="relative">
                   <div className="absolute -inset-4 bg-green-900/10 rounded-[4rem] transform -rotate-3" />
                   <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-square rounded-[3rem] shadow-xl overflow-hidden relative z-10" className="object-cover" />
                 </div>
               )}
             </div>
          </div>
        </section>
      );

    case 'boutique-chic':
      return (
        <section id="about" className="py-40 bg-[#FDFBF7] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
               <span className={`text-brand tracking-[0.2em] font-bold text-sm uppercase`}>Concept</span>
               <h2 className={`text-5xl md:text-7xl text-gray-900 leading-none ${themeTokens.fontHeadingClass}`}>{title}</h2>
            </div>
            <div className="grid md:grid-cols-12 gap-12 items-center">
               <div className="md:col-span-5">
                 {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/5] ${radius} shadow-2xl`} className="object-cover" />}
               </div>
               <div className="md:col-span-7 bg-white p-12 md:p-16 shadow-[20px_20px_0px_var(--brand-color)] border border-gray-100 z-10">
                  <div className={`prose prose-lg text-gray-600 ${themeTokens.fontBodyClass}`}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
               </div>
            </div>
          </div>
        </section>
      );

    case 'dark-elegance':
      return (
        <section id="about" className="py-40 bg-black text-white relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-20">
             <div className="space-y-12">
                <h2 className={`text-6xl md:text-[5rem] font-black uppercase tracking-tighter leading-[0.85] ${themeTokens.fontHeadingClass}`}>
                  {title}
                </h2>
                <div className={`prose prose-invert prose-xl font-light text-gray-300 ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
             </div>
             <div className="relative">
                {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full h-full min-h-[500px] grayscale" className="object-cover" />}
             </div>
          </div>
        </section>
      );

    case 'playful-vibrant':
      return (
        <section id="about" className="py-32 bg-white relative overflow-hidden">
          <div className="absolute -right-[20%] top-[10%] w-[50vw] h-[50vw] bg-brand/10 rounded-[100px] blur-3xl pointer-events-none" />
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div className="order-2 md:order-1">
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-[4/3] rounded-[3rem] border-8 border-brand/20 shadow-2xl" className="object-cover" />}
            </div>
            <div className="order-1 md:order-2 space-y-8">
               <h2 className={`text-5xl md:text-7xl font-black text-gray-900 drop-shadow-sm ${themeTokens.fontHeadingClass}`}>{title}</h2>
               <div className={`prose prose-lg text-gray-600 ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
               </div>
            </div>
          </div>
        </section>
      );

    case 'corporate-trust':
      return (
        <section id="about" className="py-32 bg-white border-t border-slate-100 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-8 grid md:grid-cols-12 gap-16 items-start">
             <div className="md:col-span-5 sticky top-32 space-y-6">
                <div className="w-16 h-1 bg-brand mb-8" />
                <h2 className={`text-4xl md:text-5xl font-bold text-slate-900 ${themeTokens.fontHeadingClass}`}>{title}</h2>
             </div>
             <div className="md:col-span-7 space-y-10">
                <div className={`prose prose-lg text-slate-600 ${themeTokens.fontBodyClass}`}>
                   <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
                {config.image && (
                   <div>
                     <SafeNextImage src={config.image} alt={title} containerClassName={`w-full h-[400px] ${radius} shadow-xl overflow-hidden`} className="object-cover" />
                   </div>
                )}
             </div>
          </div>
        </section>
      );

    case 'classic-heritage':
      return (
        <section id="about" className="py-32 bg-[#fdfaf5] border-t-4 border-[#e8dfc8] overflow-hidden">
          <div className="max-w-[1000px] mx-auto px-6 text-center">
             <div className="space-y-10">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-px bg-yellow-800" />
                  <span className="uppercase tracking-[0.2em] font-serif text-yellow-900 text-sm">About Us</span>
                  <div className="w-12 h-px bg-yellow-800" />
                </div>
                <h2 className={`text-5xl md:text-6xl text-yellow-950 font-serif ${themeTokens.fontHeadingClass}`}>{title}</h2>
                <div className={`prose prose-xl mx-auto text-yellow-900/80 font-serif italic leading-relaxed ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
                {config.image && (
                   <div className="mt-16 inline-block p-4 bg-white border border-[#e8dfc8] shadow-2xl">
                     <SafeNextImage src={config.image} alt={title} containerClassName="w-[300px] md:w-[600px] aspect-[4/3] sepia-[0.2]" className="object-cover" />
                   </div>
                )}
             </div>
          </div>
        </section>
      );

    case 'retro-vintage':
      return (
        <section id="about" className="py-32 bg-[#F2B94A] border-t-[6px] border-black overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
             <div className="bg-white border-[6px] border-black p-10 shadow-[16px_16px_0px_#000]">
                <h2 className={`text-5xl font-black text-black uppercase mb-8 ${themeTokens.fontHeadingClass}`}>{title}</h2>
                <div className={`prose prose-lg text-black font-semibold ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
             </div>
             <div>
                {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-square border-[6px] border-black shadow-[16px_16px_0px_#000] rotate-2 bg-white" className="object-cover grayscale contrast-125" />}
             </div>
          </div>
        </section>
      );

    case 'resort-tropical':
      return (
        <section id="about" className="py-32 bg-teal-50 overflow-hidden relative">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-400 blur-[150px] opacity-20 pointer-events-none" />
          <div className="max-w-[1300px] mx-auto px-8 grid md:grid-cols-12 gap-16 items-center relative z-10">
             <div className="md:col-span-6 space-y-8">
                <h2 className={`text-6xl md:text-7xl font-black text-teal-900 leading-[0.9] ${themeTokens.fontHeadingClass}`}>{title}</h2>
                <div className={`prose prose-xl text-teal-800/80 ${themeTokens.fontBodyClass}`}>
                   <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
             </div>
             <div className="md:col-span-6">
                {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/5] ${radius} shadow-2xl`} className="object-cover" />}
             </div>
          </div>
        </section>
      );

    case 'compact-urban':
      return (
        <section id="about" className="py-24 bg-[#111] text-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12">
            <div>
               <h2 className={`text-4xl md:text-5xl font-bold mb-8 ${themeTokens.fontHeadingClass}`}>{title}</h2>
               {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-video ${radius} grayscale mt-8`} className="object-cover" />}
            </div>
            <div className="md:pl-12 md:border-l md:border-white/20">
               <div className={`prose prose-invert prose-lg text-gray-400 font-light ${themeTokens.fontBodyClass}`}>
                 <div dangerouslySetInnerHTML={{ __html: content }} />
               </div>
            </div>
          </div>
        </section>
      );

    case 'abstract-art':
      return (
        <section id="about" className="py-40 bg-gray-100 relative overflow-hidden">
           <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-12 gap-12 items-center relative z-10">
              <div className="md:col-span-7 bg-white p-12 md:p-20 shadow-2xl rounded-[50px] md:rounded-[100px] border-b-[20px] border-l-[20px] border-brand/20">
                 <h2 className={`text-5xl md:text-7xl font-black text-gray-900 mb-10 tracking-tighter ${themeTokens.fontHeadingClass}`}>{title}</h2>
                 <div className={`prose prose-xl text-gray-600 ${themeTokens.fontBodyClass}`}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                 </div>
              </div>
              <div className="md:col-span-5 relative h-full min-h-[400px]">
                 <div className="absolute inset-0">
                    {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full h-full rounded-[40px] overflow-hidden mix-blend-multiply" className="object-cover" />}
                 </div>
              </div>
           </div>
        </section>
      );

    case 'scandinavian-frost':
      return (
        <section id="about" className="py-32 bg-[#F8FAFC] relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-16 grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="w-12 h-[2px] bg-slate-300" />
              <h2 className={`text-5xl md:text-6xl font-extralight tracking-tight text-slate-800 leading-tight ${themeTokens.fontHeadingClass}`}>{title}</h2>
              <div className={`prose prose-lg text-slate-400 font-light leading-relaxed ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
            <div className="relative">
              {config.image && (
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-sky-100/50 to-slate-100/50 rounded-[2rem] -rotate-1" />
                  <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/3] ${radius} overflow-hidden shadow-2xl shadow-slate-300/40 relative z-10`} className="object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case 'art-deco-glam':
      return (
        <section id="about" className="py-40 bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1">
              {config.image ? (
                <div className="relative p-3 border border-[#D4AF37]/20">
                  <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-[3/4] overflow-hidden" className="object-cover sepia-[0.2]" />
                </div>
              ) : <div className="w-full aspect-[3/4] border border-[#D4AF37]/20" />}
            </div>
            <div className="order-1 md:order-2 space-y-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-px bg-[#D4AF37]" />
                <span className="text-[#D4AF37] tracking-[0.4em] uppercase text-xs font-medium">Our Story</span>
              </div>
              <h2 className={`text-5xl lg:text-7xl font-bold text-white leading-tight ${themeTokens.fontHeadingClass}`}>{title}</h2>
              <div className={`prose prose-invert prose-lg text-gray-400 font-light ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          </div>
        </section>
      );

    case 'japanese-zen':
      return (
        <section id="about" className="py-32 bg-[#F5F0EB] relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-16 grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4 space-y-10">
              <div className="w-16 h-[1px] bg-[#8B7355]/40" />
              <h2 className={`text-4xl md:text-5xl font-extralight text-[#3D3028] tracking-tight leading-tight ${themeTokens.fontHeadingClass}`}>{title}</h2>
            </div>
            <div className="lg:col-span-8 space-y-12">
              <div className={`prose prose-xl text-[#8B7355] font-light leading-relaxed ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-video overflow-hidden`} className="object-cover" />}
            </div>
          </div>
        </section>
      );

    case 'mediterranean-sun':
      return (
        <section id="about" className="py-32 bg-[#FFF7ED] relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#C2410C] blur-[200px] opacity-10 pointer-events-none" />
          <div className="max-w-[1300px] mx-auto px-8 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <div className="inline-block bg-[#C2410C]/10 text-[#C2410C] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">About Us</div>
              <h2 className={`text-5xl md:text-6xl font-bold text-[#431407] leading-tight ${themeTokens.fontHeadingClass}`}>{title}</h2>
              <div className={`prose prose-lg text-[#9A3412]/70 font-light ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
            <div>
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/5] ${radius} shadow-2xl shadow-orange-900/20`} className="object-cover" />}
            </div>
          </div>
        </section>
      );

    case 'industrial-loft':
      return (
        <section id="about" className="py-32 bg-[#1C1917] text-white overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-end gap-4 mb-8">
                <span className="text-stone-500 font-mono text-xs tracking-widest uppercase">About</span>
                <div className="w-16 h-px bg-stone-700" />
              </div>
              <h2 className={`text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-8 ${themeTokens.fontHeadingClass}`}>{title}</h2>
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-video mt-8 contrast-125`} className="object-cover" />}
            </div>
            <div className="md:pl-12 md:border-l border-stone-700">
              <div className={`prose prose-invert prose-lg text-stone-400 font-light ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          </div>
        </section>
      );

    case 'royal-palace':
      return (
        <section id="about" className="py-40 bg-gradient-to-b from-[#0F0320] to-[#0A0118] text-white relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="flex justify-start mb-4"><div className="w-px h-12 bg-gradient-to-b from-transparent via-purple-500 to-transparent" /></div>
              <h2 className={`text-5xl lg:text-7xl font-light text-white leading-tight ${themeTokens.fontHeadingClass}`}>{title}</h2>
              <div className={`prose prose-invert prose-lg text-purple-200/50 font-light ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
            <div>
              {config.image ? (
                <div className="relative p-3 border border-purple-500/20">
                  <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-[3/4] overflow-hidden" className="object-cover" />
                </div>
              ) : <div className="w-full aspect-[3/4] border border-purple-500/20" />}
            </div>
          </div>
        </section>
      );

    case 'coastal-breeze':
      return (
        <section id="about" className="py-32 bg-gradient-to-b from-white to-sky-50 relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-400 blur-[200px] opacity-10 pointer-events-none" />
          <div className="max-w-[1300px] mx-auto px-8 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-[2px] bg-sky-400" />
                <span className="text-sky-500 text-xs font-bold tracking-[0.2em] uppercase">Our Story</span>
              </div>
              <h2 className={`text-5xl md:text-6xl font-bold text-slate-800 leading-tight ${themeTokens.fontHeadingClass}`}>{title}</h2>
              <div className={`prose prose-lg text-slate-500 font-light ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
            <div>
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/3] rounded-[2rem] shadow-2xl shadow-sky-900/15 border-4 border-white overflow-hidden`} className="object-cover" />}
            </div>
          </div>
        </section>
      );

    case 'neo-brutalist':
      return (
        <section id="about" className="py-32 bg-[#FEF3C7] border-t-[6px] border-black overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="bg-white border-[6px] border-black p-10 shadow-[12px_12px_0px_#000]">
              <h2 className={`text-5xl font-black text-black uppercase mb-8 ${themeTokens.fontHeadingClass}`}>{title}</h2>
              <div className={`prose prose-lg text-black font-bold ${themeTokens.fontBodyClass}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
            <div>
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-square border-[6px] border-black shadow-[12px_12px_0px_#F97316] bg-white" className="object-cover" />}
            </div>
          </div>
        </section>
      );

    default: // Fallback generic
      return (
        <section id="about" className="py-24 bg-brand/5 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-8">{title}</h2>
            <div className="prose mx-auto"><div dangerouslySetInnerHTML={{ __html: content }} /></div>
          </div>
        </section>
      );
  }
}
