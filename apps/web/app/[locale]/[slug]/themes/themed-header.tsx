'use client';
import { useState, useEffect } from 'react';
import { ThemeStyleMap } from './theme-tokens';
import LocaleSwitcher from '@/components/locale-switcher';

import SafeNextImage from '../../../../components/safe-image';

export default function ThemedHeader({ config, property, themeTokens, locale }: { config: any, property: any, themeTokens: ThemeStyleMap, locale: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoEl = property.brandLogo ? (
    <SafeNextImage src={property.brandLogo} alt={property.name} containerClassName="h-10 w-32" className="!object-contain" />
  ) : (
    <span className={`text-2xl font-black tracking-tight`}>
      {property.name}
    </span>
  );

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#rooms', label: 'Rooms' },
    { href: '#amenities', label: 'Amenities' },
    { href: '#reviews', label: 'Reviews' },
  ];

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <header className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 max-w-6xl mx-auto rounded-3xl ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-2xl py-3 px-6' : 'bg-white/50 backdrop-blur-md shadow-lg py-4 px-8 border border-white/40'}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center text-surface-900 ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
          <nav className="hidden md:flex gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={`text-sm font-bold text-surface-600 hover:text-surface-900 transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a href={`/${locale}/${property.slug}/book`} className={`px-5 py-2 font-black text-sm text-white ${themeTokens.primaryBg} ${themeTokens.primaryBgHover} rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all`}>Book Now</a>
             <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} />
          </div>
        </div>
      </header>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-surface-100 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className={`${scrolled ? 'text-surface-900' : 'text-surface-900'} ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
          <nav className="hidden md:flex gap-10">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={`text-xs uppercase tracking-widest font-medium ${scrolled ? 'text-surface-500 hover:text-black' : 'text-surface-600 hover:text-black'} transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <a href={`/${locale}/${property.slug}/book`} className={`px-6 py-2 border ${scrolled ? 'border-surface-900 text-surface-900 hover:bg-surface-900 hover:text-white' : 'border-surface-900 text-surface-900 hover:bg-black hover:text-white'} text-xs uppercase tracking-widest transition-colors`}>Book</a>
             <div className={scrolled ? '' : 'opacity-80'}><LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} /></div>
          </div>
        </div>
      </header>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out border-b ${scrolled ? 'bg-surface-950/90 backdrop-blur-lg border-surface-800 py-4' : 'bg-gradient-to-b from-black/60 to-transparent border-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className={`text-white ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
          <nav className="hidden md:flex gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={`text-[13px] tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-6">
             <a href={`/${locale}/${property.slug}/book`} className={`px-8 py-2.5 bg-white text-black text-sm uppercase tracking-wider hover:bg-surface-200 transition-colors ${themeTokens.fontHeadingClass}`}>Reserve</a>
             <div className="brightness-200 contrast-200"><LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} /></div>
          </div>
        </div>
      </header>
    );
  }

  // --- CLASSIC (DEFAULT) ---
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-4' : 'bg-black/30 backdrop-blur-[2px] py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className={`${scrolled ? 'text-surface-900' : 'text-white'} ${themeTokens.fontHeadingClass}`}>{logoEl}</div>
        <nav className="hidden md:flex gap-6">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className={`text-sm font-semibold tracking-wide ${scrolled ? 'text-surface-600 hover:text-[color:var(--brand-color,#000)]' : 'text-white/90 hover:text-white'} transition-colors ${themeTokens.fontBodyClass}`}>{link.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a href={`/${locale}/${property.slug}/book`} className={`px-6 py-2 ${themeTokens.primaryBg} ${themeTokens.primaryBgHover} text-white font-bold rounded shadow-sm transition-all`}>Book Now</a>
          <div className={scrolled ? '' : 'brightness-200 contrast-200'}><LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml']} /></div>
        </div>
      </div>
    </header>
  );
}
