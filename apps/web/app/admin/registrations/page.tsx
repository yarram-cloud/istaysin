'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, Building2, MapPin, Phone, Mail,
  Clock, Loader2, ExternalLink, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { platformApi } from '@/lib/api';

interface Tenant {
  id: string; name: string; slug: string; status: string;
  propertyType: string; address?: string; city?: string; state?: string;
  contactPhone?: string; contactEmail?: string; gstNumber?: string; createdAt: string;
  owner: { id: string; fullName: string; email: string; phone?: string };
}

const STATUS_STYLE: Record<string, string> = {
  pending_approval: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  active:           'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  suspended:        'bg-red-500/15 text-red-300 border border-red-500/30',
};

const FILTER_TABS = [
  { id: 'pending_approval', label: 'Pending', color: 'text-amber-400',  activeBg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'active',           label: 'Active',  color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'suspended',        label: 'Suspended', color: 'text-red-400',  activeBg: 'bg-red-500/10 border-red-500/20' },
];

export default function AdminRegistrationsPage() {
  const [tenants, setTenants]         = useState<Tenant[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState('pending_approval');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvedUrl, setApprovedUrl] = useState<{ name: string; url: string } | null>(null);

  function fetchList() {
    setLoading(true);
    platformApi.getRegistrations(filter)
      .then((res: any) => setTenants(res.data || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchList(); }, [filter]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await platformApi.approveProperty(id);
      const name = tenants.find((t) => t.id === id)?.name || 'Property';
      setTenants((prev) => prev.filter((t) => t.id !== id));
      if (res?.data?.subdomainUrl) {
        setApprovedUrl({ name, url: res.data.subdomainUrl });
      }
      toast.success(`${name} approved!`);
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      await platformApi.rejectProperty(rejectModal.id, rejectReason);
      setTenants((prev) => prev.filter((t) => t.id !== rejectModal.id));
      setRejectModal(null);
      setRejectReason('');
      toast.success('Property rejected');
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const activeTab = FILTER_TABS.find((t) => t.id === filter)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Property Registrations
          </h1>
          <p className="text-surface-400 text-sm mt-1">Review and manage property registration requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-surface-900/80 border border-white/[0.06] backdrop-blur self-start">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                filter === tab.id
                  ? `${tab.activeBg} ${tab.color} border-current/30`
                  : 'text-surface-500 hover:text-white border-transparent hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      {/* Approval Success Banner */}
      {approvedUrl && (
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">{approvedUrl.name} approved!</p>
              <p className="text-emerald-400/60 text-xs mt-0.5 font-mono">{approvedUrl.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={approvedUrl.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Visit
            </a>
            <button
              onClick={() => setApprovedUrl(null)}
              className="text-surface-500 hover:text-white text-xs px-2 py-1.5 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-500 text-sm">Loading properties…</p>
          </div>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-surface-900/30">
          <ClipboardCheck className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">
            {filter === 'pending_approval' ? 'All clear!' : `No ${filter} properties`}
          </p>
          <p className="text-surface-500 text-sm mt-1">
            {filter === 'pending_approval' ? 'No pending registrations at the moment.' : 'Nothing to show here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="rounded-2xl border border-white/[0.08] bg-surface-900/60 backdrop-blur p-5 sm:p-6 hover:border-white/[0.14] transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                {/* Left: icon + info */}
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white">{tenant.name}</h3>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[tenant.status] || 'bg-surface-700 text-surface-300'}`}>
                        {tenant.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-white/[0.06] font-medium">
                        {tenant.propertyType}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {tenant.city && (
                        <div className="flex items-center gap-2 text-sm text-surface-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-surface-600" />
                          <span>{[tenant.city, tenant.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {tenant.contactPhone && (
                        <div className="flex items-center gap-2 text-sm text-surface-400">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-surface-600" />
                          <span>{tenant.contactPhone}</span>
                        </div>
                      )}
                      {tenant.contactEmail && (
                        <div className="flex items-center gap-2 text-sm text-surface-400">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-surface-600" />
                          <span className="truncate">{tenant.contactEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-surface-400">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-surface-600" />
                        <span>Registered {new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-surface-600">Owner:</span>
                      <span className="text-surface-300 font-medium">{tenant.owner.fullName}</span>
                      <span className="text-surface-700">·</span>
                      <span className="text-surface-500 truncate">{tenant.owner.email}</span>
                    </div>

                    {tenant.gstNumber && (
                      <p className="text-xs text-surface-600 font-mono">GST: {tenant.gstNumber}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {filter === 'pending_approval' && (
                  <div className="flex flex-row lg:flex-col items-center gap-2 lg:min-w-[148px] shrink-0">
                    <button
                      onClick={() => handleApprove(tenant.id)}
                      disabled={actionLoading === tenant.id}
                      className="flex-1 lg:w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                    >
                      {actionLoading === tenant.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle2 className="w-4 h-4" />
                      }
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: tenant.id, name: tenant.name })}
                      disabled={actionLoading === tenant.id}
                      className="flex-1 lg:w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-white/[0.1] bg-surface-900/95 backdrop-blur p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reject Property?</h3>
                <p className="text-sm text-surface-400">&ldquo;{rejectModal.name}&rdquo;</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-white text-sm focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 focus:outline-none resize-none transition-all placeholder-surface-600"
              />
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-white hover:bg-white/[0.05] border border-transparent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
