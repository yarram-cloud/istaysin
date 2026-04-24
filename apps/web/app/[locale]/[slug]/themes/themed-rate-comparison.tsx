'use client';

import { useState, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck, Clock, Gift, Star, Headphones, TrendingDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ThemeStyleMap } from './theme-tokens';

interface CompetitorRatesData {
  enabled: boolean;
  rates: Record<string, Record<string, number>>;
  lastUpdated?: string;
}

interface RoomTypeInfo {
  id: string;
  name: string;
  baseRate: number;
}

interface ThemedRateComparisonProps {
  rateData: CompetitorRatesData | null;
  roomTypes: RoomTypeInfo[];
  themeTokens: ThemeStyleMap;
}

export default function ThemedRateComparison({ rateData, roomTypes, themeTokens }: ThemedRateComparisonProps) {
  const t = useTranslations('PropertySite');
  const [whyOpen, setWhyOpen] = useState(false);

  if (!rateData?.enabled || !rateData.rates) return null;

  const roomsWithRates = roomTypes.filter(rt => {
    const rtRates = rateData.rates[rt.id];
    return rtRates && Object.values(rtRates).some(v => v > 0);
  });

  if (roomsWithRates.length === 0) return null;

  const whyReasons: Array<{ icon: ElementType; text: string }> = [
    { icon: ShieldCheck, text: t('whyBookDirectReason1') },
    { icon: Clock,       text: t('whyBookDirectReason2') },
    { icon: Gift,        text: t('whyBookDirectReason3') },
    { icon: Star,        text: t('whyBookDirectReason4') },
    { icon: Headphones,  text: t('whyBookDirectReason5') },
  ];

  return (
    <section data-testid="rate-comparison-widget" className="w-full py-16 bg-gradient-to-b from-white via-emerald-50/20 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-bold mb-4">
            <TrendingDown className="w-4 h-4" aria-hidden="true" />
            {t('bookDirectAndSave')}
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold text-gray-900 ${themeTokens.fontHeadingClass}`}>
            {t('bookDirectTitle')}
          </h2>
          <p className={`text-gray-500 mt-3 max-w-xl mx-auto text-base ${themeTokens.fontBodyClass}`}>
            {t('bookDirectTagline')}
          </p>
        </div>

        {/* Per-room-type rate cards */}
        <div className="space-y-4 mb-8">
          {roomsWithRates.map((rt, i) => {
            const otaPlatforms = Object.entries(rateData.rates[rt.id]).filter(([, v]) => v > 0) as [string, number][];
            const minOtaRate = Math.min(...otaPlatforms.map(([, v]) => v));
            const savings = minOtaRate - rt.baseRate;
            return (
              <RateComparisonCard
                key={rt.id}
                roomType={rt}
                platforms={otaPlatforms}
                savings={savings}
                themeTokens={themeTokens}
                animationDelay={i * 0.1}
              />
            );
          })}
        </div>

        {/* Why Book Direct? accordion */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setWhyOpen(v => !v)}
            aria-expanded={whyOpen}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-h-[44px]"
          >
            <span className="font-semibold text-gray-800">{t('whyBookDirect')}</span>
            <motion.div
              animate={{ rotate: whyOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </motion.div>
          </button>

          <AnimatePresence>
            {whyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {whyReasons.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                      <Icon className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="text-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        {rateData.lastUpdated && (
          <p className="text-center text-xs text-gray-400 mt-6">
            {t('otaDisclaimer')}
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Sub-component: per-room rate card ───────────────────────────────────────

function RateComparisonCard({ roomType, platforms, savings, themeTokens, animationDelay }: {
  roomType: RoomTypeInfo;
  platforms: [string, number][];
  savings: number;
  themeTokens: ThemeStyleMap;
  animationDelay: number;
}) {
  const t = useTranslations('PropertySite');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm"
    >
      <div className="p-4 sm:p-6">
        <h3 className={`font-bold text-gray-900 text-lg mb-4 ${themeTokens.fontHeadingClass}`}>
          {roomType.name}
        </h3>

        <div className="flex flex-wrap gap-3 items-end">
          {/* OTA platform rates (shown with strikethrough) */}
          {platforms.map(([platform, rate]) => (
            <div
              key={platform}
              className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-w-[110px]"
            >
              <span className="text-xs font-medium text-gray-500 mb-1.5">{platform}</span>
              <span className="text-base font-bold text-gray-400 line-through decoration-red-400">
                ₹{rate.toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          <span className="text-gray-300 font-bold text-xl self-center px-1" aria-hidden="true">→</span>

          {/* Direct booking rate (highlighted) */}
          <div className="relative flex flex-col items-center bg-emerald-50 border-2 border-emerald-400 rounded-xl px-5 py-3 min-w-[140px]">
            {savings > 0 && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                ✅ {t('youSave')} ₹{savings.toLocaleString('en-IN')}
              </div>
            )}
            <span className="text-xs font-bold text-emerald-700 mb-1.5">{t('bookDirectLabel')}</span>
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.45, delay: animationDelay + 0.1 }}
              className="text-2xl font-extrabold text-emerald-700"
            >
              ₹{roomType.baseRate.toLocaleString('en-IN')}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
