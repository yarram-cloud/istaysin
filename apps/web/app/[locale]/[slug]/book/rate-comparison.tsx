'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface RateComparisonProps {
  slug: string;
  roomTypeId: string;
  directRate: number; // Nightly rate for Book Direct
}

export function RateComparisonWidget({ slug, roomTypeId, directRate }: RateComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [compData, setCompData] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!slug || !roomTypeId) return;
    
    setLoading(true);
    fetch(`/api/v1/public/properties/${slug}/rate-comparison`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data && res.data.enabled !== false) {
          setCompData(res.data);
        } else {
          setCompData(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, roomTypeId]);

  if (loading) {
    return <div className="h-16 flex items-center justify-center text-surface-400"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  }

  // Not enabled or no data
  if (!compData || !compData.rates || !compData.rates[roomTypeId]) {
    return null;
  }

  const roomRates = compData.rates[roomTypeId];
  
  // Find highest opponent to calculate savings
  let maxCompetitorRate = 0;
  const competitors = Object.entries(roomRates)
    .filter(([_, rate]) => Number(rate) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1])); // Highest first

  if (competitors.length === 0) return null;

  maxCompetitorRate = Number(competitors[0][1]);
  const savings = Math.max(0, maxCompetitorRate - directRate);

  if (savings <= 0) return null; // Only show if direct is cheaper

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50/30 rounded-2xl border border-indigo-100 overflow-hidden mb-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 sm:p-5">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div className="space-y-1 w-full sm:w-auto">
            <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Compare & Save
            </h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              {competitors.slice(0, 3).map(([platform, rate]) => (
                <div key={platform} className="flex items-center gap-1 text-surface-500">
                  <span className="line-through">₹{Number(rate).toLocaleString('en-IN')}</span>
                  <span className="opacity-70">on {platform}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 flex flex-col items-center shrink-0 w-full sm:w-auto">
            <span className="text-xs font-medium text-indigo-100 uppercase tracking-widest">Book Direct</span>
            <span className="text-xl font-bold font-display">₹{directRate.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-indigo-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" /> You save ₹{savings.toLocaleString('en-IN')} per night!
          </p>
          
          <button 
            type="button"
            onClick={() => setExpanded(!expanded)} 
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            Why book direct? {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-white/60 p-4 border-t border-indigo-100 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <ul className="text-xs text-indigo-900 space-y-2.5">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Guaranteed Lowest Price:</strong> No hidden OTA commissions or markup fees.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Instant Confirmation:</strong> Your reservation is immediately secured in our system.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Better Modification Terms:</strong> Speak directly with our front desk for date changes.</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
