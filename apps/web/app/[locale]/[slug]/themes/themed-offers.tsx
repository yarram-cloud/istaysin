"use client";

import { ThemeStyleMap } from './theme-tokens';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function ThemedOffers({ config, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');

  if (!config?.enabled || !config?.items || config.items.length === 0) return null;

  const offers = config.items;

  switch (themeTokens.templateId) {
     case 'modern-minimal':
       return (
         <section className="py-24 bg-surface-50 px-8">
           <div className="max-w-[1200px] mx-auto text-center">
             <h2 className={`text-4xl font-light mb-16 ${themeTokens.fontHeadingClass}`}>{config.title || t('offers')}</h2>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
               {offers.map((offer: any, i: number) => (
                 <motion.div key={i} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} className="bg-white p-8 shadow-sm group hover:shadow-xl transition-shadow cursor-pointer">
                   {offer.image && <div className="aspect-video mb-6 overflow-hidden bg-surface-100"><img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>}
                   <span className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-2 block">{offer.validity || 'Limited Time'}</span>
                   <h3 className={`text-2xl font-medium mb-4 ${themeTokens.fontHeadingClass}`}>{offer.title}</h3>
                   <p className={`text-surface-600 mb-6 line-clamp-3 ${themeTokens.fontBodyClass}`}>{offer.description}</p>
                   <button style={{ color: 'var(--brand-color)' }} className="uppercase text-sm tracking-widest font-bold">Claim Offer →</button>
                 </motion.div>
               ))}
             </div>
           </div>
         </section>
       );

     case 'luxury-gold':
       return (
         <section className="py-32 bg-[#0A0A0A] px-8 border-y border-white/5 relative">
            <div className="max-w-[1400px] mx-auto">
               <div className="text-center mb-20">
                 <span className={`text-brand uppercase tracking-[0.3em] text-[10px] font-bold block mb-4 ${themeTokens.fontBodyClass}`}>Exclusive</span>
                 <h2 className={`text-5xl font-serif text-white ${themeTokens.fontHeadingClass}`}>{config.title || 'Curated Offers'}</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-12">
                 {offers.map((offer: any, i: number) => (
                   <motion.div key={i} initial={{opacity: 0, scale: 0.95}} whileInView={{opacity: 1, scale: 1}} className="flex flex-col md:flex-row bg-[#111] border border-white/10 group cursor-pointer hover:border-brand/50 transition-colors">
                     {offer.image && <div className="w-full md:w-1/2 aspect-square md:aspect-auto overflow-hidden"><img src={offer.image} alt={offer.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" /></div>}
                     <div className="p-10 flex flex-col justify-center md:w-1/2">
                       <h3 className={`text-2xl text-white font-serif mb-4 ${themeTokens.fontHeadingClass}`}>{offer.title}</h3>
                       <p className={`text-gray-400 font-light mb-8 ${themeTokens.fontBodyClass}`}>{offer.description}</p>
                       <p className="text-brand uppercase text-xs tracking-widest font-bold mb-8">Valid: {offer.validity || 'Always'}</p>
                       <button className="border border-brand/50 text-brand px-8 py-3 uppercase tracking-[0.2em] text-xs hover:bg-brand hover:text-black transition-colors w-max">Redeem</button>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     case 'playful-vibrant':
       return (
         <section className="py-24 bg-white px-8">
            <div className="max-w-[1200px] mx-auto">
               <h2 className={`text-5xl font-black text-center mb-16 ${themeTokens.fontHeadingClass}`}>{config.title || 'Special Deals'} 🎁</h2>
               <div className="grid lg:grid-cols-3 gap-10">
                 {offers.map((offer: any, i: number) => (
                   <motion.div key={i} initial={{opacity: 0, y: 30}} whileInView={{opacity: 1, y: 0}} whileHover={{y: -10}} className={`rounded-[3rem] p-8 shadow-xl ${i % 2 === 0 ? 'bg-surface-50' : 'bg-[color:var(--brand-color,#000)] text-white'}`}>
                     {offer.image && <div className="w-full aspect-square rounded-[2rem] overflow-hidden mb-8"><img src={offer.image} alt={offer.title} className="w-full h-full object-cover" /></div>}
                     <h3 className={`text-3xl font-black mb-4 leading-tight ${themeTokens.fontHeadingClass}`}>{offer.title}</h3>
                     <p className={`opacity-80 mb-8 font-medium ${themeTokens.fontBodyClass}`}>{offer.description}</p>
                     <button className={`w-full py-4 rounded-full font-bold uppercase tracking-widest ${i % 2 === 0 ? 'bg-[color:var(--brand-color,#000)] text-white' : 'bg-white text-[color:var(--brand-color,#000)]'}`}>Get It Now</button>
                   </motion.div>
                 ))}
               </div>
            </div>
         </section>
       );

     // For all other archetypes, map them back to a generic nice grid
     default:
       return (
         <section className="py-24 bg-surface-50 px-8">
           <div className="max-w-[1200px] mx-auto">
             <div className="flex items-end justify-between mb-16 border-b border-surface-200 pb-6">
               <h2 className={`text-4xl font-bold ${themeTokens.fontHeadingClass}`}>{config.title || t('offers')}</h2>
               <a href="#" style={{ color: 'var(--brand-color)' }} className="font-bold uppercase tracking-widest text-sm hover:underline">View All</a>
             </div>
             <div className="flex overflow-x-auto gap-8 pb-12 snap-x snap-mandatory hide-scrollbar">
               {offers.map((offer: any, i: number) => (
                 <div key={i} className="min-w-[85vw] md:min-w-[400px] snap-center bg-white border border-surface-200 group">
                   {offer.image && <div className="aspect-[4/3] overflow-hidden bg-surface-100"><img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                   <div className="p-8">
                     <span className="inline-block px-3 py-1 bg-surface-100 text-surface-600 text-xs font-bold uppercase mb-4">{offer.validity || 'Promotional'}</span>
                     <h3 className={`text-xl font-bold mb-3 ${themeTokens.fontHeadingClass}`}>{offer.title}</h3>
                     <p className={`text-surface-500 mb-6 line-clamp-3 ${themeTokens.fontBodyClass}`}>{offer.description}</p>
                     <button style={{ backgroundColor: 'var(--brand-color)' }} className="px-6 py-3 text-white font-bold text-sm">Book This Offer</button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </section>
       );
  }
}
