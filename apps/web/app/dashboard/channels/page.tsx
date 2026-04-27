'use client';

import { Network, Plus, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PlanGate from '@/app/dashboard/_components/plan-gate';

export default function ChannelManagerPage() {
  const t = useTranslations('Dashboard');
  return (
    <PlanGate requiredPlan="enterprise" featureName="Channel Manager">
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 mb-1">{t('channelsPage.title')}</h1>
          <p className="text-surface-500">{t('channelsPage.subtitle')}</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Connect OTA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { name: 'Booking.com', icon: 'B', connected: true, status: 'Synced just now' },
          { name: 'Agoda', icon: 'A', connected: true, status: 'Synced 5m ago' },
          { name: 'MakeMyTrip', icon: 'M', connected: false, status: 'Not connected' },
          { name: 'Goibibo', icon: 'G', connected: false, status: 'Not connected' },
          { name: 'Expedia', icon: 'E', connected: false, status: 'Not connected' },
        ].map((ota) => (
          <div key={ota.name} className="bg-white rounded-2xl border border-surface-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center font-bold text-xl text-surface-700">
                {ota.icon}
              </div>
              {ota.connected ? (
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">Active</span>
              ) : (
                <span className="bg-surface-100 text-surface-500 text-xs px-2.5 py-1 rounded-full font-semibold">Inactive</span>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-surface-900 border-b border-surface-100 pb-3 mb-3">{ota.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">{ota.status}</span>
                <button className={`text-sm font-medium flex items-center gap-1 ${ota.connected ? 'text-primary-700 hover:text-primary-800' : 'text-surface-400 hover:text-surface-600'}`}>
                  {ota.connected ? 'Configure' : 'Connect'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </PlanGate>
  );
}
