'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle2, AlertCircle, Clock, 
  CreditCard, Banknote, LayoutDashboard, ChevronRight,
  TrendingDown, ShieldAlert, FileWarning, Printer
} from 'lucide-react';
import { nightAuditApi } from '@/lib/api';
import { toast } from 'sonner';

export default function NightAuditDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData(targetDate?: string) {
    setLoading(true);
    try {
      const sumRes = await nightAuditApi.getSummary(targetDate);
      if (sumRes.success) {
        setSummary(sumRes.data);
        if (!selectedDate && !targetDate) {
          setSelectedDate(sumRes.data.targetDateStr);
        }
      }

      const histRes = await nightAuditApi.getHistory();
      if (histRes.success) setHistory(histRes.data);
    } catch (err: any) {
      toast.error('Failed to load night audit data ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
    if (val) fetchData(val);
  };

  async function handleRunAudit() {
    setRunning(true);
    try {
      const res = await nightAuditApi.runAudit(selectedDate);
      if (res.success) {
        toast.success(`Night audit for ${summary?.targetDateStr} completed successfully!`);
        setShowConfirm(false);
        fetchData(selectedDate);
      } else {
        toast.error(res.message || res.error || 'Failed to run audit');
      }
    } catch (err: any) {
      toast.error(err.message || 'Audit execution failed');
    } finally {
      setRunning(false);
    }
  }

  const inrList = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  if (loading && !summary) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <ClipboardList className="w-10 h-10 text-primary-500 animate-pulse mb-4" />
        <p className="text-surface-500">Loading end-of-day summary...</p>
      </div>
    );
  }

  const { occupancy, revenue, payments, alerts, auditStatus, targetDateStr, currentBusinessDateStr } = summary || {};
  const { openFolios = [], noShows = [] } = alerts || {};

  const isAuditCompleted = auditStatus === 'success';
  const isSelectedDateCurrent = targetDateStr === currentBusinessDateStr;
  const hasCriticalAlerts = openFolios.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900 tracking-tight">Night Audit</h1>
          <div className="mt-2 flex items-center gap-3">
            <label className="text-surface-500 text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Business Date:
            </label>
            <input 
              type="date" 
              value={selectedDate || targetDateStr || ''} 
              max={currentBusinessDateStr}
              onChange={handleDateChange}
              className="px-3 py-1.5 border border-surface-200 rounded-lg text-sm bg-surface-50 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg font-medium transition-colors border border-surface-200 items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          
          {isAuditCompleted ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Audit Completed</span>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <ClipboardList className="w-5 h-5" />
              Run Night Audit
            </button>
          )}
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Occupancy */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-surface-500 mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
            Occupancy Summary
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-display font-bold text-surface-900">{occupancy?.occupied || 0}</p>
              <p className="text-sm text-surface-500">Rooms Occupied</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-surface-700">{occupancy?.available || 0} Available</p>
              <p className="text-sm text-surface-400">{occupancy?.outOfOrder || 0} Out of Order</p>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-surface-500 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            Projected Revenue
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-display font-bold text-surface-900">{inrList.format(revenue?.total || 0).replace('.00', '')}</p>
              <p className="text-sm text-surface-500">Total Posted Today</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-surface-700">Room: {inrList.format(revenue?.room || 0)}</p>
              <p className="text-sm text-surface-400">Other: {inrList.format((revenue?.fNb || 0) + (revenue?.other || 0))}</p>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary-50 rounded-bl-full -mr-16 -mt-16 -z-10" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-surface-500 mb-4 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-purple-500" />
            Payments Collected
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-display font-bold text-primary-600">{inrList.format(payments?.total || 0).replace('.00', '')}</p>
              <p className="text-sm text-surface-500">Total Realized Today</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-surface-700">Cash: {inrList.format(payments?.cash || 0)}</p>
              <p className="text-sm text-surface-500">UPI/Card: {inrList.format((payments?.upi || 0) + (payments?.card || 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-100 bg-surface-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Action Required (Alerts)
            </h2>
            {(openFolios.length > 0 || noShows.length > 0) ? (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 uppercase tracking-wider">
                {openFolios.length + noShows.length} Pending
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 uppercase tracking-wider">
                All Clear
              </span>
            )}
          </div>
          <p className="text-sm text-surface-500 pl-7 leading-relaxed">
            Review these critical items before running the night audit. Ensure <strong>Open Folios</strong> (in-house guests with unpaid balances) are settled or acknowledged, and <strong>No-Shows</strong> (guests who didn't arrive today) are cancelled or charged.
          </p>
        </div>
        
        <div className="divide-y divide-surface-100">
          {openFolios.length === 0 && noShows.length === 0 && (
            <div className="p-8 text-center text-surface-500">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-surface-700">No Action Needed</p>
              <p className="text-sm mt-1">All in-house folios are balanced and there are no impending no-shows.</p>
            </div>
          )}

          {openFolios.map((folio: any) => (
            <div key={folio.id} className="p-4 sm:px-6 hover:bg-surface-50 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mt-1">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-surface-900">{folio.guestDetails?.name || 'Guest'}</h4>
                  <p className="text-sm text-surface-500">
                    Booking: <span className="font-mono text-surface-700">{folio.bookingNumber}</span> • <span className="text-red-600 font-medium">Payment Pending</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{inrList.format(folio.balance)}</p>
                <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Unpaid Balance</p>
              </div>
            </div>
          ))}

          {noShows.map((booking: any) => (
            <div key={booking.id} className="p-4 sm:px-6 hover:bg-surface-50 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mt-1">
                  <FileWarning className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-surface-900">{booking.guestDetails?.name || 'Guest'}</h4>
                  <p className="text-sm text-surface-500">Booking: <span className="font-mono text-surface-700">{booking.bookingNumber}</span> • Past Check-in</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between bg-surface-50">
          <h2 className="text-base font-bold text-surface-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" /> Audit History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50/50 text-surface-500 uppercase tracking-wider font-semibold text-xs border-b border-surface-100">
              <tr>
                <th className="px-6 py-4">Audit Date</th>
                <th className="px-6 py-4">Executed At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Revenue Posted</th>
                <th className="px-6 py-4 text-right">Folios Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-500">
                    No night audit history found.
                  </td>
                </tr>
              ) : history.map((log: any) => (
                <tr key={log.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-surface-900">
                    {new Date(log.auditDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' })}
                  </td>
                  <td className="px-6 py-4 text-surface-500">
                    {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-surface-900">
                    {log.metrics?.totalRevenueAppended ? inrList.format(log.metrics.totalRevenueAppended) : '₹0'}
                  </td>
                  <td className="px-6 py-4 text-right text-surface-500">
                    {log.metrics?.folioChargesPosted || 0} charges
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-display font-bold text-surface-900 mb-2">Run Night Audit?</h2>
              <p className="text-surface-600 text-sm mb-4 leading-relaxed">
                You are about to run the Night Audit for <strong className="text-surface-900">{targetDateStr}</strong>. 
                This action will post all room charges for occupied rooms and advance the business date.
              </p>
              
              {hasCriticalAlerts && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> You have open folios with unpaid balances.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowConfirm(false)}
                  disabled={running}
                  className="flex-1 px-4 py-2.5 text-surface-600 font-medium hover:bg-surface-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRunAudit}
                  disabled={running}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {running ? 'Running...' : 'Confirm Run'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
