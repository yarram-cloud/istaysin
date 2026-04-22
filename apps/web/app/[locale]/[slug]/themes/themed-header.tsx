'use client';
import { useState, useEffect } from 'react';
import { ThemeStyleMap } from './theme-tokens';
import LocaleSwitcher from '@/components/locale-switcher';
import SafeNextImage from '../../../../components/safe-image';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemedHeader({ config, property, themeTokens, locale }: { config: any, property: any, themeTokens: ThemeStyleMap, locale: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoEl = property.brandLogo ? (
    <SafeNextImage src={property.brandLogo} alt={property.name} containerClassName="h-10 w-32 md:h-12 md:w-40" className="!object-contain" />
  ) : (
    <span className={`text-xl md:text-2xl font-bold tracking-tight`}>
      {property.name}
    </span>
  );

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#rooms', label: 'Rooms' },
    { href: '#amenities', label: 'Amenities' },
    { href: '#gallery', label: 'Gallery' },
  ];

  const bookBtnHref = `/${locale}/${property.slug}/book`;

  switch (themeTokens.templateId) {
    case 'modern-minimal':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out border-b ${scrolled ? 'bg-white/95 backdrop-blur-xl border-surface-200 py-4 shadow-sm' : 'bg-transparent border-transparent py-8'}`}>
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
            <div className={`text-black ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-10">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-sm font-medium ${scrolled ? 'text-gray-500 hover:text-black' : 'text-gray-600 hover:text-black'} transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-6">
              <a href={bookBtnHref} className={`px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors`}>{config.buttonText || 'Book Now'}</a>
               <div className={scrolled ? '' : 'opacity-80'}><LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} /></div>
            </div>
          </div>
        </header>
      );

    case 'luxury-gold':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out border-b ${scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-3xl border-brand/20 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-gradient-to-b from-black/80 to-transparent border-transparent py-8'}`}>
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
            <div className={`text-white drop-shadow-lg ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden lg:flex gap-12">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-[11px] tracking-[0.3em] font-medium uppercase text-gray-400 hover:text-brand transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-8">
               <a href={bookBtnHref} className={`px-8 py-3 border border-brand text-brand hover:bg-brand hover:text-black text-[10px] uppercase tracking-[0.2em] transition-all bg-black/50 backdrop-blur-sm ${themeTokens.fontBodyClass}`}>{config.buttonText || 'Reserve'}</a>
               <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'nature-eco':
      return (
        <header className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 max-w-7xl mx-auto rounded-3xl ${scrolled ? 'bg-white/95 backdrop-blur-2xl shadow-xl shadow-green-900/5 py-3 px-8 border border-green-900/10' : 'bg-white/80 backdrop-blur-md shadow-lg py-5 px-10 border border-white/60'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center text-green-950 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-[15px] font-medium text-green-800/70 hover:text-green-950 transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-5">
              <a href={bookBtnHref} className={`px-8 py-3 rounded-2xl font-bold text-[14px] text-white bg-green-900 hover:bg-green-800 shadow-md hover:shadow-lg transition-all`}>{config.buttonText || 'Book Journey'}</a>
               <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'boutique-chic':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] border-b ${scrolled ? 'bg-[#FDFBF7]/95 backdrop-blur-xl border-gray-200 py-4 shadow-sm' : 'bg-transparent border-transparent py-8'}`}>
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
            <nav className="hidden md:flex gap-10 flex-1">
              {navLinks.slice(0, 2).map(link => (
                <a key={link.href} href={link.href} className={`text-sm font-bold text-gray-400 hover:text-brand uppercase tracking-widest transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className={`text-gray-900 flex-shrink-0 mx-8 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-10 flex-1 justify-end items-center text-right">
              {navLinks.slice(2).map(link => (
                <a key={link.href} href={link.href} className={`text-sm font-bold text-gray-400 hover:text-brand uppercase tracking-widest transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <a href={bookBtnHref} className={`text-sm font-bold text-gray-900 border-b-2 border-brand pb-1 hover:text-brand transition-colors uppercase tracking-widest`}>{config.buttonText || 'Book'}</a>
            </nav>
            <div className="flex md:hidden ml-4">
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
            <div className="hidden md:block">
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'dark-elegance':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] ${scrolled ? 'bg-black/90 backdrop-blur-3xl py-4' : 'bg-gradient-to-b from-black via-black/50 to-transparent py-10'}`}>
          <div className="max-w-[1500px] mx-auto px-8 md:px-16 flex items-center justify-between mix-blend-difference text-white">
            <div className={`${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden lg:flex gap-16">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-[12px] tracking-[4px] font-black uppercase hover:text-gray-400 transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-8">
              <a href={bookBtnHref} className={`px-10 py-3 bg-white text-black font-black uppercase tracking-[3px] text-[11px] hover:bg-gray-200 transition-colors ${themeTokens.radiusClass}`}>{config.buttonText || 'Check Availability'}</a>
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'playful-vibrant':
      return (
        <header className={`fixed top-6 left-6 right-6 z-50 transition-all duration-500 max-w-[1200px] mx-auto rounded-[2rem] ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-3 px-8 translate-y-0 border border-gray-100' : 'bg-transparent py-4 px-4 translate-y-2'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-surface-950 font-black drop-shadow-sm ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className={`hidden md:flex bg-gray-50/80 backdrop-blur-md rounded-full px-6 py-3 border border-surface-200/50 shadow-inner ${scrolled ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
              {navLinks.map((link, i) => (
                <a key={link.href} href={link.href} className={`text-[14px] font-bold text-gray-500 hover:text-brand transition-colors px-4 border-r border-gray-200 last:border-0 ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <a href={bookBtnHref} className={`px-8 py-3.5 rounded-[1.5rem] font-bold text-[14px] text-white bg-brand shadow-[0_8px_20px_var(--brand-color-rgb)] hover:-translate-y-1 transition-transform`}>{config.buttonText || 'Book Stay'}</a>
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'corporate-trust':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-slate-200 py-3' : 'bg-white border-transparent py-4'}`}>
          <div className="max-w-[1400px] mx-auto px-6 md:px-8 flex items-center justify-between">
            <div className={`text-blue-950 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-8 items-center bg-slate-50 px-6 py-2 rounded-lg border border-slate-100">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-sm font-semibold text-slate-600 hover:text-brand transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-6">
              <a href={bookBtnHref} className={`px-6 py-2.5 bg-blue-950 text-white text-sm font-bold rounded-md hover:bg-brand transition-colors shadow-sm`}>{config.buttonText || 'Make a Reservation'}</a>
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'classic-heritage':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b-2 ${scrolled ? 'bg-[#fdfaf5]/95 backdrop-blur-xl border-[#e8dfc8] shadow-sm py-4' : 'bg-transparent border-transparent py-8'}`}>
          <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
            <div className={`text-yellow-950 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <div className="flex items-center w-full justify-between">
               <div className="flex-1 hidden md:flex items-center gap-8 border-y border-[#e8dfc8] py-3">
                 {navLinks.slice(0, 2).map(link => (
                   <a key={link.href} href={link.href} className={`text-xs uppercase tracking-[0.2em] font-serif font-bold text-yellow-900/70 hover:text-yellow-900 transition-colors`}>{link.label}</a>
                 ))}
               </div>
               <div className="mx-8 flex flex-col items-center justify-center border-x border-[#e8dfc8] px-8 h-12">
                  <a href={bookBtnHref} className={`text-xs font-bold uppercase tracking-[0.2em] text-yellow-900 hover:bg-yellow-900 hover:text-white px-6 py-2 border border-yellow-900 transition-colors`}>{config.buttonText || 'Book Now'}</a>
               </div>
               <div className="flex-1 hidden md:flex items-center justify-end gap-8 border-y border-[#e8dfc8] py-3">
                 {navLinks.slice(2).map(link => (
                   <a key={link.href} href={link.href} className={`text-xs uppercase tracking-[0.2em] font-serif font-bold text-yellow-900/70 hover:text-yellow-900 transition-colors`}>{link.label}</a>
                 ))}
               </div>
               <div className="flex items-center ml-2">
                 <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
               </div>
            </div>
          </div>
        </header>
      );

    case 'retro-vintage':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-[6px] border-black ${scrolled ? 'bg-[#F2B94A] py-2' : 'bg-[#E5E0D8] py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className={`text-black bg-white border-4 border-black px-4 py-2 shadow-[4px_4px_0px_#000] rotate-[-2deg] ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-xl font-black uppercase text-black hover:bg-black hover:text-white px-3 py-1 transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-6">
              <a href={bookBtnHref} className={`px-6 py-3 bg-[#DF5339] border-[4px] border-black text-black text-lg font-black uppercase shadow-[6px_6px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000] transition-all`}>{config.buttonText || 'Book Room'}</a>
              <div className="bg-white border-2 border-black p-1 shadow-[4px_4px_0px_#000]"><LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} /></div>
            </div>
          </div>
        </header>
      );

    case 'resort-tropical':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${scrolled ? 'bg-teal-900/95 backdrop-blur-xl border-b border-teal-800 shadow-2xl py-4' : 'bg-gradient-to-b from-teal-950 via-teal-900/50 to-transparent py-8'}`}>
          <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">
            <div className={`text-white drop-shadow-xl ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden lg:flex gap-10">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-[13px] font-bold uppercase tracking-widest text-teal-100/80 hover:text-white transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-6">
              <a href={bookBtnHref} className={`px-8 py-4 bg-[#FF9F1C] text-white text-[13px] uppercase tracking-widest font-bold shadow-xl hover:bg-white hover:text-teal-900 transition-all ${themeTokens.radiusClass}`}>{config.buttonText || 'Book Vacation'}</a>
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'compact-urban':
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#111]/95 backdrop-blur-lg border-white/10 py-3 shadow-sm' : 'bg-[#111] border-transparent py-5'}`}>
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <div className={`text-white ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-8 items-center">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-sm font-medium text-gray-400 hover:text-white transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-6">
              <a href={bookBtnHref} className={`px-6 py-2 bg-brand text-white text-sm font-bold ${themeTokens.radiusClass} hover:bg-white hover:text-black transition-colors`}>{config.buttonText || 'Reserve'}</a>
              <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
            </div>
          </div>
        </header>
      );

    case 'abstract-art':
      return (
        <header className={`fixed top-6 left-6 z-50 transition-all duration-500 max-w-sm ${scrolled ? 'opacity-100 transform-none' : 'opacity-100'}`}>
           <div className={`bg-white p-6 shadow-2xl rounded-[30px] border-[10px] border-brand/20 backdrop-blur-xl`}>
             <div className={`text-black mb-6 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
             <nav className="flex flex-col gap-4 mb-6">
               {navLinks.map(link => (
                 <a key={link.href} href={link.href} className={`text-lg font-black text-gray-400 hover:text-black transition-colors hover:translate-x-2 ${themeTokens.fontBodyClass}`}>{link.label}</a>
               ))}
             </nav>
             <div className="space-y-4">
               <a href={bookBtnHref} className={`block w-full text-center px-6 py-4 bg-black text-white font-black text-lg ${themeTokens.radiusClass} hover:bg-brand transition-colors shadow-xl`}>{config.buttonText || 'Book Now'}</a>
               <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
             </div>
           </div>
        </header>
      );

    default: // Fallback generic
      return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg border-surface-200 py-4' : 'bg-white/80 backdrop-blur-md border-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
            <div className={`text-surface-900 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
            <nav className="hidden md:flex gap-10">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-[15px] font-semibold tracking-wide text-surface-700 hover:text-brand transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-6">
              <a href={bookBtnHref} className={`px-8 py-3 bg-brand text-white font-bold rounded shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all`}>{config.buttonText || 'Book Now'}</a>
              <div className={scrolled ? '' : 'opacity-90'}><LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} /></div>
            </div>
          </div>
        </header>
      );
  }
}

