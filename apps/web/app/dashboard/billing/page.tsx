'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Search, IndianRupee, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { billingApi } from '@/lib/api';

interface Invoice {
  id: string; invoiceNumber: string; guestName: string; bookingNumber: string;
  subtotal: number; gstAmount: number; totalAmount: number; status: string;
  createdAt: string; paidAt?: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await billingApi.getInvoices();
      if (res.success) setInvoices(res.data || []);
    } catch (err) { console.error('Invoice fetch failed:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = searchQuery
    ? invoices.filter((inv) =>
        inv.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : invoices;

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const pendingAmount = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const statusIcon = (s: string) => {
    if (s === 'paid') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (s === 'overdue') return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const statusBadge = (s: string) => {
    if (s === 'paid') return 'badge-success';
    if (s === 'overdue') return 'badge-danger';
    if (s === 'cancelled') return 'badge bg-surface-500/20 text-surface-400 border border-surface-500/20';
    return 'badge-warning';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Billing & Invoices</h1>
        <p className="text-surface-400">Manage guest folios, payments, and GST invoicing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-surface-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-display font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-surface-400">Pending</span>
          </div>
          <p className="text-2xl font-display font-bold">₹{pendingAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-sm text-surface-400">Total Invoices</span>
          </div>
          <p className="text-2xl font-display font-bold">{invoices.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input type="text" placeholder="Search invoices..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-10 py-2.5" />
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="glass-card p-6 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/[0.04] rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'No invoices found' : 'No invoices yet'}</h3>
          <p className="text-surface-400">Invoices will be generated automatically when bookings are checked out.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Guest</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Booking</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase">Subtotal</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase">GST</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-surface-400 uppercase">Total</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-primary-400">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm">{inv.guestName}</td>
                  <td className="px-6 py-4 text-sm text-surface-400 font-mono">{inv.bookingNumber}</td>
                  <td className="px-6 py-4 text-sm text-right">₹{inv.subtotal?.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-right text-surface-400">₹{inv.gstAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={statusBadge(inv.status)}>
                      {inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-400">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
