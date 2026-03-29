'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, Building2, MapPin, Phone, Mail, Clock, Loader2, ExternalLink,
} from 'lucide-react';
import { platformApi } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  propertyType: string;
  address?: string;
  city?: string;
  state?: string;
  contactPhone?: string;
  contactEmail?: string;
  gstNumber?: string;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export default function AdminRegistrationsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending_approval');
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
      const subdomainUrl = res?.data?.subdomainUrl;
      const name = tenants.find((t) => t.id === id)?.name || 'Property';
      setTenants((prev) => prev.filter((t) => t.id !== id));
      if (subdomainUrl) {
        setApprovedUrl({ name, url: subdomainUrl });
      }
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
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
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    suspended: 'bg-red-500/15 text-red-300 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Property Registrations</h1>
          <p className="text-surface-400 text-sm mt-1">Review and manage property registration requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-800/50 border border-white/[0.06]">
          {['pending_approval', 'active', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === s ? 'bg-white/10 text-white' : 'text-surface-400 hover:text-white'}`}
            >
              {s === 'pending_approval' ? 'Pending' : s === 'active' ? 'Active' : 'Suspended'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      {/* Approval Success Banner */}
      {approvedUrl && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
          <div>
            <p className="text-emerald-300 font-medium text-sm">✓ {approvedUrl.name} approved!</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">Live at: <span className="font-mono">{approvedUrl.url}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={approvedUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Visit
            </a>
            <button
              onClick={() => setApprovedUrl(null)}
              className="text-surface-500 hover:text-white text-xs px-2 py-1.5 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 font-medium">No {filter === 'pending_approval' ? 'pending' : filter} registrations</p>
        </div>
      ) : (
        /* Cards */
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="glass-card rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Property Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold">{tenant.name}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[tenant.status] || 'bg-surface-700 text-surface-300'}`}>
                      {tenant.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-white/[0.06]">
                      {tenant.propertyType}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-surface-400">
                    {tenant.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{[tenant.city, tenant.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {tenant.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{tenant.contactPhone}</span>
                      </div>
                    )}
                    {tenant.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{tenant.contactEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Registered {new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="text-sm text-surface-500">
                    <span className="text-surface-600">Owner: </span>
                    <span className="text-surface-300">{tenant.owner.fullName}</span>
                    <span className="text-surface-600 mx-1">•</span>
                    <span>{tenant.owner.email}</span>
                  </div>

                  {tenant.gstNumber && (
                    <p className="text-xs text-surface-500">GST: {tenant.gstNumber}</p>
                  )}
                </div>

                {/* Actions */}
                {filter === 'pending_approval' && (
                  <div className="flex items-center gap-2 lg:flex-col lg:min-w-[140px]">
                    <button
                      onClick={() => handleApprove(tenant.id)}
                      disabled={actionLoading === tenant.id}
                      className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === tenant.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: tenant.id, name: tenant.name })}
                      disabled={actionLoading === tenant.id}
                      className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-sm font-medium transition-colors border border-red-500/20 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-white/[0.06] space-y-4">
            <h3 className="text-lg font-semibold text-red-300">Reject &ldquo;{rejectModal.name}&rdquo;?</h3>
            <div>
              <label className="block text-sm text-surface-400 mb-1">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="input-field min-h-[80px] resize-none bg-surface-800/50"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
