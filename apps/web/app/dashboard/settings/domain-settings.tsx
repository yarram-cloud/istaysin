'use client';

import { useState, useEffect } from 'react';
import { Globe, Copy, Check, Pencil, ExternalLink, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface DomainStatus {
  slug: string;
  subdomainUrl: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  cnameTarget: string;
  status: string;
}

export function DomainSettings() {
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDomain, setCustomDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [copied, setCopied] = useState(false);

  // Slug editing
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch<any>('/tenants/domain-status');
      if (res.success) {
        setStatus(res.data);
        setCustomDomain(res.data.customDomain || '');
      }
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSlugSave = async () => {
    if (!newSlug.trim()) return;
    setSlugSaving(true);
    setMsg('');
    try {
      const res = await apiFetch<any>('/tenants/slug', {
        method: 'PATCH',
        body: JSON.stringify({ slug: newSlug.trim() }),
      });
      if (res.success) {
        setMsg(res.message || 'Subdomain updated!');
        setMsgType('success');
        setEditingSlug(false);
        fetchStatus();
      } else {
        setMsg(res.error || 'Failed to update subdomain');
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg(e.message || 'Network error');
      setMsgType('error');
    }
    setSlugSaving(false);
  };

  const handleSaveDomain = async () => {
    setSaving(true);
    setMsg('');
    try {
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : '';
      const res = await apiFetch<any>(`/tenants/${tenantId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ customDomain: customDomain.trim() || null }),
      });
      if (res.success) {
        setMsg('Custom domain saved! Now verify your DNS settings below.');
        setMsgType('success');
        fetchStatus();
      } else {
        setMsg(res.error || 'Failed to save');
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg(e.message || 'Network error');
      setMsgType('error');
    }
    setSaving(false);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setMsg('');
    try {
      const res = await apiFetch<any>('/tenants/verify-domain', { method: 'POST' });
      if (res.success) {
        if (res.data.verified) {
          setMsg('✅ Domain verified! Your custom domain is now active.');
          setMsgType('success');
        } else {
          setMsg(`❌ ${res.data.dnsResult}`);
          setMsgType('error');
        }
        fetchStatus();
      } else {
        setMsg(res.error || 'Verification failed');
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg(e.message || 'Network error during verification');
      setMsgType('error');
    }
    setVerifying(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setMsg('Copied to clipboard!');
    setMsgType('info');
    setTimeout(() => { setCopied(false); setMsg(''); }, 2000);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/[0.06]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 bg-surface-700 rounded" />
          <div className="h-10 bg-surface-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-5">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary-400" />
        <h3 className="text-base font-semibold">Domain Settings</h3>
      </div>

      {/* Subdomain Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Subdomain
        </label>
        {editingSlug ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="new-subdomain"
                className="flex-1 rounded-lg border border-primary-500/30 bg-surface-800/50 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <span className="text-sm text-surface-400">.{status?.subdomainUrl?.split('.').slice(1).join('.') || 'istaysin.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSlugSave}
                disabled={slugSaving || !newSlug.trim() || newSlug === status?.slug}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50 transition-colors"
              >
                {slugSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditingSlug(false); setNewSlug(''); }}
                className="rounded-lg border border-white/[0.06] px-4 py-2 text-sm text-surface-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-surface-800/50 border border-white/[0.06] px-4 py-2.5 font-mono text-sm">
              {status?.subdomainUrl || `${status?.slug}.istaysin.com`}
            </div>
            <button
              onClick={() => { setEditingSlug(true); setNewSlug(status?.slug || ''); }}
              className="rounded-lg border border-white/[0.06] p-2.5 text-surface-400 hover:text-white hover:bg-surface-800/50 transition-colors"
              title="Edit subdomain"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => copyToClipboard(`https://${status?.subdomainUrl}`)}
              className="rounded-lg border border-white/[0.06] p-2.5 text-surface-400 hover:text-white hover:bg-surface-800/50 transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={`https://${status?.subdomainUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/[0.06] p-2.5 text-surface-400 hover:text-white hover:bg-surface-800/50 transition-colors"
              title="Visit property"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
        <p className="text-xs text-surface-500">
          Guests can access your property at this subdomain. Click the pencil to change it.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Custom Domain Section */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Custom Domain
        </label>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="www.myproperty.com"
            className="flex-1 rounded-lg border border-white/[0.06] bg-surface-800/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSaveDomain}
            disabled={saving}
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* DNS Instructions */}
        {status?.customDomain && (
          <div className="rounded-xl border border-white/[0.06] bg-surface-800/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              {status.customDomainVerified ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                DNS Configuration {status.customDomainVerified ? '✓ Verified' : 'Required'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-1.5 text-xs text-surface-500 font-medium">Type</th>
                    <th className="text-left py-1.5 text-xs text-surface-500 font-medium">Name</th>
                    <th className="text-left py-1.5 text-xs text-surface-500 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 font-mono text-surface-300">CNAME</td>
                    <td className="py-1.5 font-mono text-surface-300">{status.customDomain}</td>
                    <td className="py-1.5 font-mono text-primary-400 font-medium">
                      {status.cnameTarget}
                      <button
                        onClick={() => copyToClipboard(status.cnameTarget)}
                        className="ml-2 text-surface-500 hover:text-white"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3 inline" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-surface-500">
              Add this CNAME record in your domain provider&apos;s DNS settings. DNS changes may take up to 48 hours to propagate.
            </p>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="rounded-lg border border-primary-500/20 bg-primary-600/10 px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-600/20 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {verifying ? 'Checking DNS…' : 'Verify Domain'}
            </button>
          </div>
        )}
      </div>

      {/* Status Message */}
      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm ${
          msgType === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
          msgType === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
          'bg-primary-500/10 text-primary-300 border border-primary-500/20'
        }`}>
          {msg}
        </div>
      )}
    </div>
  );
}
