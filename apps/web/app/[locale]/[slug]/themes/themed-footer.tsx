'use client';
import { ThemeStyleMap } from './theme-tokens';
import { useTranslations } from 'next-intl';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function ThemedFooter({
  config,
  contact,
  property,
  themeTokens,
}: {
  config: any;
  contact?: any;
  property: any;
  themeTokens: ThemeStyleMap;
}) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;

  const quickLinks = [
    { href: '#about', label: t('about') },
    { href: '#rooms', label: t('rooms') },
    { href: '#gallery', label: t('gallery') },
    { href: '#amenities', label: t('amenities') }
  ];

  const currentYear = new Date().getFullYear();

  // CMS overrides take priority over property-level fallbacks
  const email: string = contact?.email || property.contactEmail || '';
  const phone: string = contact?.phone || property.contactPhone || '';
  const address: string = contact?.address || property.address || '';
  const copyrightText: string =
    (config.text && String(config.text).trim()) ||
    `© ${currentYear} ${property.name}. All rights reserved.`;

  const socialLinks: Record<string, string> = config.socialLinks || {};
  const socialItems: Array<{ key: string; href: string; Icon: any; label: string }> = [
    { key: 'facebook', href: socialLinks.facebook || '', Icon: Facebook, label: 'Facebook' },
    { key: 'instagram', href: socialLinks.instagram || '', Icon: Instagram, label: 'Instagram' },
    { key: 'twitter', href: socialLinks.twitter || '', Icon: Twitter, label: 'Twitter / X' },
  ].filter((s) => s.href.trim().length > 0);

  const SocialBar = () => {
    if (socialItems.length === 0) return null;
    return (
      <div className="flex items-center justify-center gap-4 mt-10">
        {socialItems.map(({ key, href, Icon, label }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="w-10 h-10 rounded-full border border-current/20 flex items-center justify-center hover:bg-current/10 transition-colors opacity-80 hover:opacity-100"
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
      </div>
    );
  };

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <footer className="bg-black text-white py-32 px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col items-center flex-col text-center">
            <h4 className={`text-5xl lg:text-7xl tracking-tighter font-light mb-16 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
            <div className="flex justify-center gap-10 md:gap-20 mb-24">
              {quickLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-sm text-gray-500 hover:text-white transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </div>
            <address className={`not-italic text-gray-400 font-light mb-24 space-y-4 text-xl ${themeTokens.fontBodyClass}`}>
               <p>{address}, {property.city}</p>
               {phone && <p>{phone}</p>}
               {email && <a href={`mailto:${email}`} className="block hover:text-white">{email}</a>}
            </address>
            <div className={`w-full border-t border-gray-800 pt-10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 ${themeTokens.fontBodyClass}`}>
              <div className="flex gap-8">
                <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              </div>
              <p className="mt-6 md:mt-0">{copyrightText}</p>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'luxury-gold':
      return (
        <footer className="bg-[#0A0A0A] text-gray-400 py-32 px-8 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 pb-24">
            <div className="md:col-span-5 md:pr-16">
              <h4 className={`text-5xl lg:text-6xl text-white mb-8 tracking-tighter font-serif ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
              <p className={`text-gray-500 max-w-sm text-lg font-light leading-relaxed ${themeTokens.fontBodyClass}`}>{property.description || 'Experience truly luxurious living'}</p>
            </div>
            <div className="md:col-span-3">
              <h5 className={`text-white uppercase tracking-[0.3em] text-xs font-bold mb-8 ${themeTokens.fontHeadingClass}`}>Explore</h5>
              <ul className={`space-y-6 text-sm font-light uppercase tracking-widest ${themeTokens.fontBodyClass}`}>
                {quickLinks.map(link => (
                  <li key={link.href}><a href={link.href} className="hover:text-brand transition-colors flex items-center gap-4"><span className="w-4 h-px bg-brand/50"></span> {link.label}</a></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-4 pl-0 md:pl-12">
               <h5 className={`text-white uppercase tracking-[0.3em] text-xs font-bold mb-8 ${themeTokens.fontHeadingClass}`}>Contact</h5>
              <address className={`not-italic space-y-6 text-base font-light ${themeTokens.fontBodyClass}`}>
                <p className="text-gray-300">{address}<br/>{property.city}</p>
                {email && (
                  <p><a href={`mailto:${email}`} className="text-brand hover:text-white transition-colors">{email}</a></p>
                )}
                {phone && <p>{phone}</p>}
              </address>
            </div>
          </div>
          <div className={`max-w-[1400px] mx-auto mt-8 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gray-600 ${themeTokens.fontBodyClass}`}>
            <p>{copyrightText}</p>
            <div className="flex gap-10 mt-6 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'nature-eco':
      return (
        <footer className="bg-green-950 text-green-50 py-32 px-10 rounded-t-[3rem] -mt-10 relative z-20 overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
            <div className="md:col-span-2">
               <h4 className={`text-5xl lg:text-7xl font-medium tracking-tight mb-8 text-white ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
               <p className={`text-green-800/80 max-w-md text-xl leading-relaxed ${themeTokens.fontBodyClass} text-green-100/70`}>A natural sanctuary for the mindful traveler.</p>
            </div>
            <div>
               <h5 className={`font-semibold mb-8 text-lg ${themeTokens.fontHeadingClass}`}>Navigate</h5>
               <ul className={`space-y-4 font-light text-green-200/80 ${themeTokens.fontBodyClass}`}>
                 {quickLinks.map(link => (
                   <li key={link.href}><a href={link.href} className="hover:text-white hover:pl-2 transition-all">{link.label}</a></li>
                 ))}
               </ul>
            </div>
            <div>
               <h5 className={`font-semibold mb-8 text-lg ${themeTokens.fontHeadingClass}`}>Visit Us</h5>
               <address className={`not-italic space-y-4 font-light text-green-200/80 ${themeTokens.fontBodyClass}`}>
                 <p>{address}, <br/>{property.city}</p>
                 {email && <p><a href={`mailto:${email}`} className="hover:text-white underline underline-offset-4 decoration-green-800">{email}</a></p>}
               </address>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto mt-24 pt-8 border-t border-green-900 flex flex-col md:flex-row items-center justify-between text-sm text-green-900/50 text-green-300">
             <p>{copyrightText}</p>
             <div className="flex gap-6 mt-4 md:mt-0">
               <a href="#" className="hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-white transition-colors">Terms</a>
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'boutique-chic':
      return (
        <footer className="bg-white text-gray-900 py-32 px-8 border-t border-gray-100">
           <div className="max-w-[1200px] mx-auto flex flex-col items-center">
              <h4 className={`text-6xl text-center font-bold mb-16 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
              <nav className="flex justify-center gap-12 mb-20 text-sm font-bold uppercase tracking-widest text-gray-400">
                 {quickLinks.map(link => (
                   <a key={link.href} href={link.href} className="hover:text-brand transition-colors">{link.label}</a>
                 ))}
              </nav>
              <div className="w-16 h-[2px] bg-brand/30 mb-20" />
              <address className={`text-center not-italic text-lg text-gray-500 space-y-6 ${themeTokens.fontBodyClass}`}>
                 <p className="font-semibold text-gray-700">{address}, {property.city}</p>
                 <div className="flex justify-center gap-8">
                   {phone && <a href={`tel:${phone}`} className="hover:text-brand transition-colors">{phone}</a>}
                   {email && <a href={`mailto:${email}`} className="hover:text-brand border-b-2 border-brand pb-1 transition-colors">{email}</a>}
                 </div>
              </address>
           </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'dark-elegance':
      return (
        <footer className="bg-[#050505] text-gray-500 py-40 px-8 border-t border-white/5">
           <div className="max-w-[1500px] mx-auto grid lg:grid-cols-12 gap-20">
              <div className="lg:col-span-5">
                 <h4 className={`text-5xl lg:text-7xl uppercase font-black text-white tracking-tighter mb-10 leading-[0.8] ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
                 <address className={`not-italic text-xl font-light space-y-4 ${themeTokens.fontBodyClass}`}>
                   <p>{address}</p>
                   <p>{property.city}</p>
                   <div className="pt-8 space-y-2">
                     {phone && <p className="text-white font-bold">{phone}</p>}
                     {email && <p><a href={`mailto:${email}`} className="hover:text-white transition-colors text-white underline decoration-white/20 underline-offset-8">{email}</a></p>}
                   </div>
                 </address>
              </div>
              <div className="lg:col-span-3 lg:col-start-8">
                 <h5 className={`text-xs uppercase tracking-[4px] text-white font-bold mb-10 ${themeTokens.fontBodyClass}`}>Index</h5>
                 <ul className={`space-y-6 font-light text-xl ${themeTokens.fontBodyClass}`}>
                   {quickLinks.map(link => (
                     <li key={link.href}><a href={link.href} className="hover:text-white hover:mr-4 transition-all block">{link.label}</a></li>
                   ))}
                 </ul>
              </div>
           </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'playful-vibrant':
      return (
        <footer className={`bg-gradient-to-br from-surface-100 to-white py-32 px-8 relative overflow-hidden rounded-t-[4rem] -mt-16 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]`}>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400/5 blur-[80px] rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none" />
          
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
             <div className="bg-white inline-block px-12 py-6 rounded-full shadow-lg shadow-brand/10 mb-16 border border-gray-100">
               <h4 className={`text-4xl md:text-5xl font-black text-gray-900 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
             </div>
             
             <div className="flex flex-wrap justify-center gap-6 mb-20">
               {quickLinks.map(link => (
                 <a key={link.href} href={link.href} className={`bg-white px-8 py-4 rounded-[2rem] font-bold text-gray-600 hover:text-white hover:bg-brand shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all ${themeTokens.fontBodyClass}`}>{link.label}</a>
               ))}
             </div>
             
             <div className="bg-surface-900 text-white p-12 rounded-[3rem] shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
               <address className={`not-italic text-left font-medium text-lg leading-relaxed ${themeTokens.fontBodyClass}`}>
                 <span className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-2">Location</span>
                 {address}, <br/>{property.city}
               </address>
               <div className="w-px h-16 bg-white/20 hidden md:block" />
               <div className="text-left font-medium text-lg space-y-2">
                 <span className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-2">Say Hello</span>
                 {email && <a href={`mailto:${email}`} className={`block hover:text-brand transition-colors text-white ${themeTokens.fontBodyClass}`}>{email}</a>}
                 {phone && <p>{phone}</p>}
               </div>
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'corporate-trust':
      return (
        <footer className="bg-blue-950 text-white py-24 px-8 border-t-4 border-brand">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20">
             <div className="md:col-span-1">
                <h4 className={`text-3xl font-bold mb-6 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
                <p className={`text-blue-200 text-sm leading-relaxed mb-8 ${themeTokens.fontBodyClass}`}>{property.description || 'Delivering excellence in hospitality.'}</p>
             </div>
             <div>
                <h5 className={`font-semibold mb-6 text-sm uppercase tracking-wider text-blue-300 ${themeTokens.fontBodyClass}`}>Corporate</h5>
                <ul className="space-y-4 text-blue-100 text-sm">
                  {quickLinks.map(link => (
                    <li key={link.href}><a href={link.href} className="hover:text-white hover:underline transition-all">{link.label}</a></li>
                  ))}
                </ul>
             </div>
             <div className="md:col-span-2">
                <h5 className={`font-semibold mb-6 text-sm uppercase tracking-wider text-blue-300 ${themeTokens.fontBodyClass}`}>Contact Information</h5>
                <address className={`not-italic text-sm text-blue-100 space-y-4 grid md:grid-cols-2 gap-4 ${themeTokens.fontBodyClass}`}>
                   <div>
                     <strong className="block text-white mb-2">Headquarters</strong>
                     <p>{address}</p>
                     <p>{property.city}</p>
                   </div>
                   <div>
                     <strong className="block text-white mb-2">Connect</strong>
                     {phone && <p>Phone: {phone}</p>}
                     {email && <p>Email: <a href={`mailto:${email}`} className="hover:underline">{email}</a></p>}
                   </div>
                </address>
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-blue-900/50 flex flex-col md:flex-row items-center justify-between text-xs text-blue-400">
             <p>{copyrightText}</p>
             <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                <a href="#" className="hover:text-white transition-colors">Legal Disclaimer</a>
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'classic-heritage':
      return (
        <footer className="bg-[#fdfaf5] text-yellow-900 py-32 px-8 border-t-[16px] border-[#e8dfc8] relative">
          <div className="max-w-[1200px] mx-auto">
             <div className="flex justify-center mb-16">
               <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#c6a87c] to-transparent" />
             </div>
             <h4 className={`text-6xl text-center font-serif text-yellow-950 mb-20 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
             
             <div className="grid md:grid-cols-3 gap-16 text-center border-y border-[#e8dfc8] py-16">
               <div>
                  <h5 className={`text-sm uppercase tracking-[0.2em] font-serif font-bold mb-6 text-yellow-900/70`}>Navigation</h5>
                  <ul className={`space-y-4 ${themeTokens.fontBodyClass}`}>
                    {quickLinks.map(link => (
                      <li key={link.href}><a href={link.href} className="hover:text-yellow-700 transition-colors">{link.label}</a></li>
                    ))}
                  </ul>
               </div>
               <div className="border-x border-[#e8dfc8] px-8">
                  <h5 className={`text-sm uppercase tracking-[0.2em] font-serif font-bold mb-6 text-yellow-900/70`}>Enquiries</h5>
                  <address className={`not-italic space-y-4 ${themeTokens.fontBodyClass}`}>
                    {phone && <p><a href={`tel:${phone}`} className="hover:text-yellow-700 text-lg">{phone}</a></p>}
                    {email && <p><a href={`mailto:${email}`} className="hover:text-yellow-700 underline decoration-[#e8dfc8] underline-offset-4">{email}</a></p>}
                  </address>
               </div>
               <div>
                  <h5 className={`text-sm uppercase tracking-[0.2em] font-serif font-bold mb-6 text-yellow-900/70`}>Location</h5>
                   <address className={`not-italic space-y-2 ${themeTokens.fontBodyClass}`}>
                     <p>{address}</p>
                     <p>{property.city}</p>
                   </address>
               </div>
             </div>
             
             <div className="flex justify-center mt-16 text-xs uppercase tracking-[0.2em] font-serif text-yellow-900/50">
                Est. {currentYear}
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'retro-vintage':
      return (
        <footer className="bg-[#E5E0D8] py-24 border-t-[8px] border-black text-black">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16">
            <div className="bg-[#DF5339] border-[6px] border-black p-12 shadow-[12px_12px_0px_#000]">
               <h4 className={`text-6xl font-black uppercase leading-none mb-10 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
               <nav className="flex flex-col gap-4 font-black uppercase text-xl">
                 {quickLinks.map(link => (
                   <a key={link.href} href={link.href} className="text-black hover:text-white flex items-center justify-between group border-b-4 border-black pb-2">
                     {link.label}
                     <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                   </a>
                 ))}
               </nav>
            </div>
            <div className="bg-white border-[6px] border-black p-12 shadow-[12px_12px_0px_#000]">
               <h5 className={`text-2xl font-black uppercase mb-10 border-b-4 border-black pb-4 ${themeTokens.fontHeadingClass}`}>Contact Desk</h5>
               <address className={`not-italic font-bold text-lg space-y-6 ${themeTokens.fontBodyClass}`}>
                 <div className="flex gap-4">
                   <div className="w-8 h-8 bg-[#F2B94A] border-2 border-black shrink-0" />
                   <div>
                     <p>{address}</p>
                     <p>{property.city}</p>
                   </div>
                 </div>
                 {email && (
                   <div className="flex gap-4 items-center">
                     <div className="w-8 h-8 bg-[#4CA28A] rounded-full border-2 border-black shrink-0" />
                     <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                   </div>
                 )}
               </address>
            </div>
          </div>
          <div className="max-w-[1200px] mx-auto px-6 mt-16 font-black uppercase text-sm border-t-4 border-black pt-8 flex justify-between">
            <p>{copyrightText}</p>
            <p>Built Solid</p>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'resort-tropical':
      return (
        <footer className="bg-teal-950 text-white py-32 px-8 border-t border-teal-800 relative z-20">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
             <div className="lg:col-span-5 bg-teal-900/50 p-12 rounded-[3rem] border border-teal-800">
               <h4 className={`text-5xl font-black mb-8 text-[#FF9F1C] ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
               <address className={`not-italic text-lg text-teal-100/80 leading-relaxed font-light space-y-6 ${themeTokens.fontBodyClass}`}>
                 <p className="flex items-start gap-4">📍 <span>{address}<br/>{property.city}</span></p>
                 {email && <p className="flex items-center gap-4">📧 <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a></p>}
                 {phone && <p className="flex items-center gap-4">📞 {phone}</p>}
               </address>
             </div>
             <div className="lg:col-span-7 grid grid-cols-2 gap-12 lg:pl-16 p-12">
               <div>
                  <h5 className={`font-bold uppercase tracking-widest text-teal-400 mb-10 ${themeTokens.fontHeadingClass}`}>Resort Areas</h5>
                  <ul className={`space-y-6 text-lg font-medium text-teal-100 ${themeTokens.fontBodyClass}`}>
                    {quickLinks.map(link => (
                      <li key={link.href}><a href={link.href} className="hover:text-[#FF9F1C] transition-colors">- {link.label}</a></li>
                    ))}
                  </ul>
               </div>
               <div>
                  <h5 className={`font-bold uppercase tracking-widest text-teal-400 mb-10 ${themeTokens.fontHeadingClass}`}>Information</h5>
                  <ul className={`space-y-6 text-lg font-medium text-teal-100 ${themeTokens.fontBodyClass}`}>
                    <li><a href="#" className="hover:text-[#FF9F1C] transition-colors">- Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-[#FF9F1C] transition-colors">- Terms & Conditions</a></li>
                  </ul>
               </div>
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'compact-urban':
      return (
        <footer className="bg-[#111] text-gray-400 py-20 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
             <div className="space-y-4">
                <h4 className={`text-4xl font-bold text-white ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
                <address className={`not-italic text-sm ${themeTokens.fontBodyClass}`}>
                  {address}, {property.city}
                </address>
             </div>
             <nav className="flex flex-wrap gap-6 text-sm font-medium">
               {quickLinks.map(link => (
                 <a key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</a>
               ))}
               <a href={`mailto:${email || ''}`} className="text-white hover:text-brand transition-colors">Contact</a>
             </nav>
          </div>
          <div className="max-w-6xl mx-auto mt-16 border-t border-white/10 pt-8 text-xs text-gray-600 flex justify-between">
             <span>{copyrightText}</span>
             <span>Urban Stay</span>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    case 'abstract-art':
      return (
        <footer className="bg-gray-100 py-32 relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 relative z-10 grid md:grid-cols-2 gap-20 items-center">
             <div className="bg-white p-16 rounded-[60px] shadow-2xl border-4 border-gray-900 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <h4 className={`text-6xl font-black text-gray-900 uppercase tracking-tighter leading-[0.9] mb-12 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
                <address className={`not-italic text-2xl font-medium text-gray-600 space-y-4 ${themeTokens.fontBodyClass}`}>
                  <p>{address}</p>
                  <p>{property.city}</p>
                  {email && (
                    <div className="pt-8">
                       <a href={`mailto:${email}`} className="inline-block bg-brand text-white px-8 py-3 rounded-full font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">{email}</a>
                    </div>
                  )}
                </address>
             </div>
             <div className="flex justify-center md:justify-end">
                <ul className={`text-right space-y-8 font-black uppercase text-4xl tracking-tighter ${themeTokens.fontBodyClass}`}>
                   {quickLinks.map((link, i) => (
                     <li key={link.href}>
                        <a href={link.href} className="text-gray-300 hover:text-gray-900 transition-colors block" style={{ transform: `rotate(${i % 2 === 0 ? '-2deg' : '2deg'})` }}>{link.label}</a>
                     </li>
                   ))}
                </ul>
             </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );

    default: // Fallback generic
      return (
        <footer className="bg-surface-950 text-surface-400 py-24 px-8 border-t-[12px] border-brand">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-20 border-b border-surface-800 pb-20">
            <div className="md:col-span-4 border-b md:border-b-0 border-surface-800 pb-12 md:pb-0">
              <h4 className={`text-4xl text-white mb-6 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
              <p className={`text-lg text-surface-500 mb-8 leading-relaxed font-serif italic ${themeTokens.fontBodyClass}`}>{property.description || t('defaultTagline')}</p>
            </div>
            <div className="md:col-span-3">
              <h5 className={`text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs ${themeTokens.fontHeadingClass}`}>{t('quickLinks')}</h5>
              <ul className={`space-y-4 text-base ${themeTokens.fontBodyClass}`}>
                 {quickLinks.map(link => (
                   <li key={link.href}><a href={link.href} className="hover:text-white transition-colors">{link.label}</a></li>
                 ))}
              </ul>
            </div>
            <div className="md:col-span-5 pl-0 lg:pl-12">
              <h5 className={`text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs ${themeTokens.fontHeadingClass}`}>{t('contact')}</h5>
              <address className={`not-italic text-lg space-y-6 font-serif ${themeTokens.fontBodyClass}`}>
                <p>Visit: <span className="text-surface-300">{address},<br/>{property.city}</span></p>
                {phone && <p>Ring: <a href={`tel:${phone}`} className="hover:text-white text-surface-300">{phone}</a></p>}
                {email && <p>Write: <a href={`mailto:${email}`} className="hover:text-white text-surface-300">{email}</a></p>}
              </address>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto mt-16 flex flex-col md:flex-row items-center justify-between text-xs font-semibold tracking-[0.2em] uppercase">
            <p>{copyrightText}</p>
          </div>
          <div className="max-w-[1400px] mx-auto px-8"><SocialBar /></div>
        </footer>
      );
  }
}
