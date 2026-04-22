"use client";

import { ThemeStyleMap } from './theme-tokens';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Award, Trophy } from 'lucide-react';

export default function ThemedAwards({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const sectionRef = useRef<HTMLElement>(null);

  if (!config?.enabled || !config?.items || config.items.length === 0) return null;

  const awards = config.items;

  switch (themeTokens.templateId) {
     case 'modern-minimal':
       return (
         <section ref={sectionRef} className="py-32 bg-white px-8 border-y border-surface-100">
           <div className="max-w-[1200px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                  <h2 className={`text-3xl font-light tracking-tight text-gray-900 ${themeTokens.fontHeadingClass}`}>{config.title || 'Recognition'}</h2>
              </motion.div>
              <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 hover:opacity-100 transition-opacity duration-500 saturate-0 hover:saturate-100">
                 {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center gap-4 text-center group"
                    >
                       <div className="w-16 h-16 md:w-24 md:h-24 object-contain transition-transform duration-500 group-hover:scale-110">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-surface-200 rounded-full flex items-center justify-center text-xs">📷</div>}
                       </div>
                       <p className={`text-xs uppercase tracking-widest text-surface-500 ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </motion.div>
                 ))}
              </div>
           </div>
         </section>
       );

     case 'luxury-gold':
       return (
         <section ref={sectionRef} className="py-24 bg-[#0A0A0A] px-8 border-y border-brand/10">
            <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-16 items-center">
               <div className="lg:col-span-4">
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`text-brand uppercase tracking-[0.3em] text-[10px] font-bold block mb-4 ${themeTokens.fontBodyClass}`}
                  >
                    Excellence
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className={`text-4xl lg:text-5xl font-serif text-white mb-6 ${themeTokens.fontHeadingClass}`}
                  >
                    {config.title || 'Awards & Accolades'}
                  </motion.h2>
                  <div className="w-12 h-px bg-brand/50 mb-6" />
               </div>
               <div className="lg:col-span-8 flex flex-wrap gap-12 lg:gap-20 pb-4">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="flex flex-col items-center gap-6"
                    >
                       <div className="w-20 h-20 bg-brand/5 p-4 rounded-full border border-brand/20 shadow-[0_0_30px_rgba(var(--brand-rgb),0.1)]">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" /> : <div className="w-full h-full flex items-center justify-center text-brand">🥇</div>}
                       </div>
                       <p className={`text-xs uppercase tracking-widest text-gray-400 font-medium ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'nature-eco':
       return (
         <section ref={sectionRef} className="py-24 bg-green-50 px-8">
            <div className="max-w-[1200px] mx-auto">
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="flex flex-col items-center text-center mb-16"
               >
                  <span className="text-3xl mb-4">🍃</span>
                  <h2 className={`text-2xl lg:text-3xl font-medium tracking-tight text-green-950 ${themeTokens.fontHeadingClass}`}>{config.title || 'Trusted By'}</h2>
               </motion.div>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-8 rounded-3xl shadow-sm text-center flex flex-col items-center gap-4 hover:shadow-md transition-shadow"
                    >
                       <div className="w-20 h-20 opacity-80 mix-blend-multiply">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center text-green-800">📷</div>}
                       </div>
                       {award.title && <p className={`text-sm text-green-800 font-medium ${themeTokens.fontBodyClass}`}>{award.title}</p>}
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'boutique-chic':
       return (
         <section ref={sectionRef} className="py-24 bg-surface-50 px-8 border-y border-surface-200">
            <div className="max-w-[1000px] mx-auto text-center">
               <h2 className={`text-3xl font-black uppercase text-gray-900 mb-16 tracking-widest ${themeTokens.fontHeadingClass}`}>{config.title || 'As Featured In'}</h2>
               <div className="flex flex-wrap justify-center items-center gap-16 lg:gap-24 opacity-50 contrast-200 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="w-24 md:w-32 hover:scale-110 transition-transform duration-300"
                    >
                       {award.image ? <img src={award.image} alt={award.title} className="w-full h-auto object-contain mix-blend-darken" /> : <div className="p-4 border-2 border-dashed border-gray-300 flex items-center justify-center"><Award className="w-6 h-6 text-gray-300" /></div>}
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'dark-elegance':
       return (
         <section ref={sectionRef} className="py-32 bg-[#050505] px-8 relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
            <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-center gap-16 lg:gap-32">
               <motion.div
                 initial={{ opacity: 0, x: -30 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="shrink-0"
               >
                  <h2 className={`text-4xl font-black uppercase tracking-[0.2em] text-white ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Honors'}
                  </h2>
               </motion.div>
               <div className="flex overflow-x-auto gap-16 lg:gap-32 pb-8 hide-scrollbar w-full relative z-10">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center gap-6 shrink-0 group min-w-[120px]"
                    >
                       <div className="w-24 h-24 bg-white/5 p-6 rounded-full group-hover:bg-brand/10 transition-colors duration-500">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain filter brightness-200" /> : <div className="w-full h-full flex items-center justify-center text-white/50 text-2xl">★</div>}
                       </div>
                       <p className={`text-xs uppercase tracking-[0.3em] text-gray-500 group-hover:text-white transition-colors duration-500 font-bold ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'playful-vibrant':
       return (
         <section ref={sectionRef} className="py-24 bg-surface-50 px-8">
            <div className="max-w-[1200px] mx-auto">
               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[3rem] p-12 lg:p-20 shadow-xl border-4 border-surface-100 relative overflow-hidden"
               >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <h2 className={`text-4xl font-black text-center text-gray-900 mb-16 ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Trophy Cabinet'} 🏆
                  </h2>
                  <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
                     {awards.map((award: any, i: number) => (
                       <motion.div
                         key={i}
                         initial={{ opacity: 0, y: 20, rotate: -5 }}
                         whileInView={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? 3 : -3 }}
                         whileHover={{ scale: 1.1, rotate: 0 }}
                         viewport={{ once: true }}
                         transition={{ type: "spring", stiffness: 300 }}
                         className="bg-surface-50 w-40 h-40 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center shadow-md border-2 border-white relative group"
                       >
                          <div className="w-16 h-16 mb-4 transform group-hover:-translate-y-2 transition-transform duration-300">
                             {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain drop-shadow-md" /> : <div className="text-4xl">🏅</div>}
                          </div>
                          <p className={`text-xs font-bold text-gray-700 leading-tight ${themeTokens.fontBodyClass}`}>{award.title}</p>
                       </motion.div>
                    ))}
                  </div>
               </motion.div>
            </div>
         </section>
       );

     case 'corporate-trust':
       return (
         <section ref={sectionRef} className="py-20 bg-white px-8 border-y border-surface-200">
            <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 items-center gap-12">
               <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-surface-200 pb-8 md:pb-0 pr-0 md:pr-8">
                  <h2 className={`text-2xl font-bold text-gray-900 ${themeTokens.fontHeadingClass}`}>{config.title || 'Industry Recognition'}</h2>
               </div>
               <div className="md:col-span-3 flex flex-wrap justify-center md:justify-start gap-12 grayscale opacity-70">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="w-24 relative hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    >
                       {award.image ? <img src={award.image} alt={award.title} className="w-full h-auto object-contain" /> : <div className="text-xs bg-surface-200 p-2 rounded text-center font-medium">Award Logo</div>}
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'classic-heritage':
       return (
         <section ref={sectionRef} className="py-24 bg-white px-8">
            <div className="max-w-[1200px] mx-auto">
               <div className="text-center mb-16">
                 <div className="text-brand text-2xl mb-4">❦</div>
                 <h2 className={`text-3xl font-serif text-yellow-950 uppercase tracking-widest ${themeTokens.fontHeadingClass}`}>{config.title || 'Accolades'}</h2>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="border border-[#e8dfc8] p-8 text-center bg-[#fdfaf5]"
                    >
                       <div className="w-16 h-16 mx-auto mb-6 sepia">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain" /> : <div className="text-2xl">♕</div>}
                       </div>
                       <p className={`text-sm font-serif italic text-yellow-900 ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'retro-vintage':
       return (
         <section ref={sectionRef} className="py-24 bg-[#E5E0D8] border-b-[8px] border-black px-6">
            <div className="max-w-[1200px] mx-auto">
               <h2 className={`text-4xl font-black uppercase text-center mb-16 bg-white border-4 border-black inline-block px-8 py-3 transform -rotate-1 ${themeTokens.fontHeadingClass}`}>
                  {config.title || 'Hall of Fame'}
               </h2>
               <div className="flex flex-wrap justify-center gap-8">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                      viewport={{ once: true }}
                      className={`bg-[${i % 2 === 0 ? '#4CA28A' : '#DF5339'}] border-4 border-black p-6 w-48 text-center shadow-[6px_6px_0px_#000] flex flex-col items-center justify-center gap-4`}
                    >
                       <div className="w-20 h-20 bg-white border-2 border-black rounded-full overflow-hidden p-2 flex items-center justify-center">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain filter grayscale contrast-150" /> : <div className="text-2xl font-black">★</div>}
                       </div>
                       <p className={`font-black uppercase text-xs text-white leading-tight ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'resort-tropical':
       return (
         <section ref={sectionRef} className="py-20 bg-teal-50 px-8 my-10">
            <div className="max-w-[1400px] mx-auto flex flex-col items-center">
               <h2 className={`text-sm font-bold uppercase tracking-[0.3em] text-teal-800/50 mb-12 text-center ${themeTokens.fontBodyClass}`}>{config.title || 'Recognized By'}</h2>
               <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="w-24 h-24 hover:opacity-100 transition-opacity duration-300 drop-shadow-sm flex items-center justify-center"
                    >
                       {award.image ? <img src={award.image} alt={award.title} className="max-w-full max-h-full object-contain mix-blend-multiply" /> : <div className="text-3xl">🏅</div>}
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'compact-urban':
       return (
         <section ref={sectionRef} className="py-16 bg-surface-50 px-6 border-y border-surface-200">
            <div className="max-w-6xl mx-auto overflow-hidden">
               <h2 className={`text-xs font-bold uppercase text-gray-500 mb-8 tracking-widest ${themeTokens.fontBodyClass}`}>{config.title || 'Awards'}</h2>
               <div className="flex gap-12 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
                  {awards.map((award: any, i: number) => (
                    <div key={i} className="flex-none flex items-center gap-4 bg-white px-6 py-4 rounded-lg shadow-sm border border-surface-100">
                       <div className="w-10 h-10 grayscale opacity-80">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-surface-200 rounded flex items-center justify-center text-xs">★</div>}
                       </div>
                       <p className={`text-sm font-medium text-gray-900 whitespace-nowrap ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'abstract-art':
       return (
         <section ref={sectionRef} className="py-32 bg-white px-8">
            <div className="max-w-[1400px] mx-auto text-center">
               <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`text-6xl font-black uppercase tracking-tighter text-gray-200 mb-20 ${themeTokens.fontHeadingClass}`}
               >
                  {config.title || 'Awards'}
               </motion.h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                  {awards.map((award: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                      className="aspect-square bg-gray-50 hover:bg-brand/5 border border-gray-100 flex flex-col items-center justify-center p-8 group transition-colors duration-500"
                    >
                       <div className="w-20 h-20 mb-6 transform group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-brand"><Trophy className="w-12 h-12" /></div>}
                       </div>
                       <p className={`text-xs uppercase font-black tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors duration-500 max-w-[150px] mx-auto ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     default: // fallback generic
       return (
         <section ref={sectionRef} className="py-24 bg-surface-50 px-8">
            <div className="max-w-[1200px] mx-auto">
               <h2 className={`text-3xl font-bold text-center text-gray-900 mb-12 ${themeTokens.fontHeadingClass}`}>{config.title || 'Awards'}</h2>
               <div className="flex flex-wrap justify-center gap-12">
                  {awards.map((award: any, i: number) => (
                    <div key={i} className="flex flex-col items-center min-w-[120px] max-w-[180px] text-center">
                       <div className="w-20 h-20 bg-white rounded-full shadow-sm p-4 mb-4 flex items-center justify-center">
                          {award.image ? <img src={award.image} alt={award.title} className="w-full h-full object-contain" /> : <div className="text-xl">🏆</div>}
                       </div>
                       <p className={`text-sm font-medium text-gray-700 ${themeTokens.fontBodyClass}`}>{award.title}</p>
                    </div>
                 ))}
               </div>
            </div>
         </section>
       );
  }
}
