import { ThemeStyleMap } from './theme-tokens';
import { useTranslations } from 'next-intl';

export default function ThemedFooter({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config?.enabled) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <footer className={`bg-[color:var(--brand-color,#000)] text-white py-16 px-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
          <div className="md:col-span-5">
            <h4 className={`text-4xl font-black mb-4 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
            <p className={`text-lg opacity-80 mb-8 max-w-sm ${themeTokens.fontBodyClass}`}>{property.tagline || t('defaultTagline')}</p>
            <div className="flex gap-4">
               {['FB', 'IG', 'TW'].map(social => (
                 <a key={social} href="#" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors font-bold text-sm">
                   {social}
                 </a>
               ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <h5 className={`font-bold mb-6 text-lg uppercase tracking-wide opacity-50 ${themeTokens.fontHeadingClass}`}>{t('navigate')}</h5>
            <ul className={`space-y-4 font-bold ${themeTokens.fontBodyClass}`}>
              <li><a href="#about" className="hover:underline underline-offset-4">{t('about')}</a></li>
              <li><a href="#rooms" className="hover:underline underline-offset-4">{t('rooms')}</a></li>
              <li><a href="#gallery" className="hover:underline underline-offset-4">{t('gallery')}</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h5 className={`font-bold mb-6 text-lg uppercase tracking-wide opacity-50 ${themeTokens.fontHeadingClass}`}>{t('legal')}</h5>
            <ul className={`space-y-4 font-bold ${themeTokens.fontBodyClass}`}>
              <li><a href="#" className="hover:underline underline-offset-4">{t('privacy')}</a></li>
              <li><a href="#" className="hover:underline underline-offset-4">{t('terms')}</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h5 className={`font-bold mb-6 text-lg uppercase tracking-wide opacity-50 ${themeTokens.fontHeadingClass}`}>{t('contact')}</h5>
            <address className={`not-italic space-y-4 font-bold ${themeTokens.fontBodyClass}`}>
              <p className="opacity-90">{property.address}, {property.city}</p>
              {property.contactPhone && <p><a href={`tel:${property.contactPhone}`} className="hover:underline">{property.contactPhone}</a></p>}
              {property.contactEmail && <p><a href={`mailto:${property.contactEmail}`} className="hover:underline">{property.contactEmail}</a></p>}
            </address>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between text-sm opacity-60 font-bold">
          <p>© {new Date().getFullYear()} {property.name}</p>
          <p>{t('poweredBy')}</p>
        </div>
      </footer>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <footer className="bg-white text-surface-900 py-24 px-6 border-t border-surface-200">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <h4 className={`text-4xl tracking-widest font-light mb-8 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16">
            <a href="#about" className={`text-sm tracking-[0.2em] uppercase hover:text-black text-surface-500 transition-colors ${themeTokens.fontHeadingClass}`}>{t('about')}</a>
            <a href="#rooms" className={`text-sm tracking-[0.2em] uppercase hover:text-black text-surface-500 transition-colors ${themeTokens.fontHeadingClass}`}>{t('rooms')}</a>
            <a href="#gallery" className={`text-sm tracking-[0.2em] uppercase hover:text-black text-surface-500 transition-colors ${themeTokens.fontHeadingClass}`}>{t('gallery')}</a>
            <a href="mailto:contact@example.com" className={`text-sm tracking-[0.2em] uppercase hover:text-black text-surface-500 transition-colors ${themeTokens.fontHeadingClass}`}>{t('contact')}</a>
          </div>
          
          <address className={`not-italic text-surface-400 font-light mb-16 space-y-2 ${themeTokens.fontBodyClass}`}>
             <p>{property.address}, {property.city}</p>
             {property.contactPhone && <p>{property.contactPhone}</p>}
          </address>
          
          <div className="w-full border-t border-surface-200 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-surface-400 uppercase tracking-widest">
            <div className="flex gap-4">
              <a href="#" className="hover:text-black transition-colors">{t('privacy')}</a>
              <a href="#" className="hover:text-black transition-colors">{t('terms')}</a>
            </div>
            <p className="mt-4 md:mt-0">© {new Date().getFullYear()} {property.name}</p>
          </div>
        </div>
      </footer>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <footer className="bg-black text-surface-400 py-20 px-6 border-t border-surface-800">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-surface-800 pb-20">
          <div className="md:col-span-2 pr-8 border-r border-surface-800">
            <h4 className={`text-3xl text-white mb-6 uppercase tracking-[0.1em] ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
            <p className={`text-surface-500 max-w-sm leading-relaxed ${themeTokens.fontBodyClass}`}>{property.tagline || t('defaultTagline')}</p>
          </div>
          <div>
            <ul className={`space-y-4 uppercase tracking-[0.2em] text-xs ${themeTokens.fontHeadingClass}`}>
              <li><a href="#about" className="hover:text-white transition-colors block">{t('discovery')}</a></li>
              <li><a href="#rooms" className="hover:text-white transition-colors block">{t('residences')}</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors block">{t('experiences')}</a></li>
            </ul>
          </div>
          <div>
            <address className={`not-italic space-y-4 text-sm ${themeTokens.fontBodyClass}`}>
              <p className="text-surface-300">{property.address}<br/>{property.city}</p>
              {property.contactEmail && <p><a href={`mailto:${property.contactEmail}`} className="hover:text-white transition-colors border-b border-surface-700 pb-1">{property.contactEmail}</a></p>}
            </address>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-8 flex flex-col md:flex-row items-center justify-between text-xs uppercase tracking-[0.2em]">
          <p>© {new Date().getFullYear()}</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('terms')}</a>
          </div>
        </div>
      </footer>
    );
  }

  // --- CLASSIC ARCHETYPE (Fallback) ---
  return (
    <footer className="bg-surface-950 text-surface-400 py-16 px-6 border-t-[8px] border-[color:var(--brand-color,#000)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1 border-b md:border-b-0 border-surface-800 pb-8 md:pb-0">
          <h4 className={`text-2xl font-bold text-white mb-4 ${themeTokens.fontHeadingClass}`}>{property.name}</h4>
          <p className={`text-sm text-surface-500 mb-6 leading-relaxed ${themeTokens.fontBodyClass}`}>{property.tagline || t('defaultTagline')}</p>
        </div>
        <div>
          <h5 className={`text-white font-bold mb-6 uppercase tracking-wider text-sm ${themeTokens.fontHeadingClass}`}>{t('quickLinks')}</h5>
          <ul className={`space-y-3 text-sm ${themeTokens.fontBodyClass}`}>
            <li><a href="#about" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">›</span> {t('about')}</a></li>
            <li><a href="#rooms" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">›</span> {t('roomsAndSuites')}</a></li>
            <li><a href="#gallery" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">›</span> {t('gallery')}</a></li>
          </ul>
        </div>
        <div>
          <h5 className={`text-white font-bold mb-6 uppercase tracking-wider text-sm ${themeTokens.fontHeadingClass}`}>{t('legal')}</h5>
          <ul className={`space-y-3 text-sm ${themeTokens.fontBodyClass}`}>
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">›</span> {t('privacyPolicy')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">›</span> {t('termsOfService')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">›</span> {t('refundPolicy')}</a></li>
          </ul>
        </div>
        <div>
          <h5 className={`text-white font-bold mb-6 uppercase tracking-wider text-sm ${themeTokens.fontHeadingClass}`}>{t('contact')}</h5>
          <address className={`not-italic text-sm space-y-3 ${themeTokens.fontBodyClass}`}>
            <p className="flex items-start gap-2"><span className="text-[color:var(--brand-color,#000)] mt-1">📍</span> <span>{property.address},<br/>{property.city}</span></p>
            {property.contactPhone && <p className="flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">📞</span> <a href={`tel:${property.contactPhone}`} className="hover:text-white">{property.contactPhone}</a></p>}
            {property.contactEmail && <p className="flex items-center gap-2"><span className="text-[color:var(--brand-color,#000)]">✉️</span> <a href={`mailto:${property.contactEmail}`} className="hover:text-white">{property.contactEmail}</a></p>}
          </address>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-surface-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-semibold tracking-wider">
        <p>© {new Date().getFullYear()} {property.name}. {t('allRightsReserved')}</p>
        <p className="mt-4 md:mt-0 text-white/50">{t('poweredBy')}</p>
      </div>
    </footer>
  );
}
