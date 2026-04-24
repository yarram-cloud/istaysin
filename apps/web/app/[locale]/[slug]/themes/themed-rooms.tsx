'use client';
import { ThemeStyleMap } from './theme-tokens';
import { User, BedDouble, ArrowRight } from 'lucide-react';
import SafeNextImage from '../../../../components/safe-image';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ThemedRooms({ property, locale, propertySlug, themeTokens, config }: { property: any, locale: string, propertySlug: string, themeTokens: ThemeStyleMap, config: any }) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;
  if (!property.roomTypes || property.roomTypes.length === 0) return null;

  const title = config.title || t('accommodations');
  const subtitle = config.subtitle || t('findPerfectRoom');
  const rooms = property.roomTypes.slice(0, config.limit || 6);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeUpVariant = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } } };
  const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <section ref={ref} id="rooms" className="py-32 md:py-48 bg-[#FAFAFA] border-t border-gray-200">
           <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-32 flex flex-col md:flex-row justify-between items-end gap-10">
                 <div>
                    <motion.div variants={fadeUpVariant} className="w-10 h-1 bg-black mb-10" />
                    <motion.h2 variants={fadeUpVariant} className={`text-6xl md:text-[5rem] font-medium tracking-tighter leading-none text-gray-900 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 </div>
                 <motion.p variants={fadeUpVariant} className={`text-2xl text-gray-400 font-light max-w-xl ${themeTokens.fontBodyClass}`}>{subtitle}</motion.p>
              </motion.div>
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="space-y-40">
                 {rooms.map((rt: any, i: number) => {
                   const isEven = i % 2 === 0;
                   return (
                     <div key={rt.id} className="grid md:grid-cols-12 gap-16 md:gap-24 items-center group">
                        <motion.div variants={fadeUpVariant} className={`md:col-span-7 aspect-[4/3] overflow-hidden bg-gray-100 ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                          {rt.photos?.[0] ? <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="object-cover transition-transform duration-[2s] group-hover:scale-105" /> : <div className="w-full h-full" />}
                        </motion.div>
                        <motion.div variants={fadeUpVariant} className={`md:col-span-5 flex flex-col ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                           <h3 className={`text-4xl text-gray-900 mb-6 font-medium ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                           <p className={`text-lg text-gray-500 font-light mb-10 line-clamp-3 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                           <div className="flex gap-8 mb-12 border-l border-gray-300 pl-6 text-sm text-gray-400 uppercase tracking-widest font-bold">
                             <div className="flex flex-col gap-2"><span>Capacity</span><span className="text-gray-900">{rt.baseOccupancy} Guests</span></div>
                             <div className="flex flex-col gap-2"><span>Bed</span><span className="text-gray-900">{rt.bedType}</span></div>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-2xl font-light text-gray-900">₹{rt.baseRate}</span>
                             <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="text-sm font-bold uppercase tracking-[0.2em] hover:text-gray-500 transition-colors border-b border-black pb-1">Reserve</a>
                           </div>
                        </motion.div>
                     </div>
                   );
                 })}
              </motion.div>
           </div>
        </section>
      );

    case 'luxury-gold':
      return (
        <section ref={ref} id="rooms" className="py-40 bg-[#050505] relative overflow-hidden">
           <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-white">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center mb-24">
                 <motion.h2 variants={fadeUpVariant} className={`text-6xl md:text-8xl font-serif text-white tracking-tight ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.div variants={fadeUpVariant} className="w-px h-24 bg-brand mx-auto my-8 opacity-40" />
                 <motion.p variants={fadeUpVariant} className={`text-xl text-gray-500 font-light uppercase tracking-widest ${themeTokens.fontBodyClass}`}>{subtitle}</motion.p>
              </motion.div>
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="grid md:grid-cols-2 gap-12">
                 {rooms.map((rt: any) => (
                   <motion.div variants={fadeUpVariant} key={rt.id} className="group relative aspect-[3/4] border border-white/10 hover:border-brand/50 transition-colors duration-700 overflow-hidden bg-black flex flex-col p-8 md:p-12 justify-end">
                      {rt.photos?.[0] && (
                        <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="absolute inset-0 z-0 opacity-40 group-hover:opacity-70 transition-opacity duration-[2s]" className="object-cover scale-105 group-hover:scale-100 transition-transform duration-[3s]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
                      <div className="relative z-20 translate-y-8 group-hover:translate-y-0 transition-transform duration-700">
                         <div className="text-brand text-xs uppercase tracking-[0.3em] font-bold mb-4">From ₹{rt.baseRate}</div>
                         <h3 className={`text-4xl text-white font-serif mb-6 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <div className="h-0 group-hover:h-32 opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-700">
                            <p className={`text-gray-400 font-light mb-6 line-clamp-2 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="text-brand border border-brand py-3 px-8 text-xs uppercase font-bold tracking-[0.2em] hover:bg-brand hover:text-black transition-colors block text-center backdrop-blur-sm">Book Suite</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </motion.div>
           </div>
        </section>
      );

    case 'nature-eco':
      return (
        <section ref={ref} id="rooms" className="py-32 bg-[#F6F8F6]">
           <div className="max-w-[1400px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-20 text-center">
                 <motion.h2 variants={fadeUpVariant} className={`text-5xl md:text-6xl text-green-950 font-medium ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.p variants={fadeUpVariant} className={`text-xl text-green-800/60 mt-6 font-light ${themeTokens.fontBodyClass}`}>{subtitle}</motion.p>
              </motion.div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.8 }} key={rt.id} className="bg-white rounded-[3rem] p-4 shadow-sm hover:shadow-2xl transition-shadow border border-green-900/5 group flex flex-col">
                      <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden relative">
                         {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="object-cover group-hover:scale-105 transition-transform duration-[2s]" />}
                      </div>
                      <div className="p-8 flex-1 flex flex-col pt-10">
                         <h3 className={`text-3xl text-green-950 font-medium mb-4 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <p className={`text-green-900/60 font-light line-clamp-2 mb-8 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                         <div className="mt-auto flex items-center justify-between border-t border-green-900/10 pt-6">
                            <span className="text-xl font-medium text-green-950">₹{rt.baseRate}</span>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-green-50 text-green-900 px-6 py-3 rounded-full text-sm font-semibold hover:bg-green-900 hover:text-white transition-colors">Select</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'boutique-chic':
      return (
        <section ref={ref} id="rooms" className="py-40 bg-[#FDFBF7]">
           <div className="max-w-[1300px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-24 flex items-center justify-between border-b border-gray-200 pb-12">
                 <motion.h2 variants={fadeUpVariant} className={`text-6xl text-gray-900 tracking-tight ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.p variants={fadeUpVariant} className={`text-lg text-gray-500 font-light max-w-sm text-right ${themeTokens.fontBodyClass}`}>{subtitle}</motion.p>
              </motion.div>
              <div className="columns-1 md:columns-2 gap-12 space-y-12">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 1 }} key={rt.id} className="break-inside-avoid relative group">
                      <div className="bg-white p-6 md:p-10 shadow-[20px_20px_0px_var(--brand-color-rgb)] border border-gray-100 hover:-translate-y-2 hover:shadow-[30px_30px_0px_var(--brand-color-rgb)] transition-all duration-500">
                         <div className={`aspect-[3/4] overflow-hidden mb-8 ${i % 2 === 0 ? 'aspect-square' : ''}`}>
                            {rt.photos?.[0] ? <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" /> : <div className="w-full h-full bg-gray-100" />}
                         </div>
                         <h3 className={`text-3xl text-gray-900 mb-4 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <p className={`text-gray-500 font-light mb-8 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                         <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                            <span className="font-bold text-lg">₹{rt.baseRate}</span>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-brand text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-black transition-colors">Book Now</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'dark-elegance':
      return (
        <section ref={ref} id="rooms" className="py-40 bg-black text-white relative">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_white_0%,_black_100%)] pointer-events-none" />
           <div className="max-w-7xl mx-auto px-6 relative z-10">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center mb-32">
                 <motion.h2 variants={fadeUpVariant} className={`text-[6vw] font-black uppercase tracking-tighter leading-none ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
              </motion.div>
              <div className="space-y-32">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.2, duration: 1 }} key={rt.id} className="grid md:grid-cols-2 lg:grid-cols-12 gap-8 items-center group">
                      <div className={`lg:col-span-8 aspect-video overflow-hidden ${i % 2 === 0 ? '' : 'lg:order-2'}`}>
                         {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000" className="object-cover" />}
                      </div>
                      <div className={`lg:col-span-4 p-8 bg-black/50 backdrop-blur-md ${i % 2 === 0 ? '-ml-20' : 'lg:order-1 -mr-20 z-10'}`}>
                         <div className="text-gray-500 font-mono text-sm mb-4">№ 0{i + 1}</div>
                         <h3 className={`text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-6 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <p className={`text-gray-400 font-light mb-10 line-clamp-3 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                         <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <span className="text-2xl font-bold">₹{rt.baseRate}</span>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="hover:text-gray-400 transition-colors uppercase text-sm font-bold tracking-widest">Reserve  →</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'playful-vibrant':
      return (
        <section ref={ref} id="rooms" className="py-32 bg-surface-50 overflow-hidden">
           <div className="max-w-[1400px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center mb-20 space-y-6">
                 <motion.span variants={fadeUpVariant} className="bg-brand/20 text-brand px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest border border-brand/30">Accommodations</motion.span>
                 <motion.h2 variants={fadeUpVariant} className={`text-5xl md:text-7xl font-black text-gray-900 drop-shadow-sm ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
              </motion.div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, scale: 0.9, rotate: i % 2 === 0 ? 3 : -3 }} animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}} transition={{ type: "spring", delay: i * 0.1 }} key={rt.id} className="bg-white rounded-[3rem] p-6 shadow-xl border-4 border-transparent hover:border-brand transition-colors group flex flex-col">
                      <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative mb-8">
                         {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="object-cover group-hover:scale-110 transition-transform duration-[2s]" />}
                         <div className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-full font-black text-sm shadow-md">₹{rt.baseRate}</div>
                      </div>
                      <h3 className={`text-3xl font-black text-gray-900 mb-4 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                      <p className={`text-gray-600 font-medium mb-8 flex-1 line-clamp-2 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                      <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="block w-full text-center bg-gray-100 group-hover:bg-brand group-hover:text-white px-6 py-4 rounded-[1.5rem] font-bold text-lg transition-colors">Select Room</a>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'corporate-trust':
      return (
        <section ref={ref} id="rooms" className="py-32 bg-[#F8FAFC]">
           <div className="max-w-[1400px] mx-auto px-8">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-20">
                 <motion.h2 variants={fadeUpVariant} className={`text-4xl md:text-5xl font-bold text-blue-950 mb-6 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.p variants={fadeUpVariant} className={`text-lg text-slate-600 max-w-2xl ${themeTokens.fontBodyClass}`}>{subtitle}</motion.p>
              </motion.div>
              <div className="flex flex-col gap-8">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }} key={rt.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow">
                      <div className="w-full md:w-1/3 aspect-[4/3] md:aspect-auto md:h-64 relative bg-slate-100">
                         {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="object-cover" />}
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                         <div className="flex justify-between items-start mb-4">
                            <h3 className={`text-2xl font-bold text-blue-950 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                            <div className="text-xl font-bold text-brand">₹{rt.baseRate}<span className="text-sm text-slate-500 font-normal block text-right">/ night</span></div>
                         </div>
                         <p className={`text-slate-600 mb-6 line-clamp-2 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                         <div className="mt-auto flex justify-between items-center">
                            <div className="flex gap-4 text-sm font-semibold text-slate-500">
                               <span className="bg-slate-100 px-3 py-1 rounded">{rt.baseOccupancy} Guests</span>
                               <span className="bg-slate-100 px-3 py-1 rounded">{rt.bedType}</span>
                            </div>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-blue-950 hover:bg-brand text-white px-8 py-3 rounded-xl font-bold transition-colors">Book Room</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'classic-heritage':
      return (
        <section ref={ref} id="rooms" className="py-32 bg-white relative border-b-8 border-[#f4eee0]">
           <div className="max-w-[1200px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center mb-24 space-y-8">
                 <motion.h2 variants={fadeUpVariant} className={`text-5xl md:text-7xl font-serif text-yellow-950 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.div variants={fadeUpVariant} className="flex justify-center items-center gap-4">
                   <div className="w-16 h-px bg-yellow-800" />
                   <span className={`text-xl font-serif italic text-yellow-900/60 ${themeTokens.fontBodyClass}`}>{subtitle}</span>
                   <div className="w-16 h-px bg-yellow-800" />
                 </motion.div>
              </motion.div>
              <div className="grid md:grid-cols-2 gap-16">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 1 }} key={rt.id} className="group border border-[#e8dfc8] p-4 bg-[#fdfaf5]">
                      <div className="relative aspect-[4/3] overflow-hidden mb-8 border border-white">
                         {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full sepia-[0.1]" className="object-cover group-hover:scale-105 transition-transform duration-[2s]" />}
                      </div>
                      <div className="text-center pb-6 px-4">
                         <h3 className={`text-3xl text-yellow-950 font-serif mb-4 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <p className={`text-yellow-900/80 font-serif italic mb-8 line-clamp-3 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                         <div className="flex justify-between items-center border-t border-[#e8dfc8] pt-6">
                            <span className="font-serif text-xl text-yellow-900">₹{rt.baseRate}</span>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="uppercase text-xs font-bold tracking-[0.2em] text-yellow-800 hover:text-black transition-colors">Confirm Room</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'retro-vintage':
      return (
        <section ref={ref} id="rooms" className="py-32 bg-[#E5E0D8]">
           <div className="max-w-[1300px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-20">
                 <motion.h2 variants={fadeUpVariant} className={`text-6xl md:text-[5rem] font-black text-black uppercase leading-[0.9] border-b-[6px] border-black pb-6 inline-block pr-12 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
              </motion.div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 gap-y-20">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.1 }} key={rt.id} className="bg-white border-[6px] border-black flex flex-col relative group">
                      <div className="aspect-square border-b-[6px] border-black relative overflow-hidden bg-[#F2B94A] flex items-center justify-center">
                         {rt.photos?.[0] ? <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full" className="object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-[1s]" /> : <span className="font-black uppercase text-2xl">Room</span>}
                      </div>
                      <div className="p-8 flex-1 flex flex-col h-[280px]">
                         <h3 className={`text-2xl font-black uppercase text-black mb-4 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <p className={`text-black font-semibold line-clamp-3 mb-6 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                         <div className="mt-auto flex justify-between items-center text-xl font-black">
                            <span>₹{rt.baseRate}</span>
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-[#DF5339] text-black px-4 py-2 border-[4px] border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all uppercase text-sm">Select</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'resort-tropical':
      return (
        <section ref={ref} id="rooms" className="py-40 bg-teal-900 border-t border-teal-800 relative z-10">
           <div className="max-w-[1400px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center mb-24 max-w-4xl mx-auto text-white">
                 <motion.h2 variants={fadeUpVariant} className={`text-6xl md:text-8xl font-black tracking-tight mb-8 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
                 <motion.p variants={fadeUpVariant} className={`text-2xl text-teal-100 font-light ${themeTokens.fontBodyClass}`}>{subtitle}</motion.p>
              </motion.div>
              <div className="flex flex-col gap-12">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 1 }} key={rt.id} className="group relative aspect-[16/9] md:aspect-[21/9] rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl">
                      {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="absolute inset-0 w-full h-full" className="object-cover scale-105 group-hover:scale-100 group-hover:rotate-1 transition-all duration-[2s] opacity-60" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/40 to-transparent" />
                      <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end">
                         <div className="md:w-2/3">
                            <h3 className={`text-4xl md:text-5xl font-black text-white mb-6 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                            <p className={`text-xl text-teal-100 mb-10 font-light line-clamp-2 md:line-clamp-none ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                            <div className="flex flex-col md:flex-row md:items-center gap-8">
                               <div className="text-3xl font-bold text-[#FF9F1C]">₹{rt.baseRate}</div>
                               <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-white text-teal-950 px-10 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-[#FF9F1C] hover:text-white transition-colors w-max">Book Retreat</a>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'compact-urban':
      return (
        <section ref={ref} id="rooms" className="py-24 bg-[#111] text-white">
           <div className="max-w-6xl mx-auto px-4 md:px-8">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-16">
                 <motion.h2 variants={fadeUpVariant} className={`text-4xl md:text-6xl font-bold tracking-tight mb-4 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
              </motion.div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.05 }} key={rt.id} className="col-span-2 group relative overflow-hidden bg-[#222]">
                      <div className="aspect-square md:aspect-[4/3] w-full">
                         {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full opacity-50 group-hover:opacity-80 transition-opacity" className="object-cover" />}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end translate-y-8 group-hover:translate-y-0 transition-transform">
                         <h3 className={`text-2xl font-bold mb-2 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                         <div className="font-mono text-sm text-gray-400 mb-4 tracking-tighter">INR {rt.baseRate}</div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-white text-black text-center py-3 font-black text-sm uppercase tracking-widest block w-full hover:bg-brand">Book</a>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    case 'abstract-art':
      return (
        <section ref={ref} id="rooms" className="py-40 bg-gray-100">
           <div className="max-w-[1300px] mx-auto px-6">
              <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-center mb-32">
                 <motion.h2 variants={fadeUpVariant} className={`text-6xl md:text-[6rem] font-black tracking-tighter text-gray-900 ${themeTokens.fontHeadingClass}`}>{title}</motion.h2>
              </motion.div>
              <div className="flex flex-col gap-32">
                 {rooms.map((rt: any, i: number) => (
                   <motion.div initial={{ opacity: 0, y: 100 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ type: "spring", duration: 1.5 }} key={rt.id} className="relative">
                      <div className="absolute top-0 right-0 w-full h-full bg-brand/10 transform rotate-1 rounded-[50px] pointer-events-none" />
                      <div className="bg-white p-6 md:p-12 shadow-2xl rounded-[30px] md:rounded-[50px] relative z-10 grid md:grid-cols-2 gap-12 items-center">
                         <div className="aspect-square bg-gray-200 rounded-[30px] overflow-hidden transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                            {rt.photos?.[0] && <SafeNextImage src={rt.photos[0].url} alt={rt.name} containerClassName="w-full h-full mix-blend-overlay opacity-90" className="object-cover" />}
                         </div>
                         <div className="flex flex-col justify-center">
                            <h3 className={`text-4xl md:text-5xl font-black text-gray-900 mb-8 ${themeTokens.fontHeadingClass}`}>{rt.name}</h3>
                            <p className={`text-xl text-gray-600 font-medium mb-12 ${themeTokens.fontBodyClass}`}>{rt.description}</p>
                            <div className="flex items-center justify-between border-t-4 border-gray-100 pt-8 mt-auto">
                               <span className="text-3xl font-black text-brand">₹{rt.baseRate}</span>
                               <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-gray-900 hover:bg-brand text-white font-black px-10 py-5 rounded-[20px] text-lg transition-colors shadow-lg transform hover:-rotate-3">Book Fast</a>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>
      );

    default: // Fallback generic
      return (
        <section id="rooms" className="py-24 bg-brand/5">
           <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-16">{title}</h2>
              <div className="grid md:grid-cols-3 gap-8">
                 {rooms.map((rt: any) => (
                   <div key={rt.id} className="bg-white p-6 rounded-xl shadow-lg">
                      <h3 className="text-2xl font-bold mb-4">{rt.name}</h3>
                      <p className="mb-6 text-gray-600">{rt.description}</p>
                      <a href={`/${locale}/${propertySlug}/book?roomType=${rt.id}`} className="bg-brand text-white px-4 py-2 rounded font-bold block text-center">Book for ₹{rt.baseRate}</a>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      );
  }
}
