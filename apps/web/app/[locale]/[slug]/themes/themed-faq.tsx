'use client';
import { useState } from 'react';
import { ThemeStyleMap } from './theme-tokens';
import { ChevronDown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemedFaq({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  if (!config?.enabled) return null;
  const faqs = config.questions || config.faqs || [];
  if (faqs.length === 0) return null;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="py-24 bg-[color:var(--brand-color,#000)] relative">
        <div className="absolute inset-0 bg-white/5" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl">
            <h3 className={`text-4xl md:text-5xl font-black text-surface-900 mb-12 text-center ${themeTokens.fontHeadingClass}`}>{config.title || t('faq')}</h3>
            <div className="space-y-6">
              {faqs.map((faq: any, i: number) => {
                const isOpen = openIndex === i;
                return (
                  <div key={i} className={`border-2 ${isOpen ? 'border-[color:var(--brand-color,#000)] bg-surface-50' : 'border-surface-100 bg-white'} ${themeTokens.radiusClass} overflow-hidden transition-all duration-300`}>
                    <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full px-6 py-6 flex items-center justify-between text-left focus:outline-none group">
                      <span className={`font-bold text-surface-900 text-lg pr-8 ${themeTokens.fontHeadingClass}`}>{faq.question || faq.q}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? themeTokens.primaryBg + ' text-white rotate-45' : 'bg-surface-100 text-surface-500 group-hover:bg-surface-200'}`}>
                        <Plus className="w-5 h-5" />
                      </div>
                    </button>
                    <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-6 border-t-2 border-surface-100 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                      <p className={`text-surface-600 leading-relaxed font-medium ${themeTokens.fontBodyClass}`}>{faq.answer || faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className={`text-4xl font-light text-surface-900 mb-16 text-center tracking-wide ${themeTokens.fontHeadingClass}`}>{config.title || t('faq')}</h3>
          <div className="space-y-2">
            {faqs.map((faq: any, i: number) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="border-b border-surface-200 overflow-hidden">
                  <button onClick={() => setOpenIndex(isOpen ? null : i)} className={`w-full py-8 flex items-start justify-between text-left focus:outline-none group`}>
                    <span className={`font-normal text-surface-900 text-xl pr-8 group-hover:text-black transition-colors ${themeTokens.fontHeadingClass}`}>{faq.question || faq.q}</span>
                    <Plus className={`w-6 h-6 shrink-0 transition-transform duration-500 text-surface-400 group-hover:text-black ${isOpen ? 'rotate-45' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 pb-8 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}>
                    <p className={`text-surface-500 leading-relaxed font-light ${themeTokens.fontBodyClass}`}>{faq.answer || faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section className="py-24 bg-surface-950">
        <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
             <h3 className={`text-4xl md:text-5xl text-white mb-6 leading-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('queries')}</h3>
             <p className={`text-surface-400 ${themeTokens.fontBodyClass}`}>{t('everythingYouNeedToKnow')}</p>
          </div>
          <div className="md:col-span-8">
            <div className="space-y-4">
              {faqs.map((faq: any, i: number) => {
                const isOpen = openIndex === i;
                return (
                  <div key={i} className="border border-surface-800 bg-surface-900/50 backdrop-blur-sm overflow-hidden">
                    <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none hover:bg-black transition-colors">
                      <span className={`text-surface-100 text-lg pr-8 tracking-wide ${themeTokens.fontHeadingClass}`}>{faq.question || faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-surface-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>
                    <div className={`px-8 border-t border-surface-800 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-6 opacity-100' : 'max-h-0 py-0 border-transparent opacity-0'}`}>
                      <p className={`text-surface-400 leading-relaxed ${themeTokens.fontBodyClass}`}>{faq.answer || faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC (Default) ---
  return (
    <section className="py-24 bg-surface-50 relative">
      <div className="max-w-3xl mx-auto px-6">
        <h3 className={`text-3xl md:text-4xl font-bold text-surface-900 mb-12 text-center ${themeTokens.fontHeadingClass}`}>{config.title || t('frequentlyAskedQuestions')}</h3>

        <div className="space-y-4">
          {faqs.map((faq: any, i: number) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className={`border border-surface-200 overflow-hidden shadow-sm transition-all duration-300 ${themeTokens.radiusClass}`}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className={`w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none transition-colors ${isOpen ? 'bg-surface-100/50' : 'bg-white hover:bg-surface-50'}`}
                >
                  <span className={`font-semibold text-surface-900 text-lg pr-8 ${themeTokens.fontHeadingClass}`}>{faq.question || faq.q}</span>
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-surface-600" />
                  </div>
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out bg-white ${isOpen ? 'max-h-96 py-5 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
                >
                  <p className={`text-surface-600 leading-relaxed ${themeTokens.fontBodyClass}`}>{faq.answer || faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
