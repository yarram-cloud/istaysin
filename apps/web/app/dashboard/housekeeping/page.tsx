'use client';
import { ClipboardList } from 'lucide-react';

export default function HousekeepingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Housekeeping</h1>
        <p className="text-surface-400">Room cleaning tasks and maintenance requests</p>
      </div>
      <div className="glass-card p-12 text-center">
        <ClipboardList className="w-12 h-12 text-surface-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Housekeeping Dashboard</h3>
        <p className="text-surface-400">Tasks are auto-created when guests check out. View and manage them here.</p>
      </div>
    </div>
  );
}
