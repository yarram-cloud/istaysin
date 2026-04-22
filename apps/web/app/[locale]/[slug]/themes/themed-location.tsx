"use client";

import { ThemeStyleMap } from './theme-tokens';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ThemedLocation({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  if (!config?.enabled) return null;

  switch (themeTokens.templateId) {
     case 'modern-minimal':
       return (
         <section id="location" ref={sectionRef} className="py-40 bg-surface-50 px-8 text-center" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[1200px] mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`text-xs uppercase tracking-[0.3em] text-surface-500 mb-8 block ${themeTokens.fontBodyClass}`}
              >
                {config.title || 'Location'}
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`text-4xl lg:text-5xl font-light tracking-tight mb-20 ${themeTokens.fontHeadingClass}`}
              >
                 {property.address}<br />{property.city}
              </motion.h2>
              <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="w-full aspect-video md:aspect-[3/1] bg-surface-200 rounded-3xl overflow-hidden shadow-sm"
              >
                 {/* Placeholder for actual Google Maps iframe/component */}
                 <div className="w-full h-full flex flex-col items-center justify-center text-surface-400 bg-surface-100">
                    <span className="text-4xl mb-4">📍</span>
                    <p className={`text-sm tracking-widest uppercase ${themeTokens.fontBodyClass}`}>Map Integration</p>
                 </div>
              </motion.div>
           </div>
         </section>
       );

     case 'luxury-gold':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-[#050505] relative px-8 overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent opacity-50" />
            <div className="max-w-[1400px] mx-auto grid md:grid-cols-12 gap-16 items-center relative z-10">
               <div className="md:col-span-5 relative">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="pr-12 md:border-r border-brand/20 relative"
                  >
                     <span className={`text-brand uppercase tracking-[0.4em] text-[10px] font-bold block mb-8 ${themeTokens.fontBodyClass}`}>
                       {config.title || 'Destination'}
                     </span>
                     <h2 className={`text-5xl lg:text-7xl font-serif text-white leading-[1.1] mb-12 ${themeTokens.fontHeadingClass}`}>
                        The Heart of <br /> <i className="text-brand">{property.city}</i>
                     </h2>
                     <p className={`text-gray-400 text-lg leading-relaxed font-light mb-12 ${themeTokens.fontBodyClass}`}>
                        {property.address}
                     </p>
                     <a href={`https://maps.google.com/?q=${property.address},${property.city}`} target="_blank" rel="noreferrer" className="inline-block border border-brand/50 text-brand px-10 py-5 uppercase tracking-widest text-xs font-bold hover:bg-brand hover:text-black transition-all">
                        Get Directions
                     </a>
                  </motion.div>
               </div>
               <div className="md:col-span-7">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="w-full aspect-[4/3] bg-surface-900 border border-white/5 relative group p-2"
                  >
                     <div className="absolute inset-0 border border-brand/20 m-6 pointer-events-none z-10" />
                     <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
                  </motion.div>
               </div>
            </div>
         </section>
       );

     case 'nature-eco':
       return (
         <section id="location" ref={sectionRef} className="py-40 bg-surface-50 px-8 relative" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-green-900/[0.02] rounded-l-full blur-3xl" />
            <div className="max-w-[1200px] mx-auto text-center relative z-10">
               <motion.span
                 initial={{ opacity: 0, scale: 0.8 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className={`inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-xs uppercase tracking-widest font-medium mb-12 ${themeTokens.fontBodyClass}`}
               >
                 {config.title || 'How to find us'}
               </motion.span>
               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="relative mb-20"
               >
                 <div className="absolute left-1/2 -top-10 w-20 h-[1px] bg-green-800/30 -translate-x-1/2" />
                 <h2 className={`text-4xl lg:text-6xl text-green-950 font-medium tracking-tight mb-8 ${themeTokens.fontHeadingClass}`}>
                    Nested in {property.city}
                 </h2>
                 <p className={`text-green-800/70 max-w-lg mx-auto text-lg ${themeTokens.fontBodyClass}`}>
                    {property.address}
                 </p>
               </motion.div>
               
               <motion.div
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 1 }}
                 className="w-full aspect-[21/9] bg-green-900/5 rounded-[4rem] overflow-hidden"
               >
                 <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
               </motion.div>
            </div>
         </section>
       );

     case 'boutique-chic':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-white px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1000px] mx-auto">
               <div className="text-center mb-16">
                 <h2 className={`text-5xl font-bold text-gray-900 mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || 'Location'}</h2>
                 <div className="w-24 h-1 bg-brand mx-auto mb-8" />
                 <p className={`text-xl text-gray-500 font-medium ${themeTokens.fontBodyClass}`}>
                   {property.address}<br/>{property.city}
                 </p>
               </div>
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="bg-surface-50 p-4 border border-surface-200 shadow-xl"
               >
                 <div className="w-full aspect-[4/3] md:aspect-[21/9] bg-surface-200 relative overflow-hidden group">
                   <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
                 </div>
               </motion.div>
               <div className="text-center mt-12">
                  <a href={`https://maps.google.com/?q=${property.address},${property.city}`} target="_blank" rel="noreferrer" className="inline-block bg-gray-900 text-white px-12 py-4 uppercase tracking-widest text-sm font-bold hover:bg-brand transition-colors">
                     Open in Maps
                  </a>
               </div>
            </div>
         </section>
       );

     case 'dark-elegance':
       return (
         <section id="location" ref={sectionRef} className="py-40 bg-[#0I0I0I] text-white px-8 border-y border-white/10" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1500px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
               <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
               >
                  <h2 className={`text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-12 ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Locate'}.
                  </h2>
                  <address className={`not-italic text-2xl font-light text-gray-400 space-y-4 mb-16 ${themeTokens.fontBodyClass}`}>
                     <p>{property.address}</p>
                     <p className="text-white font-medium">{property.city}</p>
                  </address>
                  <a href={`https://maps.google.com/?q=${property.address},${property.city}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] hover:text-brand transition-colors group">
                     <span className="w-12 h-px bg-white group-hover:bg-brand group-hover:w-16 transition-all" />
                     Get Directions
                  </a>
               </motion.div>
               <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="w-full aspect-square md:aspect-[4/3] bg-surface-900 overflow-hidden"
               >
                  <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
               </motion.div>
            </div>
         </section>
       );

     case 'playful-vibrant':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-white px-8 overflow-hidden relative" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute top-20 right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-brand/10 rounded-[3rem] rotate-12 -z-10" />
            <div className="max-w-[1200px] mx-auto relative z-10">
               <div className="bg-surface-50 rounded-[4rem] p-12 md:p-20 shadow-2xl relative overflow-hidden isolate">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-80 -z-10" />
                  
                  <div className="grid lg:grid-cols-2 gap-16 items-center">
                     <div>
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           className="inline-block bg-white text-brand px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm shadow-sm mb-8"
                        >
                           {config.title || 'Location'}
                        </motion.div>
                        <motion.h2
                           initial={{ opacity: 0, y: 20 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: 0.1 }}
                           className={`text-5xl lg:text-6xl font-black text-gray-900 mb-8 ${themeTokens.fontHeadingClass}`}
                        >
                           Find us in <span className="text-brand">{property.city}</span>
                        </motion.h2>
                        <motion.p
                           initial={{ opacity: 0 }}
                           whileInView={{ opacity: 1 }}
                           viewport={{ once: true }}
                           transition={{ delay: 0.2 }}
                           className={`text-xl text-gray-600 font-medium leading-relaxed mb-10 ${themeTokens.fontBodyClass}`}
                        >
                           {property.address}
                        </motion.p>
                        <motion.a
                           initial={{ opacity: 0 }}
                           whileInView={{ opacity: 1 }}
                           viewport={{ once: true }}
                           transition={{ delay: 0.3 }}
                           href={`https://maps.google.com/?q=${property.address},${property.city}`} target="_blank" rel="noreferrer"
                           className="inline-block bg-brand text-white text-lg font-bold px-10 py-5 rounded-[2rem] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(var(--brand-rgb),0.5)] transition-all"
                        >
                           Let's Go!
                        </motion.a>
                     </div>
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring" }}
                        className="w-full aspect-square bg-surface-200 rounded-[3rem] border-8 border-white shadow-xl overflow-hidden"
                     >
                        <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
                     </motion.div>
                  </div>
               </div>
            </div>
         </section>
       );

     case 'corporate-trust':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-surface-100 px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1400px] mx-auto">
               <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                  >
                     <h2 className={`text-4xl font-bold text-gray-900 mb-4 ${themeTokens.fontHeadingClass}`}>{config.title || 'Corporate Location'}</h2>
                     <div className="w-16 h-1.5 bg-brand" />
                  </motion.div>
                  <motion.address
                     initial={{ opacity: 0, x: 20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     className={`not-italic text-right text-gray-600 font-medium ${themeTokens.fontBodyClass}`}
                  >
                     {property.address}<br/>
                     <strong className="text-gray-900">{property.city}</strong>
                  </motion.address>
               </div>
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-2 shadow-sm border border-surface-200 rounded-lg"
               >
                  <div className="w-full aspect-[21/9] bg-surface-200 rounded relative overflow-hidden">
                     <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
                  </div>
               </motion.div>
            </div>
         </section>
       );

     case 'classic-heritage':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-[#fdfaf5] px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1200px] mx-auto text-center">
               <div className="flex justify-center mb-10">
                  <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#c6a87c] to-transparent" />
               </div>
               <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className={`text-xs uppercase tracking-[0.3em] font-serif font-bold text-yellow-900/60 block mb-6 ${themeTokens.fontBodyClass}`}
               >
                  {config.title || 'Location'}
               </motion.span>
               <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`text-4xl lg:text-5xl font-serif text-yellow-950 mb-16 ${themeTokens.fontHeadingClass}`}
               >
                  Find Us in {property.city}
               </motion.h2>
               <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="w-full aspect-[16/9] border-8 border-white shadow-2xl relative"
               >
                  <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
               </motion.div>
               <motion.address
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className={`not-italic mt-16 text-lg font-serif text-yellow-900/80 ${themeTokens.fontBodyClass}`}
               >
                  {property.address}
               </motion.address>
            </div>
         </section>
       );

     case 'retro-vintage':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-[#E5E0D8] px-6 border-b-[8px] border-black" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-12 items-stretch">
               <div className="lg:col-span-5 bg-[#4CA28A] border-[6px] border-black p-12 shadow-[12px_12px_0px_#000] flex flex-col justify-center">
                  <h2 className={`text-6xl font-black uppercase leading-[0.9] text-white mb-10 ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Where Are We?'}
                  </h2>
                  <address className={`not-italic font-bold text-xl uppercase text-black bg-white border-4 border-black p-6 inline-block transform -rotate-2 ${themeTokens.fontBodyClass}`}>
                     {property.address}<br />
                     <span className="text-brand">{property.city}</span>
                  </address>
               </div>
               <div className="lg:col-span-7 bg-white border-[6px] border-black shadow-[12px_12px_0px_#000] p-4">
                  <div className="w-full h-full min-h-[400px] bg-surface-200 border-4 border-black relative overflow-hidden pattern-dots pattern-black pattern-bg-white pattern-size-4 pattern-opacity-10">
                     <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
                  </div>
               </div>
            </div>
         </section>
       );

     case 'resort-tropical':
       return (
         <section id="location" ref={sectionRef} className="py-32 bg-white px-8 relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-50 rounded-full blur-[100px] -z-10" />
            <div className="max-w-[1400px] mx-auto text-center">
               <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`text-teal-600 font-bold uppercase tracking-widest text-sm mb-6 block ${themeTokens.fontBodyClass}`}
               >
                  {config.title || 'Location'}
               </motion.span>
               <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`text-5xl font-black text-teal-950 mb-8 ${themeTokens.fontHeadingClass}`}
               >
                  Paradise in {property.city}
               </motion.h2>
               <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className={`text-lg text-teal-800/70 max-w-2xl mx-auto mb-16 ${themeTokens.fontBodyClass}`}
               >
                  {property.address}
               </motion.p>
               
               <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="w-full aspect-[21/9] bg-teal-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-teal-50 relative"
               >
                  <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
               </motion.div>
            </div>
         </section>
       );

     case 'compact-urban':
       return (
         <section id="location" ref={sectionRef} className="py-24 bg-white px-6" style={{ scrollMarginTop: '80px' }}>
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
               <div className="md:col-span-1 border-l-4 border-brand pl-6">
                  <h2 className={`text-4xl font-bold text-gray-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || 'Location'}</h2>
                  <address className={`not-italic text-sm text-gray-600 space-y-2 mb-8 ${themeTokens.fontBodyClass}`}>
                     <strong className="block text-gray-900">{property.city}</strong>
                     {property.address}
                  </address>
                  <a href={`https://maps.google.com/?q=${property.address},${property.city}`} target="_blank" rel="noreferrer" className="text-brand font-bold text-sm uppercase tracking-wider hover:text-gray-900 transition-colors">
                     Open Map →
                  </a>
               </div>
               <div className="md:col-span-2 aspect-[4/3] md:aspect-auto md:h-full bg-surface-100 rounded-xl overflow-hidden shadow-inner">
                  <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
               </div>
            </div>
         </section>
       );

     case 'abstract-art':
       return (
         <section id="location" ref={sectionRef} className="py-40 bg-surface-900 px-8 relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute left-[-20%] top-[-20%] w-[60%] h-[60%] bg-brand/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
               <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="order-2 md:order-1"
               >
                  <div className="w-full aspect-square bg-white shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden relative p-4 border-8 border-gray-100">
                     <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
                  </div>
               </motion.div>
               <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="order-1 md:order-2"
               >
                  <h2 className={`text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-12 ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Location'}.
                  </h2>
                  <address className={`not-italic text-3xl font-bold text-gray-400 leading-tight mb-16 ${themeTokens.fontBodyClass}`}>
                     {property.address}<br />
                     <span className="text-brand">{property.city}</span>
                  </address>
               </motion.div>
            </div>
         </section>
       );

     default: // generic fallback
       return (
         <section id="location" ref={sectionRef} className="py-24 bg-surface-50 px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1200px] mx-auto">
               <div className="text-center mb-16">
                 <h2 className={`text-4xl font-bold text-gray-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || 'Location'}</h2>
                 <p className={`text-lg text-gray-600 ${themeTokens.fontBodyClass}`}>{property.address}, {property.city}</p>
               </div>
               <div className="w-full aspect-[21/9] bg-surface-200 border border-surface-300 rounded-lg overflow-hidden shadow-sm">
                  <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent((property.name || '') + ' ' + (property.address || '') + ' ' + (property.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.1) contrast(1.05)' }} allowFullScreen loading="lazy" />
               </div>
            </div>
         </section>
       );
  }
}
