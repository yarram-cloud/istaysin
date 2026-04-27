'use client';
import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ThemedHero({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const headline = config.headline || `Welcome to ${property.name}`;
  const subheadline = config.subheadline || property.description || property.tagline;
  const buttonText = config.buttonText || 'Book Now';
  const radius = themeTokens.radiusClass;
  
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Motion Variants
  const fadeUpStringent = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const } } };
  const straggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <section ref={ref} className="relative min-h-screen flex items-center bg-white overflow-hidden pt-20">
          <div className="max-w-[1400px] mx-auto w-full px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={straggerContainer} initial="hidden" animate="visible" className="z-10 order-2 lg:order-1 pt-12 lg:pt-0">
              <motion.div variants={fadeUpStringent} className="w-24 h-1 bg-black mb-12" />
              <motion.h1 variants={fadeUpStringent} className={`text-7xl md:text-[9rem] font-medium tracking-tighter text-black mb-8 ${themeTokens.fontHeadingClass} leading-[0.85] -ml-1`}>
                {headline}
              </motion.h1>
              <motion.p variants={fadeUpStringent} className={`text-xl md:text-2xl text-gray-500 font-light max-w-lg mb-14 ${themeTokens.fontBodyClass} leading-relaxed`}>
                {subheadline}
              </motion.p>
              <motion.button variants={fadeUpStringent} className={`bg-black text-white px-12 py-5 ${radius} text-xs font-bold uppercase tracking-[0.2em] hover:bg-black/80 hover:px-14 transition-all duration-300`}>
                {buttonText}
              </motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0, clipPath: 'inset(10% 10% 10% 10%)' }} animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] as const }} className="order-1 lg:order-2 h-[60vh] lg:h-[90vh] w-full relative">
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full h-full ${radius} overflow-hidden shadow-2xl`} className="object-cover" />
              ) : <div className={`w-full h-full bg-gray-100 ${radius}`} />}
            </motion.div>
          </div>
        </section>
      );

    case 'luxury-gold':
      return (
        <section ref={ref} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
          {property.heroImage && (
            <motion.div style={{ y: yParallax, opacity: opacityFade }} className="absolute inset-0 z-0">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-40 mix-blend-overlay scale-110" />
            </motion.div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
          
          <motion.div variants={straggerContainer} initial="hidden" animate="visible" className="relative z-20 text-center px-4 max-w-5xl">
            <motion.p variants={fadeUpStringent} className="text-amber-500 tracking-[0.4em] uppercase text-xs mb-8 font-medium">Exquisite Living</motion.p>
            <motion.h1 variants={fadeUpStringent} className={`text-7xl md:text-[8rem] text-white font-serif font-light tracking-tight mb-10 leading-[0.9] ${themeTokens.fontHeadingClass}`} style={{ textShadow: '0 20px 60px rgba(255,215,0,0.15)' }}>
              {headline}
            </motion.h1>
            <motion.div variants={fadeUpStringent} className="w-px h-32 bg-gradient-to-b from-amber-500/50 to-transparent mx-auto mb-10" />
            <motion.p variants={fadeUpStringent} className={`text-2xl text-gray-300 font-light max-w-3xl mx-auto mb-16 leading-relaxed ${themeTokens.fontBodyClass}`}>
              {subheadline}
            </motion.p>
            <motion.button variants={fadeUpStringent} className="border border-brand text-brand hover:bg-brand hover:text-black px-12 py-4 uppercase tracking-[0.2em] transition-all duration-700 bg-black/50 backdrop-blur-sm">
              {buttonText}
            </motion.button>
          </motion.div>
        </section>
      );

    case 'nature-eco':
      return (
        <section ref={ref} className="relative min-h-[95vh] flex items-end pb-24 px-6 md:px-12 bg-green-950 overflow-hidden">
          {property.heroImage && (
            <motion.div style={{ y: yParallax }} className="absolute inset-0 z-0">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover opacity-80" />
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: 50, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, y: 0, backdropFilter: 'blur(20px)' }} transition={{ duration: 1.2, delay: 0.2 }} 
            className={`relative z-10 bg-white/10 border border-white/20 p-10 md:p-16 max-w-3xl ${radius} shadow-2xl`}>
            <h1 className={`text-5xl md:text-7xl text-white mb-6 font-medium tracking-tight ${themeTokens.fontHeadingClass}`}>{headline}</h1>
            <p className={`text-lg text-green-50 mb-10 leading-relaxed font-light ${themeTokens.fontBodyClass}`}>{subheadline}</p>
            <button className={`bg-white text-green-950 px-8 py-4 ${radius} font-semibold hover:bg-green-50 transition-colors`}>{buttonText}</button>
          </motion.div>
        </section>
      );

    case 'boutique-chic':
      return (
        <section ref={ref} className="relative min-h-screen bg-[#FDFBF7] flex items-center pt-20">
          <div className="max-w-[1400px] mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
             <div className="lg:col-span-5 relative z-20">
                <motion.div variants={straggerContainer} initial="hidden" animate="visible" className={`bg-white p-14 lg:p-20 shadow-[40px_40px_0px_var(--brand-color-rgb)] ${radius} border border-gray-100 flex flex-col justify-center`}>
                   <motion.h1 variants={fadeUpStringent} className={`text-6xl lg:text-[5.5rem] text-gray-900 mb-8 leading-[0.9] tracking-tight ${themeTokens.fontHeadingClass}`}>{headline}</motion.h1>
                   <motion.p variants={fadeUpStringent} className={`text-xl text-gray-500 mb-10 max-w-md leading-relaxed font-light ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
                   <motion.button variants={fadeUpStringent} className={`bg-brand text-white px-10 py-5 ${radius} font-bold tracking-widest uppercase text-sm shadow-xl shadow-brand/20 hover:bg-black transition-colors self-start`}>{buttonText}</motion.button>
                </motion.div>
             </div>
             <div className="lg:col-span-7 relative z-10 mt-12 lg:mt-0 lg:-ml-32">
                <motion.div initial={{ opacity: 0, x: 50, rotate: 2 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 1.5, type: 'spring' }} className="ml-auto w-full lg:w-[110%]">
                  {property.heroImage ? (
                    <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full aspect-[3/4] lg:aspect-[4/5] ${radius} shadow-2xl overflow-hidden`} className="object-cover" />
                  ) : <div className={`w-full aspect-[4/5] bg-gray-200 ${radius}`} />}
                </motion.div>
             </div>
          </div>
        </section>
      );

    case 'dark-elegance':
      return (
        <section ref={ref} className="relative min-h-[100vh] flex items-center justify-center bg-black overflow-hidden">
          <motion.div style={{ scale: useTransform(scrollYProgress, [0, 1], [1, 1.1]) }} className="absolute inset-0 z-0 opacity-50">
            {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full grayscale" className="object-cover" />}
          </motion.div>
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 mix-blend-difference text-white">
            <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2, ease: 'easeOut' }} 
              className={`text-[8vw] font-black uppercase text-center leading-[0.85] tracking-tighter ${themeTokens.fontHeadingClass}`}>
              {headline}
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 2 }} className="mt-12 flex flex-col items-center">
              <p className={`text-xl max-w-lg text-center mb-8 font-light ${themeTokens.fontBodyClass}`}>{subheadline}</p>
              <button className="text-white border-b-2 border-white pb-1 font-bold tracking-widest hover:text-gray-300 hover:border-gray-300 transition-colors uppercase">{buttonText}</button>
            </motion.div>
          </div>
        </section>
      );

    case 'playful-vibrant':
      return (
        <section ref={ref} className="relative min-h-[90vh] bg-surface-50 flex items-center justify-center overflow-hidden pt-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }} className="absolute -top-[40%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: 'linear' }} className="absolute -bottom-[40%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
          
          <div className="max-w-[1200px] mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div variants={straggerContainer} initial="hidden" animate="visible">
              <motion.div variants={fadeUpStringent} className="inline-block bg-white text-brand px-4 py-1.5 rounded-full font-black text-sm tracking-widest shadow-sm mb-8 border border-surface-200 uppercase">Discover Now</motion.div>
              <motion.h1 variants={fadeUpStringent} className={`text-6xl md:text-8xl font-black text-surface-950 mb-6 drop-shadow-sm ${themeTokens.fontHeadingClass} leading-[0.95]`}>{headline}</motion.h1>
              <motion.p variants={fadeUpStringent} className={`text-xl text-surface-600 mb-10 max-w-md ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
              <motion.button variants={fadeUpStringent} className={`bg-brand text-white px-10 py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-brand/40 hover:scale-105 transition-transform`}>{buttonText}</motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 100, rotate: -5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 1.5 }}>
              {property.heroImage ? (
                <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full aspect-square rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-white bg-white`} className="object-cover" />
              ) : <div className="w-full aspect-square bg-white rounded-[3rem] shadow-2xl" />}
            </motion.div>
          </div>
        </section>
      );

    case 'corporate-trust':
      return (
        <section ref={ref} className="relative min-h-[80vh] flex items-center bg-[#F8FAFC]">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-brand/5" />
           <div className="max-w-[1400px] mx-auto w-full px-8 py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
              <div className="lg:col-span-5 flex flex-col justify-center">
                 <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className={`text-5xl md:text-6xl font-bold text-blue-950 mb-6 ${themeTokens.fontHeadingClass}`}>{headline}</motion.h1>
                 <motion.p initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className={`text-lg text-slate-600 mb-10 ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
                 <motion.button initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className={`bg-brand text-white px-8 py-4 ${radius} font-semibold shadow-md self-start`}>{buttonText}</motion.button>
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
        <section ref={ref} className="relative min-h-screen flex items-center justify-center bg-[#fdfaf5] overflow-hidden border-[16px] border-[#f4eee0]">
          {property.heroImage && (
            <motion.div style={{ y: yParallax }} className="absolute inset-0 z-0 opacity-20">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full sepia-[0.3]" className="object-cover" />
            </motion.div>
          )}
          <motion.div variants={straggerContainer} initial="hidden" animate="visible" className="relative z-10 text-center max-w-4xl px-8 py-20 bg-white/60 backdrop-blur-md border border-[#e8dfc8] shadow-2xl">
             <motion.div variants={fadeUpStringent} className="w-16 h-px bg-yellow-800 mx-auto mb-8" />
             <motion.h1 variants={fadeUpStringent} className={`text-6xl md:text-8xl text-yellow-950 mb-6 font-serif ${themeTokens.fontHeadingClass}`}>{headline}</motion.h1>
             <motion.div variants={fadeUpStringent} className="w-16 h-px bg-yellow-800 mx-auto mb-8" />
             <motion.p variants={fadeUpStringent} className={`text-xl text-yellow-900/80 mb-12 font-serif italic ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
             <motion.button variants={fadeUpStringent} className="bg-transparent border border-yellow-800 text-yellow-900 hover:bg-yellow-800 hover:text-white px-10 py-4 uppercase tracking-[0.2em] text-sm transition-colors">{buttonText}</motion.button>
          </motion.div>
        </section>
      );

    case 'retro-vintage':
      return (
        <section ref={ref} className="relative min-h-[90vh] flex items-center bg-[#E5E0D8]">
           <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
           <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-[#DF5339] border-[6px] border-black p-10 md:p-16 shadow-[16px_16px_0px_#000]">
                 <h1 className={`text-6xl font-black text-black uppercase leading-none mb-6 ${themeTokens.fontHeadingClass}`}>{headline}</h1>
                 <p className={`text-lg text-black font-semibold mb-10 ${themeTokens.fontBodyClass}`}>{subheadline}</p>
                 <button className="bg-[#F2B94A] border-4 border-black text-black px-8 py-3 text-xl font-black uppercase hover:-translate-y-2 hover:shadow-[8px_8px_0px_#000] transition-all">{buttonText}</button>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="border-[6px] border-black shadow-[16px_16px_0px_#000] bg-white h-[600px] overflow-hidden">
                {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover grayscale contrast-125" />}
              </motion.div>
           </div>
        </section>
      );

    case 'resort-tropical':
      return (
        <section ref={ref} className="relative min-h-[100vh] flex items-center overflow-hidden">
          {property.heroImage && (
            <div className="absolute inset-0 z-0">
               <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover scale-105" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-transparent z-10" />
          <div className="relative z-20 max-w-[1400px] mx-auto w-full px-8 py-32 text-white">
             <motion.h1 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className={`text-7xl md:text-9xl font-black mb-6 drop-shadow-2xl max-w-4xl leading-[0.9] ${themeTokens.fontHeadingClass}`}>{headline}</motion.h1>
             <motion.p initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }} className={`text-2xl mb-12 max-w-xl text-teal-50 drop-shadow-lg ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
             <motion.button initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className={`bg-[#FF9F1C] text-white hover:bg-white hover:text-teal-900 px-10 py-5 ${radius} text-xl font-bold uppercase tracking-wider shadow-2xl transition-all`}>{buttonText}</motion.button>
          </div>
        </section>
      );

    case 'compact-urban':
      return (
        <section ref={ref} className="relative min-h-[85vh] bg-[#111] flex items-end pb-12 pt-32 px-4 md:px-8">
           <div className="absolute inset-0 z-0 opacity-40">
             {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName="w-full h-full" className="object-cover object-top" />}
             <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent" />
           </div>
           <motion.div variants={straggerContainer} initial="hidden" animate="visible" className="relative z-10 w-full max-w-6xl mx-auto">
              <motion.h1 variants={fadeUpStringent} className={`text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight ${themeTokens.fontHeadingClass}`}>{headline}</motion.h1>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-t border-white/20 pt-8">
                 <motion.p variants={fadeUpStringent} className={`text-lg text-gray-400 max-w-2xl ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
                 <motion.button variants={fadeUpStringent} className={`bg-white text-black px-8 py-4 font-bold ${radius} hover:bg-brand hover:text-white transition-colors whitespace-nowrap`}>{buttonText}</motion.button>
              </div>
           </motion.div>
        </section>
      );

    case 'abstract-art':
      return (
        <section ref={ref} className="relative min-h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
           <motion.div style={{ y: yParallax, rotate: 15 }} className="absolute -left-[10%] top-[10%] w-[40vw] h-[60vw] bg-pink-400 mix-blend-multiply rounded-[100px] blur-3xl opacity-50 pointer-events-none" />
           <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]), rotate: -10 }} className="absolute -right-[10%] bottom-[10%] w-[50vw] h-[50vw] bg-yellow-400 mix-blend-multiply rounded-[100px] blur-3xl opacity-50 pointer-events-none" />
           
           <div className="relative z-10 text-center max-w-5xl px-6">
              <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, type: 'spring' }} className={`text-7xl md:text-[8rem] font-black tracking-tighter text-gray-900 mb-8 leading-[0.8] mix-blend-overlay ${themeTokens.fontHeadingClass}`}>{headline}</motion.h1>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="relative mx-auto w-[300px] h-[400px] md:w-[600px] md:h-[400px] mb-12">
                 {property.heroImage && <SafeNextImage src={property.heroImage} alt="Hero" containerClassName={`w-full h-full ${radius} border-8 border-white shadow-2xl overflow-hidden rotate-2`} className="object-cover" />}
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className={`text-2xl text-gray-700 font-medium max-w-2xl mx-auto mb-10 ${themeTokens.fontBodyClass}`}>{subheadline}</motion.p>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1 }} className={`bg-gray-900 text-white px-12 py-5 font-black text-xl hover:bg-brand transition-colors ${radius} shadow-xl transform hover:-rotate-2`}>{buttonText}</motion.button>
           </div>
        </section>
      );

    default: // Fallback generic — uses the brand-gradient utility so secondaryColor is visibly consumed.
      return (
        <section className="relative min-h-[80vh] flex items-center justify-center bg-brand/10">
           <div className="text-center">
              <h1 className="text-6xl font-bold mb-4 brand-gradient-text">{headline}</h1>
              <p className="text-xl mb-8">{subheadline}</p>
              <button className="brand-gradient-bg text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow">{buttonText}</button>
           </div>
        </section>
      );
  }
}
