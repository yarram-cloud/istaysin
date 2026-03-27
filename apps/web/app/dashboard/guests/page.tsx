'use client';
import { Users, Search } from 'lucide-react';

export default function GuestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Guests</h1>
          <p className="text-surface-400">Guest directory and history</p>
        </div>
      </div>
      <div className="glass-card p-12 text-center">
        <Users className="w-12 h-12 text-surface-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Guest directory</h3>
        <p className="text-surface-400">Guest profiles will appear here as bookings are created.</p>
      </div>
    </div>
  );
}
