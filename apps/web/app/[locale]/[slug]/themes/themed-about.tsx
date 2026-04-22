'use client';
import { ThemeStyleMap } from './theme-tokens';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ThemedAbout({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');

  if (!config.enabled) return null;
  const content = config.contentHtml || property.description;
  if (!content) return null;

  const title = config.title || t('aboutOurProperty');
  const radius = themeTokens.radiusClass;

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeUpStringent = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } };
  const straggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <section ref={ref} id="about" className="py-32 md:py-48 bg-white relative overflow-hidden text-black">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-16 grid lg:grid-cols-12 gap-16 items-start">
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="lg:col-span-5 space-y-12">
                <motion.div variants={fadeUpStringent} className="w-8 h-1 bg-black" />
                <motion.h2 variants={fadeUpStringent} className={`text-4xl md:text-6xl font-light tracking-tighter ${themeTokens.fontHeadingClass} leading-[1.1]`}>
                  {title}
                </motion.h2>
             </motion.div>
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="lg:col-span-7 space-y-12 lg:pt-24">
                <motion.div variants={fadeUpStringent} className={`prose prose-xl prose-stone font-light text-gray-500 leading-relaxed ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </motion.div>
                {config.image && (
                   <motion.div variants={fadeUpStringent} className="mt-12">
                     <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-video ${radius} overflow-hidden bg-gray-100`} className="object-cover" />
                   </motion.div>
                )}
             </motion.div>
          </div>
        </section>
      );

    case 'luxury-gold':
      return (
        <section ref={ref} id="about" className="py-40 bg-[#0A0A0A] relative border-y border-white/5 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 1.5, ease: "easeOut" }} className="order-2 md:order-1">
              {config.image ? (
                <div className="relative p-4 border border-brand/20">
                   <div className="absolute inset-0 border border-brand/40 scale-105 pointer-events-none" />
                   <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-[3/4] overflow-hidden" className="object-cover hover:scale-110 transition-transform duration-[3s]" />
                </div>
              ) : <div className="w-full aspect-[3/4] border border-brand/20" />}
            </motion.div>
            <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="order-1 md:order-2 space-y-8 relative z-10 text-white">
              <motion.span variants={fadeUpStringent} className="text-brand uppercase tracking-[0.3em] text-xs font-bold">The Vision</motion.span>
              <motion.h2 variants={fadeUpStringent} className={`text-5xl lg:text-7xl font-serif text-white leading-tight ${themeTokens.fontHeadingClass}`}>
                {title}
              </motion.h2>
              <motion.div variants={fadeUpStringent} className={`prose prose-invert prose-lg text-gray-400 font-light ${themeTokens.fontBodyClass}`}>
                 <div dangerouslySetInnerHTML={{ __html: content }} />
              </motion.div>
            </motion.div>
          </div>
        </section>
      );

    case 'nature-eco':
      return (
        <section ref={ref} id="about" className="py-32 bg-[#F6F8F6] relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 flex flex-col lg:flex-row gap-16 items-center">
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="lg:w-1/2 space-y-10">
                <motion.h2 variants={fadeUpStringent} className={`text-5xl md:text-6xl text-green-950 font-medium tracking-tight ${themeTokens.fontHeadingClass}`}>
                  {title}
                </motion.h2>
                <motion.div variants={fadeUpStringent} className={`prose prose-lg text-green-900/70 font-light leading-relaxed ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </motion.div>
             </motion.div>
             <motion.div variants={fadeUpStringent} initial="hidden" animate={isInView ? "visible" : "hidden"} className="lg:w-1/2 relative">
               {config.image && (
                 <div className="relative">
                   <div className="absolute -inset-4 bg-green-900/10 rounded-[4rem] transform -rotate-3" />
                   <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-square rounded-[3rem] shadow-xl overflow-hidden relative z-10" className="object-cover" />
                 </div>
               )}
             </motion.div>
          </div>
        </section>
      );

    case 'boutique-chic':
      return (
        <section ref={ref} id="about" className="py-40 bg-[#FDFBF7] relative">
          <div className="max-w-[1200px] mx-auto px-6">
            <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center max-w-3xl mx-auto mb-20 space-y-6">
               <motion.span variants={fadeUpStringent} className={`text-brand tracking-[0.2em] font-bold text-sm uppercase`}>Concept</motion.span>
               <motion.h2 variants={fadeUpStringent} className={`text-5xl md:text-7xl text-gray-900 leading-none ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
            </motion.div>
            <div className="grid md:grid-cols-12 gap-12 items-center">
               <motion.div initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 1 }} className="md:col-span-5">
                 {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/5] ${radius} shadow-2xl`} className="object-cover" />}
               </motion.div>
               <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 1, delay: 0.2 }} className="md:col-span-7 bg-white p-12 md:p-16 shadow-[20px_20px_0px_var(--brand-color-rgb)] border border-gray-100 z-10 -ml-0 md:-ml-20 mt-10 md:mt-0">
                  <div className={`prose prose-lg text-gray-600 ${themeTokens.fontBodyClass}`}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
               </motion.div>
            </div>
          </div>
        </section>
      );

    case 'dark-elegance':
      return (
        <section ref={ref} id="about" className="py-40 bg-black text-white relative">
          <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-20">
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="space-y-12">
                <motion.h2 variants={fadeUpStringent} className={`text-6xl md:text-[5rem] font-black uppercase tracking-tighter leading-[0.85] ${themeTokens.fontHeadingClass}`}>
                  {title}
                </motion.h2>
                <motion.div variants={fadeUpStringent} className={`prose prose-invert prose-xl font-light text-gray-400 ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </motion.div>
             </motion.div>
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 2 }} className="relative">
                {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full h-full min-h-[500px] grayscale" className="object-cover" />}
             </motion.div>
          </div>
        </section>
      );

    case 'playful-vibrant':
      return (
        <section ref={ref} id="about" className="py-32 bg-white relative overflow-hidden">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} className="absolute -right-[20%] top-[10%] w-[50vw] h-[50vw] bg-brand/10 rounded-[100px] blur-3xl pointer-events-none" />
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div initial={{ opacity: 0, rotate: -5, y: 50 }} animate={isInView ? { opacity: 1, rotate: 0, y: 0 } : {}} transition={{ type: "spring", bounce: 0.5, duration: 1.5 }} className="order-2 md:order-1">
              {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-[4/3] rounded-[3rem] border-8 border-brand/20 shadow-2xl" className="object-cover" />}
            </motion.div>
            <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="order-1 md:order-2 space-y-8">
               <motion.h2 variants={fadeUpStringent} className={`text-5xl md:text-7xl font-black text-gray-900 drop-shadow-sm ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
               <motion.div variants={fadeUpStringent} className={`prose prose-lg text-gray-600 ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
               </motion.div>
            </motion.div>
          </div>
        </section>
      );

    case 'corporate-trust':
      return (
        <section ref={ref} id="about" className="py-32 bg-white border-t border-slate-100">
          <div className="max-w-[1200px] mx-auto px-8 grid md:grid-cols-12 gap-16 items-start">
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="md:col-span-5 sticky top-32 space-y-6">
                <motion.div variants={fadeUpStringent} className="w-16 h-1 bg-brand mb-8" />
                <motion.h2 variants={fadeUpStringent} className={`text-4xl md:text-5xl font-bold text-slate-900 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
             </motion.div>
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="md:col-span-7 space-y-10">
                <motion.div variants={fadeUpStringent} className={`prose prose-lg text-slate-600 ${themeTokens.fontBodyClass}`}>
                   <div dangerouslySetInnerHTML={{ __html: content }} />
                </motion.div>
                {config.image && (
                   <motion.div variants={fadeUpStringent}>
                     <SafeNextImage src={config.image} alt={title} containerClassName={`w-full h-[400px] ${radius} shadow-xl overflow-hidden`} className="object-cover" />
                   </motion.div>
                )}
             </motion.div>
          </div>
        </section>
      );

    case 'classic-heritage':
      return (
        <section ref={ref} id="about" className="py-32 bg-[#fdfaf5] border-t-4 border-[#e8dfc8]">
          <div className="max-w-[1000px] mx-auto px-6 text-center">
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="space-y-10">
                <motion.div variants={fadeUpStringent} className="flex items-center justify-center gap-4">
                  <div className="w-12 h-px bg-yellow-800" />
                  <span className="uppercase tracking-[0.2em] font-serif text-yellow-900 text-sm">About Us</span>
                  <div className="w-12 h-px bg-yellow-800" />
                </motion.div>
                <motion.h2 variants={fadeUpStringent} className={`text-5xl md:text-6xl text-yellow-950 font-serif ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                <motion.div variants={fadeUpStringent} className={`prose prose-xl mx-auto text-yellow-900/80 font-serif italic leading-relaxed ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </motion.div>
                {config.image && (
                   <motion.div variants={fadeUpStringent} className="mt-16 inline-block p-4 bg-white border border-[#e8dfc8] shadow-2xl">
                     <SafeNextImage src={config.image} alt={title} containerClassName="w-[300px] md:w-[600px] aspect-[4/3] sepia-[0.2]" className="object-cover" />
                   </motion.div>
                )}
             </motion.div>
          </div>
        </section>
      );

    case 'retro-vintage':
      return (
        <section ref={ref} id="about" className="py-32 bg-[#F2B94A] border-t-[6px] border-black">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
             <motion.div initial={{ opacity: 0, x: -50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="bg-white border-[6px] border-black p-10 shadow-[16px_16px_0px_#000]">
                <h2 className={`text-5xl font-black text-black uppercase mb-8 ${themeTokens.fontHeadingClass}`}>{title}</h2>
                <div className={`prose prose-lg text-black font-semibold ${themeTokens.fontBodyClass}`}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, x: 50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 }}>
                {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full aspect-square border-[6px] border-black shadow-[16px_16px_0px_#000] rotate-2 bg-white" className="object-cover grayscale contrast-125" />}
             </motion.div>
          </div>
        </section>
      );

    case 'resort-tropical':
      return (
        <section ref={ref} id="about" className="py-32 bg-teal-50 overflow-hidden relative">
          <motion.div initial={{ opacity: 0, scale: 1.2 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 2 }} className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-400 blur-[150px] opacity-20 pointer-events-none" />
          <div className="max-w-[1300px] mx-auto px-8 grid md:grid-cols-12 gap-16 items-center relative z-10">
             <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="md:col-span-6 space-y-8">
                <motion.h2 variants={fadeUpStringent} className={`text-6xl md:text-7xl font-black text-teal-900 leading-[0.9] ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                <motion.div variants={fadeUpStringent} className={`prose prose-xl text-teal-800/80 ${themeTokens.fontBodyClass}`}>
                   <div dangerouslySetInnerHTML={{ __html: content }} />
                </motion.div>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1 }} className="md:col-span-6">
                {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-[4/5] ${radius} shadow-2xl`} className="object-cover" />}
             </motion.div>
          </div>
        </section>
      );

    case 'compact-urban':
      return (
        <section ref={ref} id="about" className="py-24 bg-[#111] text-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 1 }}>
               <h2 className={`text-4xl md:text-5xl font-bold mb-8 ${themeTokens.fontHeadingClass}`}>{title}</h2>
               {config.image && <SafeNextImage src={config.image} alt={title} containerClassName={`w-full aspect-video ${radius} grayscale mt-8`} className="object-cover" />}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="md:pl-12 md:border-l md:border-white/20">
               <div className={`prose prose-invert prose-lg text-gray-400 font-light ${themeTokens.fontBodyClass}`}>
                 <div dangerouslySetInnerHTML={{ __html: content }} />
               </div>
            </motion.div>
          </div>
        </section>
      );

    case 'abstract-art':
      return (
        <section ref={ref} id="about" className="py-40 bg-gray-100 relative overflow-hidden">
           <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-12 gap-12 items-center relative z-10">
              <motion.div variants={straggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="md:col-span-7 bg-white p-12 md:p-20 shadow-2xl rounded-[50px] md:rounded-[100px] border-b-[20px] border-l-[20px] border-brand/20">
                 <motion.h2 variants={fadeUpStringent} className={`text-5xl md:text-7xl font-black text-gray-900 mb-10 tracking-tighter ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.div variants={fadeUpStringent} className={`prose prose-xl text-gray-600 ${themeTokens.fontBodyClass}`}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                 </motion.div>
              </motion.div>
              <div className="md:col-span-5 relative h-full min-h-[400px]">
                 <motion.div initial={{ opacity: 0, rotate: 10, scale: 0.8 }} animate={isInView ? { opacity: 1, rotate: 0, scale: 1 } : {}} transition={{ type: "spring", duration: 2 }} className="absolute inset-0">
                    {config.image && <SafeNextImage src={config.image} alt={title} containerClassName="w-full h-full rounded-[40px] overflow-hidden mix-blend-multiply" className="object-cover" />}
                 </motion.div>
              </div>
           </div>
        </section>
      );

    default: // Fallback generic
      return (
        <section id="about" className="py-24 bg-brand/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-8">{title}</h2>
            <div className="prose mx-auto"><div dangerouslySetInnerHTML={{ __html: content }} /></div>
          </div>
        </section>
      );
  }
}
