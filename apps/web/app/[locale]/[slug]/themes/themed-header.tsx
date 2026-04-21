'use client';
import { useState, useEffect } from 'react';
import { ThemeStyleMap } from './theme-tokens';
import LocaleSwitcher from '@/components/locale-switcher';

export default function ThemedHeader({ config, property, themeTokens, locale }: { config: any, property: any, themeTokens: ThemeStyleMap, locale: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header id="site-header" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Brand/Logo */}
        <div className="flex items-center gap-3">
          {property.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.logo} alt={property.name} className="h-10 object-contain" />
          ) : (
            <span className={`text-2xl font-black tracking-tight ${scrolled ? 'text-surface-900' : 'text-white'}`}>
              {property.name}
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#about" className={`text-sm font-semibold tracking-wide hover:opacity-100 transition-opacity ${scrolled ? 'text-surface-600 hover:text-surface-900' : 'text-white/80 hover:text-white'}`}>About</a>
          <a href="#rooms" className={`text-sm font-semibold tracking-wide hover:opacity-100 transition-opacity ${scrolled ? 'text-surface-600 hover:text-surface-900' : 'text-white/80 hover:text-white'}`}>Rooms</a>
          <a href="#gallery" className={`text-sm font-semibold tracking-wide hover:opacity-100 transition-opacity ${scrolled ? 'text-surface-600 hover:text-surface-900' : 'text-white/80 hover:text-white'}`}>Gallery</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* CTA visible primarily on tablet/desktop */}
          <a
            href={`/${locale}/${property.slug}/book`}
            className={`inline-flex px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold transition-all text-xs sm:text-sm shadow-md ${scrolled ? themeTokens.primaryBg + ' text-white' : 'bg-white text-surface-900 hover:bg-surface-100'}`}
          >
            Book Now
          </a>

          {/* Darker locale switcher button based on scroll */}
          <div className={scrolled ? 'opacity-100' : 'brightness-200 contrast-200'}>
            <LocaleSwitcher currentLocale={locale} enabledLocales={['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml', 'ar', 'fr', 'de']} />
          </div>
        </div>

      </div>
    </header>
  );
}
