'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Search, IndianRupee, FileText, Printer, Download, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { billingApi } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Invoice {
  id: string; 
  invoiceNumber: string; 
  guestName: string; 
  booking: { bookingNumber: string };
  subtotal: number; 
  totalCgst: number; 
  totalSgst: number; 
  totalIgst: number; 
  grandTotal: number; 
  status?: string;
  createdAt: string; 
}

export default function BillingPage() {
  const t = useTranslations('Dashboard');
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
        inv.booking?.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : invoices;

  // Since Invoice status doesn't exist natively on our simple Prisma schema yet, 
  // we assume invoices are issued post-payment or track based on grandTotal. 
  // Let's dummy sum the grandTotals for now.
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const pendingAmount = 0; // Requires linking to Booking balanceDue if needed later

  const statusBadge = (s: string) => {
    if (s === 'paid') return 'badge-success';
    if (s === 'overdue') return 'badge-danger';
    if (s === 'cancelled') return 'badge bg-surface-500/20 text-surface-400 border border-surface-500/20';
    return 'badge-success'; // default to success if no status exists
  };

  return (
    <div className="space-y-6 print-container">
      {/* 
        Print styling: We use global print styles to hide headers/navigation in layout component,
        but we can also use tailwind's print: modifier to force simple layouts.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
      <div className="print:hidden">
        <h1 className="text-2xl font-display font-bold mb-1">Billing & Invoices</h1>
        <p className="text-surface-400">Manage guest folios, payments, and GST invoicing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-surface-400">Invoiced Revenue</span>
          </div>
          <p className="text-2xl font-display font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="stat-card hidden md:block opacity-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-surface-400">Pending</span>
          </div>
          <p className="text-2xl font-display font-bold">₹0</p>
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
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface-900/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Invoice / Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Guest & Booking</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Taxable Amt</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider bg-primary-900/10">CGST</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider bg-emerald-900/10">SGST</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider bg-amber-900/10">IGST</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider">Total</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-primary-400 font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-surface-500">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-surface-200">{inv.guestName}</p>
                    <p className="text-xs text-surface-500 font-mono">BKG: {inv.booking?.bookingNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-surface-300">
                    ₹{inv.subtotal?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-surface-400 bg-primary-900/5">
                    ₹{inv.totalCgst?.toLocaleString('en-IN') || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-surface-400 bg-emerald-900/5">
                    ₹{inv.totalSgst?.toLocaleString('en-IN') || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-surface-400 bg-amber-900/5">
                    ₹{inv.totalIgst?.toLocaleString('en-IN') || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-white">
                    ₹{inv.grandTotal?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right print:hidden">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
                        title="Download PDF"
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          // Direct redirect doesn't pass Bearer Token easily via URL without exposing it
                          // But we can trigger a programmatic fetch + blob download, or open a window if API manages token in cookie
                          fetch(`${API_BASE_URL}/billing/invoices/${inv.id}/pdf`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                          .then(res => res.blob())
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Invoice-${inv.invoiceNumber}.pdf`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }).catch(err => toast.error(t('downloadFailed') || 'Failed to download PDF'));
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        title="Print"
                        className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
                        onClick={() => window.print()}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
