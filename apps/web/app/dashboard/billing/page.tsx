'use client';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Billing & Invoices</h1>
        <p className="text-surface-400">Manage guest folios, payments, and GST invoicing</p>
      </div>
      <div className="glass-card p-12 text-center">
        <CreditCard className="w-12 h-12 text-surface-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Billing Dashboard</h3>
        <p className="text-surface-400">Folio charges, payments, and invoices will appear here for active bookings.</p>
      </div>
    </div>
  );
}
