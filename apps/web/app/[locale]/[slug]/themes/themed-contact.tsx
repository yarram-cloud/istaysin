"use client";

import { ThemeStyleMap } from './theme-tokens';
import { useTranslations } from 'next-intl';

export default function ThemedContact({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  
  if (!config?.enabled) return null;

  // CMS overrides win over property-level fallbacks
  const email: string = config.email || property.contactEmail || '';
  const phone: string = config.phone || property.contactPhone || '';

  switch (themeTokens.templateId) {
     case 'modern-minimal':
       return (
         <section id="contact" className="py-40 bg-white px-8 text-center border-t border-surface-100" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[800px] mx-auto">
              <span
                className={`text-xs uppercase tracking-[0.3em] text-surface-500 mb-8 block font-medium ${themeTokens.fontBodyClass}`}
              >
                {config.title || 'Get in touch'}
              </span>
              <h2
                className={`text-5xl lg:text-7xl font-light tracking-tighter mb-16 ${themeTokens.fontHeadingClass}`}
              >
                 Let's Talk.
              </h2>
              <div
                className="grid gap-12 text-lg text-gray-600 font-light"
              >
                 {email && (
                   <a href={`mailto:${email}`} className="hover:text-black transition-colors block text-2xl md:text-4xl underline decoration-gray-200 underline-offset-8 hover:decoration-black">
                     {email}
                   </a>
                 )}
                 {phone && (
                   <p className="text-xl md:text-2xl">{phone}</p>
                 )}
              </div>
           </div>
         </section>
       );

     case 'luxury-gold':
       return (
         <section id="contact" className="py-40 bg-[#0A0A0A] px-8 relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand/5 to-transparent pointer-events-none" />
            <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
               <div
                  className="relative z-10"
               >
                  <span className={`text-brand uppercase tracking-[0.3em] text-[10px] font-bold block mb-8 ${themeTokens.fontBodyClass}`}>
                     {config.title || 'Inquiries'}
                  </span>
                  <h2 className={`text-5xl lg:text-7xl font-serif text-white mb-12 leading-[1.1] ${themeTokens.fontHeadingClass}`}>
                     At Your <br/><i className="text-brand">Service</i>
                  </h2>
                  <p className={`text-gray-400 text-lg font-light max-w-md ${themeTokens.fontBodyClass}`}>
                     Reach out to our dedicated concierge team for reservations, special requests, and inquiries.
                  </p>
               </div>
               
               <div
                 
                  className="bg-[#111] p-12 lg:p-16 border border-white/5 relative group"
               >
                  <div className="absolute inset-0 border border-brand/20 m-4 pointer-events-none transition-all duration-700 group-hover:m-6 group-hover:border-brand/40" />
                  <div className="space-y-12 relative z-10">
                     {phone && (
                       <div>
                          <span className={`text-xs text-brand uppercase tracking-[0.2em] font-bold block mb-4 ${themeTokens.fontBodyClass}`}>Call Us</span>
                          <a href={`tel:${phone}`} className={`text-3xl lg:text-4xl text-white font-serif hover:text-brand transition-colors block ${themeTokens.fontHeadingClass}`}>{phone}</a>
                       </div>
                     )}
                     {email && (
                       <div>
                          <span className={`text-xs text-brand uppercase tracking-[0.2em] font-bold block mb-4 ${themeTokens.fontBodyClass}`}>Email Us</span>
                          <a href={`mailto:${email}`} className={`text-xl lg:text-2xl text-white font-light hover:text-brand transition-colors block ${themeTokens.fontBodyClass}`}>{email}</a>
                       </div>
                     )}
                  </div>
               </div>
            </div>
         </section>
       );

     case 'nature-eco':
       return (
         <section id="contact" className="py-40 bg-surface-50 px-8 relative" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1000px] mx-auto bg-green-950 text-green-50 rounded-[4rem] p-12 lg:p-24 relative overflow-hidden text-center shadow-2xl">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-800/30 to-transparent pointer-events-none" />
               <div
                  className="relative z-10"
               >
                  <span className={`text-green-300 uppercase tracking-widest text-sm font-medium mb-6 block ${themeTokens.fontBodyClass}`}>
                     {config.title || 'Contact Us'}
                  </span>
                  <h2 className={`text-5xl lg:text-6xl text-white font-medium tracking-tight mb-16 ${themeTokens.fontHeadingClass}`}>
                     Reach Out Naturally
                  </h2>
                  <div className="grid md:grid-cols-2 gap-12 text-green-100">
                     {phone && (
                        <div className="p-8 bg-green-900/30 rounded-3xl border border-green-800/50 hover:bg-green-800/40 transition-colors">
                           <span className="text-3xl block mb-4 text-green-400">🌿</span>
                           <p className="text-sm tracking-widest uppercase mb-2 opacity-70">Phone</p>
                           <a href={`tel:${phone}`} className="text-2xl font-light hover:text-white transition-colors">{phone}</a>
                        </div>
                     )}
                     {email && (
                        <div className="p-8 bg-green-900/30 rounded-3xl border border-green-800/50 hover:bg-green-800/40 transition-colors">
                           <span className="text-3xl block mb-4 text-green-400">✉️</span>
                           <p className="text-sm tracking-widest uppercase mb-2 opacity-70">Email</p>
                           <a href={`mailto:${email}`} className="text-xl font-light hover:text-white transition-colors">{email}</a>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </section>
       );

     case 'boutique-chic':
       return (
         <section id="contact" className="py-32 bg-surface-50 px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
               <div
                  className="bg-white p-12 lg:p-16 shadow-xl border border-gray-100"
               >
                  <h2 className={`text-4xl lg:text-5xl font-bold text-gray-900 mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || 'Contact'}</h2>
                  <div className="w-16 h-1 bg-brand mb-12" />
                  
                  <div className="space-y-10">
                     {phone && (
                        <div>
                           <h3 className={`text-sm tracking-widest uppercase font-bold text-gray-400 mb-2 ${themeTokens.fontBodyClass}`}>Ring Us</h3>
                           <a href={`tel:${phone}`} className="text-2xl font-bold text-gray-900 hover:text-brand transition-colors block">{phone}</a>
                        </div>
                     )}
                     {email && (
                        <div>
                           <h3 className={`text-sm tracking-widest uppercase font-bold text-gray-400 mb-2 ${themeTokens.fontBodyClass}`}>Write Us</h3>
                           <a href={`mailto:${email}`} className="text-xl text-gray-600 border-b-2 border-brand pb-1 hover:text-brand transition-colors">{email}</a>
                        </div>
                     )}
                  </div>
               </div>
               <div
                 
                  className="hidden lg:block w-full aspect-[3/4] bg-surface-200"
               >
                  {/* Decorative element or secondary image could go here */}
                  <div className="w-full h-full bg-surface-200 border-8 border-white shadow-lg overflow-hidden flex items-center justify-center text-surface-400 font-bold uppercase tracking-widest text-sm text-center p-8">
                     Visual Context
                  </div>
               </div>
            </div>
         </section>
       );

     case 'dark-elegance':
       return (
         <section id="contact" className="py-40 bg-[#111] px-8 border-t border-white/5 text-center" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1000px] mx-auto">
               <h2
                  className={`text-5xl lg:text-7xl uppercase font-black text-white tracking-tighter mb-20 leading-[0.9] ${themeTokens.fontHeadingClass}`}
               >
                  {config.title || 'Connect'}.
               </h2>
               <div
                 
                  className="grid md:grid-cols-2 gap-12 text-left bg-[#0a0a0a] border border-white/10 p-12 lg:p-16 hover:border-white/20 transition-colors"
               >
                  {phone && (
                     <div className="md:border-r border-white/10">
                        <span className={`text-xs uppercase tracking-[0.4em] text-gray-500 font-bold block mb-6 ${themeTokens.fontBodyClass}`}>Telephone</span>
                        <a href={`tel:${phone}`} className="text-3xl text-white font-light hover:text-brand transition-colors block leading-none">{phone}</a>
                     </div>
                  )}
                  {email && (
                     <div className="md:pl-6">
                        <span className={`text-xs uppercase tracking-[0.4em] text-gray-500 font-bold block mb-6 ${themeTokens.fontBodyClass}`}>Electronic Mail</span>
                        <a href={`mailto:${email}`} className="text-xl text-white font-light hover:text-brand transition-colors block underline decoration-white/20 underline-offset-8 hover:decoration-brand">{email}</a>
                     </div>
                  )}
               </div>
            </div>
         </section>
       );

     case 'playful-vibrant':
       return (
         <section id="contact" className="py-32 bg-brand px-8 text-white relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute inset-0 pattern-dots pattern-white pattern-size-6 pattern-opacity-20" />
            <div className="max-w-[1200px] mx-auto text-center relative z-10">
               <h2
                 
                  className={`text-6xl md:text-8xl font-black drop-shadow-lg mb-16 ${themeTokens.fontHeadingClass}`}
               >
                  {config.title || "Let's Chat!"}
               </h2>
               <div
                 
                  className="flex flex-col md:flex-row justify-center gap-8 md:gap-16"
               >
                  {phone && (
                     <a href={`tel:${phone}`} className="bg-white text-brand px-12 py-8 rounded-[3rem] shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all group">
                        <span className="block text-4xl mb-4 group-hover:scale-110 transition-transform">📱</span>
                        <span className={`text-2xl font-black ${themeTokens.fontBodyClass}`}>{phone}</span>
                     </a>
                  )}
                  {email && (
                     <a href={`mailto:${email}`} className="bg-surface-900 text-white px-12 py-8 rounded-[3rem] shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all group border-4 border-surface-800">
                        <span className="block text-4xl mb-4 group-hover:scale-110 transition-transform">✉️</span>
                        <span className={`text-xl font-bold ${themeTokens.fontBodyClass}`}>{email}</span>
                     </a>
                  )}
               </div>
            </div>
         </section>
       );

     case 'corporate-trust':
       return (
         <section id="contact" className="py-32 bg-gray-900 text-white px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16">
               <div
               >
                  <h2 className={`text-4xl font-bold mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || 'Contact Directory'}</h2>
                  <div className="w-16 h-1.5 bg-brand mb-10" />
                  <p className={`text-gray-400 text-lg mb-12 ${themeTokens.fontBodyClass}`}>
                     Our dedicated corporate team is available to assist you with any inquiries or reservations.
                  </p>
               </div>
               <div
                  className="space-y-8 bg-gray-800 p-10 rounded-lg shadow-lg border border-gray-700"
               >
                  {phone && (
                     <div className="flex items-center gap-6 border-b border-gray-700 pb-8">
                        <div className="w-12 h-12 bg-gray-700 rounded-full items-center justify-center flex shrink-0 text-brand font-bold">P</div>
                        <div>
                           <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Direct Line</p>
                           <a href={`tel:${phone}`} className="text-2xl font-bold hover:text-brand transition-colors">{phone}</a>
                        </div>
                     </div>
                  )}
                  {email && (
                     <div className="flex items-center gap-6 pt-2">
                        <div className="w-12 h-12 bg-gray-700 rounded-full items-center justify-center flex shrink-0 text-brand font-bold">E</div>
                        <div>
                           <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Email Address</p>
                           <a href={`mailto:${email}`} className="text-xl font-medium hover:text-brand transition-colors">{email}</a>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </section>
       );

     case 'classic-heritage':
       return (
         <section id="contact" className="py-40 bg-[#fdfaf5] px-8 border-y-8 border-[#e8dfc8]" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1000px] mx-auto text-center">
               <div
               >
                  <h2 className={`text-5xl md:text-6xl font-serif text-yellow-950 mb-16 ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Enquiries'}
                  </h2>
               </div>
               <div
                 
                  className="bg-white border text-yellow-900 border-[#e8dfc8] p-16 shadow-2xl relative"
               >
                  <div className="absolute inset-4 border border-dashed border-[#e8dfc8] pointer-events-none" />
                  <div className="grid md:grid-cols-2 gap-12 relative z-10 divide-y md:divide-y-0 md:divide-x divide-[#e8dfc8]">
                     {phone && (
                        <div className="pb-8 md:pb-0 font-serif">
                           <p className="text-sm uppercase tracking-widest text-yellow-900/50 mb-6 font-sans font-bold">Telephone</p>
                           <a href={`tel:${phone}`} className="text-3xl hover:text-yellow-700 transition-colors block">{phone}</a>
                        </div>
                     )}
                     {email && (
                        <div className="pt-8 md:pt-0 font-serif">
                           <p className="text-sm uppercase tracking-widest text-yellow-900/50 mb-6 font-sans font-bold">Correspondence</p>
                           <a href={`mailto:${email}`} className="text-xl hover:text-yellow-700 transition-colors block">{email}</a>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </section>
       );

     case 'retro-vintage':
       return (
         <section id="contact" className="py-32 bg-[#E5E0D8] px-6 border-b-[8px] border-black" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[900px] mx-auto bg-[#4CA28A] border-[6px] border-black p-10 md:p-16 shadow-[16px_16px_0px_#000] relative transform -rotate-1">
               <div
                  className="bg-white border-4 border-black p-8 md:p-12"
               >
                  <h2 className={`text-5xl font-black uppercase mb-12 border-b-8 border-black pb-6 text-black ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Contact Desk'}
                  </h2>
                  <div className="space-y-10">
                     {phone && (
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                           <div className="bg-[#DF5339] border-4 border-black px-6 py-2 shrink-0">
                              <span className="font-black text-white uppercase text-xl">RING RING</span>
                           </div>
                           <a href={`tel:${phone}`} className={`text-4xl font-black text-black hover:text-[#DF5339] transition-colors ${themeTokens.fontBodyClass}`}>{phone}</a>
                        </div>
                     )}
                     {email && (
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                           <div className="bg-[#F2B94A] border-4 border-black px-6 py-2 shrink-0">
                              <span className="font-black text-black uppercase text-xl">MAIL MAN</span>
                           </div>
                           <a href={`mailto:${email}`} className={`text-2xl font-black text-black hover:underline underline-offset-8 decoration-4 ${themeTokens.fontBodyClass}`}>{email}</a>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </section>
       );

     case 'resort-tropical':
       return (
         <section id="contact" className="py-40 bg-teal-950 text-white px-8 relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-800/40 to-transparent blur-3xl rounded-full" />
            <div className="max-w-[1200px] mx-auto relative z-10 text-center">
               <span
                  className={`text-[#FF9F1C] font-bold uppercase tracking-[0.3em] text-sm mb-6 block ${themeTokens.fontBodyClass}`}
               >
                  {config.title || 'Connect With Us'}
               </span>
               <h2
                  className={`text-5xl lg:text-7xl font-black text-teal-50 mb-20 ${themeTokens.fontHeadingClass}`}
               >
                  Reach Paradise
               </h2>
               <div className="grid md:grid-cols-2 gap-12 text-teal-100">
                  {phone && (
                     <div
                       
                        className="bg-teal-900/40 p-12 rounded-[3rem] border border-teal-800 backdrop-blur-sm hover:bg-teal-800/50 transition-colors"
                     >
                        <span className="text-4xl block mb-6 drop-shadow-md">📞</span>
                        <a href={`tel:${phone}`} className="text-3xl font-bold hover:text-white transition-colors block">{phone}</a>
                     </div>
                  )}
                  {email && (
                     <div
                       
                        className="bg-teal-900/40 p-12 rounded-[3rem] border border-teal-800 backdrop-blur-sm hover:bg-teal-800/50 transition-colors"
                     >
                        <span className="text-4xl block mb-6 drop-shadow-md">💌</span>
                        <a href={`mailto:${email}`} className="text-xl font-medium hover:text-white transition-colors block">{email}</a>
                     </div>
                  )}
               </div>
            </div>
         </section>
       );

     case 'compact-urban':
       return (
         <section id="contact" className="py-24 bg-surface-900 text-white px-6" style={{ scrollMarginTop: '80px' }}>
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end border-t border-white/20 pt-16">
               <div
                  className="mb-12 md:mb-0"
               >
                  <h2 className={`text-4xl font-bold mb-6 ${themeTokens.fontHeadingClass}`}>{config.title || 'Hit Us Up'}</h2>
                  <div className="w-12 h-1 bg-brand" />
               </div>
               <div
                  className="space-y-6 text-right w-full md:w-auto"
               >
                  {phone && (
                     <div className="flex flex-col md:items-end border-b border-white/10 pb-4">
                        <span className="text-xs uppercase tracking-widest text-surface-400 mb-2 font-bold block">T.</span>
                        <a href={`tel:${phone}`} className="text-2xl font-bold hover:text-brand transition-colors text-right">{phone}</a>
                     </div>
                  )}
                  {email && (
                     <div className="flex flex-col md:items-end">
                        <span className="text-xs uppercase tracking-widest text-surface-400 mb-2 font-bold block">E.</span>
                        <a href={`mailto:${email}`} className="text-lg hover:text-brand transition-colors text-right">{email}</a>
                     </div>
                  )}
               </div>
            </div>
         </section>
       );

     case 'abstract-art':
       return (
         <section id="contact" className="py-40 bg-brand text-white px-8 relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
            <div className="absolute top-0 right-0 w-2/3 h-full bg-black transform skew-x-[-20deg] origin-top-right -z-10" />
            <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-20 items-center">
               <div
               >
                  <h2 className={`text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.8] mix-blend-difference text-white mb-8 ${themeTokens.fontHeadingClass}`}>
                     {config.title || 'Say Hello'}
                  </h2>
               </div>
               <div
                 
                  className="bg-white p-12 shadow-2xl relative"
               >
                  <div className="absolute -inset-4 border-4 border-white pointer-events-none" />
                  <div className="space-y-12">
                     {phone && (
                        <div>
                           <p className="font-black text-gray-300 text-sm uppercase tracking-widest mb-2">Voice</p>
                           <a href={`tel:${phone}`} className={`text-5xl lg:text-6xl font-black text-gray-900 block hover:text-brand transition-colors tracking-tighter ${themeTokens.fontHeadingClass}`}>{phone}</a>
                        </div>
                     )}
                     {email && (
                        <div>
                           <p className="font-black text-gray-300 text-sm uppercase tracking-widest mb-2">Digital</p>
                           <a href={`mailto:${email}`} className={`text-2xl font-black text-gray-900 block hover:text-brand transition-colors tracking-tight underline decoration-4 underline-offset-8 decoration-gray-200 hover:decoration-brand ${themeTokens.fontHeadingClass}`}>{email}</a>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </section>
       );

     case 'scandinavian-frost':
       return (
         <section id="contact" className="py-32 bg-white px-8 text-center border-t border-slate-100" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[800px] mx-auto"><div className="w-12 h-[2px] bg-slate-300 mx-auto mb-10" /><h2 className={`text-5xl font-extralight tracking-tight text-slate-800 mb-16 ${themeTokens.fontHeadingClass}`}>{config.title || 'Get in Touch'}</h2><div className="space-y-8">{email && <a href={`mailto:${email}`} className="block text-2xl md:text-3xl text-slate-400 hover:text-slate-800 transition-colors font-light">{email}</a>}{phone && <p className="text-xl text-slate-400 font-light">{phone}</p>}</div></div>
         </section>
       );

     case 'art-deco-glam':
       return (
         <section id="contact" className="py-40 bg-[#0D0D0D] px-8 relative overflow-hidden" style={{ scrollMarginTop: '100px' }}>
           <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
           <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-20 items-center"><div><div className="flex items-center gap-4 mb-8"><div className="w-12 h-px bg-[#D4AF37]" /><span className="text-[#D4AF37] tracking-[0.4em] uppercase text-xs font-medium">Inquiries</span></div><h2 className={`text-5xl lg:text-7xl font-bold text-white mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || 'At Your Service'}</h2></div><div className="border border-[#D4AF37]/20 p-12 space-y-10">{phone && <div><span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-bold block mb-4">Telephone</span><a href={`tel:${phone}`} className="text-3xl text-white font-bold hover:text-[#D4AF37] transition-colors">{phone}</a></div>}{email && <div><span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-bold block mb-4">Email</span><a href={`mailto:${email}`} className="text-xl text-gray-400 hover:text-[#D4AF37] transition-colors">{email}</a></div>}</div></div>
         </section>
       );

     case 'japanese-zen':
       return (
         <section id="contact" className="py-32 bg-[#F5F0EB] px-8 text-center" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[800px] mx-auto"><div className="w-16 h-[1px] bg-[#8B7355]/40 mx-auto mb-10" /><h2 className={`text-4xl md:text-5xl font-extralight text-[#3D3028] mb-16 ${themeTokens.fontHeadingClass}`}>{config.title || 'Reach Us'}</h2><div className="space-y-8">{email && <a href={`mailto:${email}`} className="block text-xl text-[#8B7355] hover:text-[#3D3028] transition-colors font-light">{email}</a>}{phone && <p className="text-lg text-[#8B7355] font-light">{phone}</p>}</div></div>
         </section>
       );

     case 'mediterranean-sun':
       return (
         <section id="contact" className="py-32 bg-[#FFF7ED] px-8" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 items-center"><div><div className="inline-block bg-[#C2410C]/10 text-[#C2410C] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">Contact</div><h2 className={`text-5xl font-bold text-[#431407] mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || 'Get in Touch'}</h2></div><div className="bg-white rounded-2xl p-10 shadow-lg border border-orange-100 space-y-8">{phone && <div><span className="text-[#C2410C] text-xs uppercase tracking-widest font-bold block mb-2">Phone</span><a href={`tel:${phone}`} className="text-2xl font-bold text-[#431407] hover:text-[#C2410C] transition-colors">{phone}</a></div>}{email && <div><span className="text-[#C2410C] text-xs uppercase tracking-widest font-bold block mb-2">Email</span><a href={`mailto:${email}`} className="text-lg text-[#9A3412] hover:text-[#C2410C] transition-colors">{email}</a></div>}</div></div>
         </section>
       );

     case 'industrial-loft':
       return (
         <section id="contact" className="py-32 bg-[#1C1917] text-white px-8 border-t border-stone-700" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16"><div><span className="text-stone-500 font-mono text-xs tracking-widest uppercase">Contact</span><div className="w-16 h-px bg-stone-700 my-6" /><h2 className={`text-5xl md:text-6xl font-black uppercase tracking-tighter text-white ${themeTokens.fontHeadingClass}`}>{config.title || 'Get in Touch'}</h2></div><div className="space-y-8 border-l border-stone-700 pl-12">{phone && <div><span className="text-stone-500 font-mono text-xs tracking-widest uppercase block mb-2">Tel</span><a href={`tel:${phone}`} className="text-2xl font-bold text-[#F97316] hover:text-white transition-colors">{phone}</a></div>}{email && <div><span className="text-stone-500 font-mono text-xs tracking-widest uppercase block mb-2">Email</span><a href={`mailto:${email}`} className="text-lg text-stone-400 hover:text-[#F97316] transition-colors">{email}</a></div>}</div></div>
         </section>
       );

     case 'royal-palace':
       return (
         <section id="contact" className="py-40 bg-gradient-to-b from-[#0F0320] to-[#0A0118] text-white px-8 text-center" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[1000px] mx-auto"><div className="flex justify-center mb-8"><div className="w-px h-12 bg-gradient-to-b from-transparent via-purple-500 to-transparent" /></div><h2 className={`text-5xl lg:text-7xl font-light text-white mb-16 ${themeTokens.fontHeadingClass}`}>{config.title || 'Concierge'}</h2><div className="grid md:grid-cols-2 gap-8">{phone && <div className="border border-purple-500/20 p-10 hover:border-purple-400/50 transition-colors"><span className="text-purple-300/50 tracking-[0.3em] uppercase text-xs block mb-4">Telephone</span><a href={`tel:${phone}`} className="text-2xl text-white font-light hover:text-purple-300 transition-colors">{phone}</a></div>}{email && <div className="border border-purple-500/20 p-10 hover:border-purple-400/50 transition-colors"><span className="text-purple-300/50 tracking-[0.3em] uppercase text-xs block mb-4">Email</span><a href={`mailto:${email}`} className="text-lg text-purple-200/70 hover:text-white transition-colors">{email}</a></div>}</div></div>
         </section>
       );

     case 'coastal-breeze':
       return (
         <section id="contact" className="py-32 bg-gradient-to-b from-white to-sky-50 px-8" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 items-center"><div><div className="inline-flex items-center gap-3 mb-6"><div className="w-10 h-[2px] bg-sky-400" /><span className="text-sky-500 text-xs font-bold tracking-[0.2em] uppercase">Contact</span></div><h2 className={`text-5xl font-bold text-slate-800 mb-8 ${themeTokens.fontHeadingClass}`}>{config.title || 'Say Hello'}</h2></div><div className="bg-white rounded-[2rem] p-10 shadow-xl border border-sky-100 space-y-8">{phone && <div><span className="text-sky-500 text-xs uppercase tracking-widest font-bold block mb-2">Phone</span><a href={`tel:${phone}`} className="text-2xl font-bold text-slate-800 hover:text-sky-600 transition-colors">{phone}</a></div>}{email && <div><span className="text-sky-500 text-xs uppercase tracking-widest font-bold block mb-2">Email</span><a href={`mailto:${email}`} className="text-lg text-slate-500 hover:text-sky-600 transition-colors">{email}</a></div>}</div></div>
         </section>
       );

     case 'neo-brutalist':
       return (
         <section id="contact" className="py-32 bg-[#FEF3C7] px-6 border-t-[6px] border-black" style={{ scrollMarginTop: '100px' }}>
           <div className="max-w-[900px] mx-auto bg-white border-[6px] border-black p-10 md:p-16 shadow-[12px_12px_0px_#F97316]"><h2 className={`text-5xl font-black uppercase text-black mb-12 border-b-[6px] border-black pb-6 ${themeTokens.fontHeadingClass}`}>{config.title || 'Contact'}</h2><div className="space-y-8">{phone && <div className="flex flex-col md:flex-row md:items-center gap-4"><div className="bg-[#F97316] border-4 border-black px-6 py-2 shrink-0"><span className="font-black text-black uppercase">CALL US</span></div><a href={`tel:${phone}`} className="text-3xl font-black text-black hover:text-[#F97316] transition-colors">{phone}</a></div>}{email && <div className="flex flex-col md:flex-row md:items-center gap-4"><div className="bg-black border-4 border-black px-6 py-2 shrink-0"><span className="font-black text-[#F97316] uppercase">EMAIL</span></div><a href={`mailto:${email}`} className="text-xl font-black text-black hover:underline underline-offset-8 decoration-4">{email}</a></div>}</div></div>
         </section>
       );

     default: // fallback generic
       return (
         <section id="contact" className="py-24 bg-surface-50 px-8" style={{ scrollMarginTop: '100px' }}>
            <div className="max-w-[1000px] mx-auto text-center">
               <h2 className={`text-4xl font-bold text-gray-900 mb-12 ${themeTokens.fontHeadingClass}`}>{config.title || 'Contact Us'}</h2>
               <div className="grid md:grid-cols-2 gap-8">
                  {phone && (
                     <div className="bg-white p-8 rounded shadow-sm border border-surface-200">
                        <h3 className={`text-lg font-bold text-gray-500 uppercase tracking-widest mb-4 ${themeTokens.fontBodyClass}`}>Phone</h3>
                        <a href={`tel:${phone}`} className="text-2xl font-bold text-brand hover:underline">{phone}</a>
                     </div>
                  )}
                  {email && (
                     <div className="bg-white p-8 rounded shadow-sm border border-surface-200">
                        <h3 className={`text-lg font-bold text-gray-500 uppercase tracking-widest mb-4 ${themeTokens.fontBodyClass}`}>Email</h3>
                        <a href={`mailto:${email}`} className="text-xl text-gray-700 hover:text-brand hover:underline">{email}</a>
                     </div>
                  )}
               </div>
            </div>
         </section>
       );
  }
}
