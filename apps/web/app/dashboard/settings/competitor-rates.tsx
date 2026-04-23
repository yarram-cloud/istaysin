'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Save, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { tenantsApi, roomsApi } from '@/lib/api';

export function CompetitorRatesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  
  // Structure: { [roomTypeId]: { 'Booking.com': 4200, 'MakeMyTrip': 4000 } }
  const [rates, setRates] = useState<Record<string, Record<string, number>>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const platforms = ['Booking.com', 'MakeMyTrip', 'Goibibo', 'Agoda'];

  useEffect(() => {
    Promise.all([
      tenantsApi.getSettings(),
      roomsApi.getTypes()
    ]).then(([settingsRes, roomsRes]) => {
      if (settingsRes.success && roomsRes.success) {
        setRoomTypes(roomsRes.data || []);
        
        const compRates = settingsRes.data?.competitorRates || {};
        setEnabled(!!compRates.enabled);
        setRates(compRates.rates || {});
        setLastUpdated(compRates.lastUpdated || null);
      }
    }).catch(() => {
      toast.error('Failed to load settings');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleRateChange = (roomTypeId: string, platform: string, value: string) => {
    const num = parseInt(value, 10);
    setRates(prev => ({
      ...prev,
      [roomTypeId]: {
        ...(prev[roomTypeId] || {}),
        [platform]: isNaN(num) ? 0 : num
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled,
        lastUpdated: new Date().toISOString(),
        rates
      };
      
      const res = await tenantsApi.updateSettings({ competitorRates: payload });
      if (res.success) {
        setLastUpdated(payload.lastUpdated);
        toast.success('Competitor rates updated successfully');
      } else {
        toast.error(res.error || 'Failed to update rates');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="glass-card p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Book Direct & Save Widget</h2>
            <p className="text-sm text-surface-400">Display competitor rates on your public booking engine to show guests they save by booking direct.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {enabled && (
          <div className="space-y-6 mt-6 pt-6 border-t border-white/10">
            {roomTypes.map(rt => {
              const rtRates = rates[rt.id] || {};
              return (
                <div key={rt.id} className="bg-surface-900/50 p-5 rounded-2xl border border-surface-800">
                  <h3 className="font-semibold text-lg mb-4 text-primary-300">{rt.name} <span className="text-sm font-normal text-surface-400 ml-2">(Base: ₹{rt.baseRate})</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {platforms.map(platform => (
                      <div key={platform}>
                        <label className="block text-xs font-medium text-surface-400 mb-1">{platform}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-surface-500">₹</span>
                          <input 
                            type="number" 
                            min="0"
                            value={rtRates[platform] || ''} 
                            onChange={e => handleRateChange(rt.id, platform, e.target.value)}
                            className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-2.5 pl-8 focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-surface-700" 
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {lastUpdated && (
              <p className="text-xs text-surface-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Last updated on {new Date(lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            )}

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Rates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
