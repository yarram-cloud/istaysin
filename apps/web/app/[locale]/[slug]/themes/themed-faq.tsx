'use client';
import { useState } from 'react';
import { ThemeStyleMap } from './theme-tokens';
import { ChevronDown } from 'lucide-react';

export default function ThemedFaq({ config, themeTokens }: { config: any, themeTokens: ThemeStyleMap }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = config.faqs || [];
  if (faqs.length === 0) return null;

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-3xl mx-auto px-6">
        <h3 className="text-3xl md:text-4xl font-bold text-surface-900 mb-12 text-center">Frequently Asked Questions</h3>

        <div className="space-y-4">
          {faqs.map((faq: any, i: number) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border border-surface-200 rounded-3xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className={`w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none transition-colors ${isOpen ? 'bg-surface-50' : 'bg-white hover:bg-surface-50/50'}`}
                >
                  <span className="font-semibold text-surface-900 text-lg pr-8">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-surface-200' : 'bg-surface-100'}`}>
                    <ChevronDown className="w-4 h-4 text-surface-600" />
                  </div>
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-5 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
                >
                  <p className="text-surface-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
