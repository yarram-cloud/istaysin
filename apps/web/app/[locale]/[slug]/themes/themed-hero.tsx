'use client';
import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';

export default function ThemedHero({ config, property, themeTokens, locale, propertySlug }: { config: any, property: any, themeTokens: ThemeStyleMap, locale: string, propertySlug: string }) {
  const headline = config.headline || `Welcome to ${property.name}`;
  const subheadline = config.subheadline || property.description || property.tagline;
  const buttonText = config.buttonText || 'Book Now';
  const radius = themeTokens.radiusClass;
  const bookHref = `/${locale}/${propertySlug}/book`;

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <section className="relative min-h-screen flex items-center bg-white overflow-hidden pt-20">
          <div className="max-w-[1400px] mx-auto w-full px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="z-10 order-2 lg:order-1 pt-12 lg:pt-0">
              <div className="w-24 h-1 bg-black mb-12" />
              <h1 className={`text-7xl md:text-[9rem] font-medium tracking-tighter text-black mb-8 ${themeTokens.fontHeadingClass} leading-[0.85] -ml-1`}>
                {headline}
              </h1>
              <p className={`text-xl md:text-2xl text-gray-500 font-light max-w-lg mb-14 ${themeTokens.fontBodyClass} leading-relaxed`}>
                {subheadline}
              </p>
              <a href={bookHref} className={`bg-black text-white px-12 py-5 ${radius} text-xs font-bold uppercase tracking-[0.2em] hover:bg-black/80 hover:px-14 transition-all duration-300`}>
                {buttonText}
              </a>
            </div>
            <div className="order-1 lg:order-2 h-[60vh] lg:h-[90vh] w-full relative">
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full h-full ${radius} overflow-hidden shadow-2xl`} className="object-cover" />
              ) : <div className={`w-full h-full bg-gray-100 ${radius}`} />}
            </div>
          </div>
        </section>
      );

    case 'luxury-gold':
      return (
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-40 mix-blend-overlay scale-110" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
          
          <div className="relative z-20 text-center px-4 max-w-5xl">
            <p className="text-amber-500 tracking-[0.4em] uppercase text-xs mb-8 font-medium">Exquisite Living</p>
            <h1 className={`text-7xl md:text-[8rem] text-white font-serif font-light tracking-tight mb-10 leading-[0.9] ${themeTokens.fontHeadingClass}`}>
              {headline}
            </h1>
            <div className="w-px h-32 bg-gradient-to-b from-amber-500/50 to-transparent mx-auto mb-10" />
            <p className={`text-2xl text-gray-300 font-light max-w-3xl mx-auto mb-16 leading-relaxed ${themeTokens.fontBodyClass}`}>
              {subheadline}
            </p>
            <a href={bookHref} className="border border-brand text-brand hover:bg-brand hover:text-black px-12 py-4 uppercase tracking-[0.2em] transition-all duration-700 bg-black/50 backdrop-blur-sm">
              {buttonText}
            </a>
          </div>
        </section>
      );

    case 'nature-eco':
      return (
        <section className="relative min-h-[95vh] flex items-end pb-24 px-6 md:px-12 bg-green-950 overflow-hidden">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-80" />
            </div>
          )}
          <div 
            className={`relative z-10 bg-white/10 border border-white/20 p-10 md:p-16 max-w-3xl ${radius} shadow-2xl`}>
            <h1 className={`text-5xl md:text-7xl text-white mb-6 font-medium tracking-tight ${themeTokens.fontHeadingClass}`}>{headline}</h1>
            <p className={`text-lg text-green-50 mb-10 leading-relaxed font-light ${themeTokens.fontBodyClass}`}>{subheadline}</p>
            <a href={bookHref} className={`bg-white text-green-950 px-8 py-4 ${radius} font-semibold hover:bg-green-50 transition-colors`}>{buttonText}</a>
          </div>
        </section>
      );

    case 'boutique-chic':
      return (
        <section className="relative min-h-screen bg-[#FDFBF7] flex items-center pt-20">
          <div className="max-w-[1400px] mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
             <div className="lg:col-span-5 relative z-20">
                <div className={`bg-white p-14 lg:p-20 shadow-[40px_40px_0px_var(--brand-color)] ${radius} border border-gray-100 flex flex-col justify-center`}>
                   <h1 className={`text-6xl lg:text-[5.5rem] text-gray-900 mb-8 leading-[0.9] tracking-tight ${themeTokens.fontHeadingClass}`}>{headline}</h1>
                   <p className={`text-xl text-gray-500 mb-10 max-w-md leading-relaxed font-light ${themeTokens.fontBodyClass}`}>{subheadline}</p>
                   <a href={bookHref} className={`bg-brand text-white px-10 py-5 ${radius} font-bold tracking-widest uppercase text-sm shadow-xl shadow-brand/20 hover:bg-black transition-colors self-start`}>{buttonText}</a>
                </div>
             </div>
             <div className="lg:col-span-7 relative z-10 mt-12 lg:mt-0 lg:-ml-32">
                <div className="ml-auto w-full lg:w-[110%]">
                  {property.heroImage ? (
                    <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full aspect-[3/4] lg:aspect-[4/5] ${radius} shadow-2xl overflow-hidden`} className="object-cover" />
                  ) : <div className={`w-full aspect-[4/5] bg-gray-200 ${radius}`} />}
                </div>
             </div>
          </div>
        </section>
      );

    case 'dark-elegance':
      return (
        <section className="relative min-h-[100vh] flex items-center justify-center bg-black overflow-hidden">
          <div className="absolute inset-0 z-0">
            {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full grayscale" className="object-cover opacity-30" />}
          </div>
          {/* Dark gradient overlay ensures text is always readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40 z-[1]" />
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 text-white">
            <h1 
              className={`text-[8vw] font-black uppercase text-center leading-[0.85] tracking-tighter ${themeTokens.fontHeadingClass}`}>
              {headline}
            </h1>
            <div className="mt-12 flex flex-col items-center">
              <p className={`text-xl max-w-lg text-center mb-8 font-light text-gray-300 ${themeTokens.fontBodyClass}`}>{subheadline}</p>
              <a href={bookHref} className="text-white border-b-2 border-white pb-1 font-bold tracking-widest hover:text-gray-300 hover:border-gray-300 transition-colors uppercase">{buttonText}</a>
            </div>
          </div>
        </section>
      );

    case 'playful-vibrant':
      return (
        <section className="relative min-h-[90vh] bg-surface-50 flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute -top-[40%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-[40%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
          
          <div className="max-w-[1200px] mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <div className="inline-block bg-white text-brand px-4 py-1.5 rounded-full font-black text-sm tracking-widest shadow-sm mb-8 border border-surface-200 uppercase">Discover Now</div>
              <h1 className={`text-6xl md:text-8xl font-black text-surface-950 mb-6 drop-shadow-sm ${themeTokens.fontHeadingClass} leading-[0.95]`}>{headline}</h1>
              <p className={`text-xl text-surface-600 mb-10 max-w-md ${themeTokens.fontBodyClass}`}>{subheadline}</p>
              <a href={bookHref} className={`bg-brand text-white px-10 py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-brand/40 hover:scale-105 transition-transform`}>{buttonText}</a>
            </div>
            <div>
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full aspect-square rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-white bg-white`} className="object-cover" />
              ) : <div className="w-full aspect-square bg-white rounded-[3rem] shadow-2xl" />}
            </div>
          </div>
        </section>
      );

    case 'corporate-trust':
      return (
        <section className="relative min-h-[80vh] flex items-center bg-[#F8FAFC]">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-brand/5" />
           <div className="max-w-[1400px] mx-auto w-full px-8 py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
              <div className="lg:col-span-5 flex flex-col justify-center">
                 <h1 className={`text-5xl md:text-6xl font-bold text-blue-950 mb-6 ${themeTokens.fontHeadingClass}`}>{headline}</h1>
                 <p className={`text-lg text-slate-600 mb-10 ${themeTokens.fontBodyClass}`}>{subheadline}</p>
                 <a href={bookHref} className={`bg-brand text-white px-8 py-4 ${radius} font-semibold shadow-md self-start`}>{buttonText}</a>
              </div>
              <div className="lg:col-span-7">
                {property.heroImage ? (
                  <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full h-[600px] ${radius} shadow-xl overflow-hidden`} className="object-cover" />
                ) : <div className={`w-full h-[600px] bg-slate-200 ${radius}`} />}
              </div>
           </div>
        </section>
      );

    case 'classic-heritage':
      return (
        <section className="relative min-h-screen flex items-center justify-center bg-[#fdfaf5] overflow-hidden border-[16px] border-[#f4eee0]">
          {property.heroImage && (
            <div className="absolute inset-0 z-0 opacity-20">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full sepia-[0.3]" className="object-cover" />
            </div>
          )}
          <div className="relative z-10 text-center max-w-4xl px-8 py-20 bg-white/60 backdrop-blur-md border border-[#e8dfc8] shadow-2xl">
             <div className="w-16 h-px bg-yellow-800 mx-auto mb-8" />
             <h1 className={`text-6xl md:text-8xl text-yellow-950 mb-6 font-serif ${themeTokens.fontHeadingClass}`}>{headline}</h1>
             <div className="w-16 h-px bg-yellow-800 mx-auto mb-8" />
             <p className={`text-xl text-yellow-900/80 mb-12 font-serif italic ${themeTokens.fontBodyClass}`}>{subheadline}</p>
             <a href={bookHref} className="bg-transparent border border-yellow-800 text-yellow-900 hover:bg-yellow-800 hover:text-white px-10 py-4 uppercase tracking-[0.2em] text-sm transition-colors">{buttonText}</a>
          </div>
        </section>
      );

    case 'retro-vintage':
      return (
        <section className="relative min-h-[90vh] flex items-center bg-[#E5E0D8]">
           <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
           <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="bg-[#DF5339] border-[6px] border-black p-10 md:p-16 shadow-[16px_16px_0px_#000]">
                 <h1 className={`text-6xl font-black text-black uppercase leading-none mb-6 ${themeTokens.fontHeadingClass}`}>{headline}</h1>
                 <p className={`text-lg text-black font-semibold mb-10 ${themeTokens.fontBodyClass}`}>{subheadline}</p>
                 <a href={bookHref} className="bg-[#F2B94A] border-4 border-black text-black px-8 py-3 text-xl font-black uppercase hover:-translate-y-2 hover:shadow-[8px_8px_0px_#000] transition-all">{buttonText}</a>
              </div>
              <div className="border-[6px] border-black shadow-[16px_16px_0px_#000] bg-white h-[600px] overflow-hidden">
                {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover grayscale contrast-125" />}
              </div>
           </div>
        </section>
      );

    case 'resort-tropical':
      return (
        <section className="relative min-h-[100vh] flex items-center overflow-hidden">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover scale-105" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-transparent z-10" />
          <div className="relative z-20 max-w-[1400px] mx-auto w-full px-8 py-32 text-white">
             <h1 className={`text-7xl md:text-9xl font-black mb-6 drop-shadow-2xl max-w-4xl leading-[0.9] ${themeTokens.fontHeadingClass}`}>{headline}</h1>
             <p className={`text-2xl mb-12 max-w-xl text-teal-50 drop-shadow-lg ${themeTokens.fontBodyClass}`}>{subheadline}</p>
             <a href={bookHref} className={`bg-[#FF9F1C] text-white hover:bg-white hover:text-teal-900 px-10 py-5 ${radius} text-xl font-bold uppercase tracking-wider shadow-2xl transition-all`}>{buttonText}</a>
          </div>
        </section>
      );

    case 'compact-urban':
      return (
        <section className="relative min-h-[85vh] bg-[#111] flex items-end pb-12 pt-32 px-4 md:px-8">
           <div className="absolute inset-0 z-0 opacity-40">
             {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover object-top" />}
             <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent" />
           </div>
           <div className="relative z-10 w-full max-w-6xl mx-auto">
              <h1 className={`text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight ${themeTokens.fontHeadingClass}`}>{headline}</h1>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-t border-white/20 pt-8">
                 <p className={`text-lg text-gray-400 max-w-2xl ${themeTokens.fontBodyClass}`}>{subheadline}</p>
                 <a href={bookHref} className={`bg-white text-black px-8 py-4 font-bold ${radius} hover:bg-brand hover:text-white transition-colors whitespace-nowrap`}>{buttonText}</a>
              </div>
           </div>
        </section>
      );

    case 'abstract-art':
      return (
        <section className="relative min-h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
           <div className="absolute -left-[10%] top-[10%] w-[40vw] h-[60vw] bg-pink-400 mix-blend-multiply rounded-[100px] blur-3xl opacity-50 pointer-events-none" />
           <div className="absolute -right-[10%] bottom-[10%] w-[50vw] h-[50vw] bg-yellow-400 mix-blend-multiply rounded-[100px] blur-3xl opacity-50 pointer-events-none" />
           
           <div className="relative z-10 text-center max-w-5xl px-6">
              <h1 className={`text-7xl md:text-[8rem] font-black tracking-tighter text-gray-900 mb-8 leading-[0.8] mix-blend-overlay ${themeTokens.fontHeadingClass}`}>{headline}</h1>
              <div className="relative mx-auto w-[300px] h-[400px] md:w-[600px] md:h-[400px] mb-12">
                 {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full h-full ${radius} border-8 border-white shadow-2xl overflow-hidden rotate-2`} className="object-cover" />}
              </div>
              <p className={`text-2xl text-gray-700 font-medium max-w-2xl mx-auto mb-10 ${themeTokens.fontBodyClass}`}>{subheadline}</p>
              <a href={bookHref} className={`bg-gray-900 text-white px-12 py-5 font-black text-xl hover:bg-brand transition-colors ${radius} shadow-xl transform hover:-rotate-2`}>{buttonText}</a>
           </div>
        </section>
      );

    case 'scandinavian-frost':
      return (
        <section className="relative min-h-screen flex items-center bg-[#F8FAFC] overflow-hidden pt-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-sky-50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-gradient-to-bl from-sky-100/60 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
          <div className="max-w-[1400px] mx-auto w-full px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <div className="w-12 h-[2px] bg-slate-300 mb-10" />
              <h1 className={`text-6xl md:text-8xl font-extralight tracking-tight text-slate-800 mb-8 ${themeTokens.fontHeadingClass} leading-[0.95]`}>
                {headline}
              </h1>
              <p className={`text-xl text-slate-400 font-light max-w-lg mb-12 leading-relaxed ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
              <a href={bookHref} className={`bg-slate-800 text-white px-10 py-4 ${radius} font-medium tracking-wide hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20`}>
                {buttonText}
              </a>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-sky-100/50 to-slate-100/50 rounded-[2rem] -rotate-2" />
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full aspect-[4/5] ${radius} overflow-hidden shadow-2xl shadow-slate-300/50 relative z-10`} className="object-cover" />
              ) : <div className={`w-full aspect-[4/5] bg-gradient-to-br from-slate-100 to-sky-50 ${radius} relative z-10`} />}
            </div>
          </div>
        </section>
      );

    case 'art-deco-glam':
      return (
        <section className="relative min-h-screen flex items-center justify-center bg-[#0D0D0D] overflow-hidden">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
              <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-20 sepia-[0.3]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-transparent z-[1]" />
          {/* Art Deco geometric accents */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-20" />
          <div className="relative z-10 text-center px-6 max-w-5xl">
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="w-24 h-px bg-[#D4AF37]" />
              <div className="w-3 h-3 border border-[#D4AF37] rotate-45" />
              <div className="w-24 h-px bg-[#D4AF37]" />
            </div>
            <p className="text-[#D4AF37] tracking-[0.5em] uppercase text-xs mb-6 font-medium">Grand Experience</p>
            <h1 className={`text-7xl md:text-[8rem] text-white font-bold tracking-tight mb-8 leading-[0.85] ${themeTokens.fontHeadingClass}`}>
              {headline}
            </h1>
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="w-16 h-px bg-[#D4AF37]/50" />
              <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
              <div className="w-16 h-px bg-[#D4AF37]/50" />
            </div>
            <p className={`text-xl text-gray-400 font-light max-w-2xl mx-auto mb-14 ${themeTokens.fontBodyClass}`}>
              {subheadline}
            </p>
            <a href={bookHref} className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-12 py-4 uppercase tracking-[0.3em] text-sm font-bold transition-all duration-500">
              {buttonText}
            </a>
          </div>
        </section>
      );

    case 'japanese-zen':
      return (
        <section className="relative min-h-screen flex items-end bg-[#F5F0EB] overflow-hidden pb-20 pt-32">
          <div className="absolute top-20 right-12 w-[1px] h-[40vh] bg-[#8B7355]/20" />
          <div className="absolute top-20 right-16 flex flex-col gap-4 items-center">
            {['Z','E','N'].map((ch,i) => <span key={i} className="text-[#8B7355]/20 text-xs tracking-widest font-light">{ch}</span>)}
          </div>
          <div className="max-w-[1400px] mx-auto w-full px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end relative z-10">
            <div className="lg:col-span-5 pb-12">
              <div className="w-16 h-[1px] bg-[#8B7355]/40 mb-12" />
              <h1 className={`text-5xl md:text-7xl font-extralight text-[#3D3028] mb-8 tracking-tight leading-[1.1] ${themeTokens.fontHeadingClass}`}>
                {headline}
              </h1>
              <p className={`text-lg text-[#8B7355] font-light max-w-md mb-12 leading-relaxed ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
              <a href={bookHref} className={`bg-[#3D3028] text-[#F5F0EB] px-10 py-4 ${radius} font-light tracking-widest uppercase text-sm hover:bg-[#8B7355] transition-colors`}>
                {buttonText}
              </a>
            </div>
            <div className="lg:col-span-7">
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full aspect-[5/4] overflow-hidden shadow-2xl" className="object-cover" />
              ) : <div className="w-full aspect-[5/4] bg-gradient-to-br from-[#E8DFD5] to-[#D4C8BA]" />}
            </div>
          </div>
        </section>
      );

    case 'mediterranean-sun':
      return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FFF7ED]">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
              <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFF7ED] via-[#FFF7ED]/40 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF7ED]/80 to-transparent z-[2]" />
          <div className="relative z-10 max-w-[1400px] mx-auto w-full px-8 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-[#C2410C]/10 text-[#C2410C] px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8">Escape to Paradise</div>
              <h1 className={`text-6xl md:text-8xl font-bold text-[#431407] mb-8 leading-[0.9] ${themeTokens.fontHeadingClass}`}>
                {headline}
              </h1>
              <p className={`text-xl text-[#9A3412]/70 font-light max-w-lg mb-12 leading-relaxed ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
              <a href={bookHref} className={`bg-[#C2410C] text-white px-10 py-5 ${radius} font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors shadow-xl shadow-[#C2410C]/30`}>
                {buttonText}
              </a>
            </div>
          </div>
        </section>
      );

    case 'industrial-loft':
      return (
        <section className="relative min-h-[95vh] flex items-end bg-[#1C1917] overflow-hidden pb-16 pt-32">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
              <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-30 contrast-125" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/60 to-transparent z-[1]" />
          {/* Industrial grid overlay */}
          <div className="absolute inset-0 z-[2] opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="relative z-10 max-w-[1400px] mx-auto w-full px-8">
            <div className="flex items-end gap-4 mb-6">
              <span className="text-[#78716C] font-mono text-xs tracking-widest uppercase">EST. —</span>
              <div className="w-16 h-px bg-[#78716C]" />
            </div>
            <h1 className={`text-6xl md:text-[8rem] font-black text-white mb-6 leading-[0.85] tracking-tighter uppercase ${themeTokens.fontHeadingClass}`}>
              {headline}
            </h1>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-stone-700 pt-8 mt-8">
              <p className={`text-lg text-stone-400 max-w-xl font-light ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
              <a href={bookHref} className={`border-2 border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-black px-10 py-4 font-bold uppercase tracking-widest transition-all whitespace-nowrap`}>
                {buttonText}
              </a>
            </div>
          </div>
        </section>
      );

    case 'royal-palace':
      return (
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A0533] via-[#0F0320] to-[#0A0118] overflow-hidden">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
              <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-25 mix-blend-luminosity" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0118] via-transparent to-[#0A0118]/50 z-[1]" />
          {/* Regal decorative borders */}
          <div className="absolute top-8 left-8 right-8 bottom-8 border border-[#7E22CE]/20 z-[2] pointer-events-none" />
          <div className="absolute top-12 left-12 right-12 bottom-12 border border-[#7E22CE]/10 z-[2] pointer-events-none" />
          <div className="relative z-10 text-center px-6 max-w-5xl">
            <div className="flex justify-center mb-8">
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#7E22CE] to-transparent" />
            </div>
            <p className="text-purple-300/80 tracking-[0.4em] uppercase text-xs mb-8 font-medium">Royal Experience</p>
            <h1 className={`text-7xl md:text-[9rem] text-white font-light mb-10 leading-[0.85] tracking-tight ${themeTokens.fontHeadingClass}`}>
              {headline}
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mb-10" />
            <p className={`text-xl text-purple-200/60 font-light max-w-2xl mx-auto mb-16 leading-relaxed ${themeTokens.fontBodyClass}`}>
              {subheadline}
            </p>
            <a href={bookHref} className="bg-[#7E22CE] text-white hover:bg-purple-500 px-14 py-5 font-semibold uppercase tracking-[0.2em] transition-all shadow-2xl shadow-purple-900/50">
              {buttonText}
            </a>
          </div>
        </section>
      );

    case 'coastal-breeze':
      return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-sky-50 via-white to-cyan-50 pt-20">
          <div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-sky-100/50 to-transparent pointer-events-none" />
          <div className="max-w-[1400px] mx-auto w-full px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-3 mb-10">
                <div className="w-10 h-[2px] bg-sky-400" />
                <span className="text-sky-500 text-xs font-bold tracking-[0.2em] uppercase">Seaside Haven</span>
              </div>
              <h1 className={`text-6xl md:text-8xl font-bold text-slate-800 mb-8 leading-[0.9] ${themeTokens.fontHeadingClass}`}>
                {headline}
              </h1>
              <p className={`text-xl text-slate-500 font-light max-w-lg mb-12 leading-relaxed ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
              <a href={bookHref} className={`bg-sky-600 text-white px-10 py-5 ${radius} font-bold shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition-colors`}>
                {buttonText}
              </a>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-sky-200/40 to-cyan-200/40 rounded-[3rem] rotate-2" />
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-sky-900/20 relative z-10 border-4 border-white`} className="object-cover" />
              ) : <div className={`w-full aspect-[4/5] bg-gradient-to-br from-sky-100 to-cyan-50 rounded-[2.5rem] relative z-10`} />}
            </div>
          </div>
        </section>
      );

    case 'neo-brutalist':
      return (
        <section className="relative min-h-screen flex items-center bg-[#FFFBEB] overflow-hidden pt-20">
          <div className="max-w-[1400px] mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="bg-[#F97316] border-[6px] border-black p-10 md:p-16 shadow-[12px_12px_0px_#000]">
              <h1 className={`text-6xl md:text-8xl font-black text-black uppercase leading-[0.85] mb-6 ${themeTokens.fontHeadingClass}`}>
                {headline}
              </h1>
              <p className={`text-lg text-black/80 font-bold mb-10 ${themeTokens.fontBodyClass}`}>
                {subheadline}
              </p>
              <a href={bookHref} className="bg-black text-[#F97316] border-4 border-black px-10 py-4 text-xl font-black uppercase hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all">
                {buttonText}
              </a>
            </div>
            <div className="border-[6px] border-black shadow-[12px_12px_0px_#000] bg-white overflow-hidden aspect-square">
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover" />
              ) : <div className="w-full h-full bg-[#FEF3C7]" />}
            </div>
          </div>
        </section>
      );

    default: // Fallback generic — uses the brand-gradient utility so secondaryColor is visibly consumed.
      return (
        <section className="relative min-h-[80vh] flex items-center justify-center bg-brand/10">
           <div className="text-center">
              <h1 className="text-6xl font-bold mb-4 brand-gradient-text">{headline}</h1>
              <p className="text-xl mb-8">{subheadline}</p>
              <a href={bookHref} className="brand-gradient-bg text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow">{buttonText}</a>
           </div>
        </section>
      );
  }
}
