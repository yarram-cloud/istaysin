'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

interface LocaleOption {
  code: string;
  name: string;
  nativeName: string;
}

const ALL_LOCALES: LocaleOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરাতી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലయാളം' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

export default function LocaleSwitcher({
  currentLocale,
  enabledLocales,
}: {
  currentLocale: string;
  enabledLocales: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Always show English + enabled locales
  const visibleLocales = ALL_LOCALES.filter(
    l => l.code === 'en' || enabledLocales.includes(l.code)
  );

  const current = visibleLocales.find(l => l.code === currentLocale) || visibleLocales[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Don't render if only English is available
  if (visibleLocales.length <= 1) return null;

  async function switchLocale(code: string) {
    // Validate the code against known locales to prevent injection
    if (!ALL_LOCALES.some(l => l.code === code)) return;
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', code);
    router.push(`${pathname}?${params.toString()}`);
    // Write cookie for persistence
    document.cookie = `istays_locale=${encodeURIComponent(code)};path=/;max-age=31536000;SameSite=Lax`;
    
    // Sync to backend if logged in
    try {
      if (localStorage.getItem('accessToken')) {
        await authApi.updateLanguage(code);
      }
    } catch (err) {
      console.error('Failed to sync language preference to backend', err);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-bold opacity-80 hover:opacity-100 transition-opacity px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-current"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{current.nativeName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-surface-200 py-1 min-w-[160px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleLocales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => switchLocale(loc.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-50 transition-colors flex items-center justify-between ${
                loc.code === currentLocale ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-surface-700'
              }`}
            >
              <span>{loc.nativeName}</span>
              <span className="text-xs text-surface-400 uppercase">{loc.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
