'use client';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Analytics</h1>
        <p className="text-surface-400">Revenue, occupancy, and booking metrics</p>
      </div>
      <div className="glass-card p-12 text-center">
        <BarChart3 className="w-12 h-12 text-surface-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
        <p className="text-surface-400">Occupancy, ADR, RevPAR, and booking source analytics will appear here once you have booking data.</p>
      </div>
    </div>
  );
}
