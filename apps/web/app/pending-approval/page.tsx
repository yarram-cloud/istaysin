'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Clock, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';
import { authApi, saveAuthData } from '@/lib/api';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [propertyName, setPropertyName] = useState('Your property');
  const [noAuth, setNoAuth] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) { setNoAuth(true); return; }

    try {
      const raw = localStorage.getItem('memberships');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.[0]?.tenant?.name) setPropertyName(parsed[0].tenant.name);
      }
    } catch { /* ignore */ }
  }, []);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await authApi.me();
      if (res.success) {
        const activeMembership = res.data.memberships?.find(
          (m: any) => m.tenant?.status === 'active'
        );
        if (activeMembership) {
          const accessToken = localStorage.getItem('accessToken') || '';
          const refreshToken = localStorage.getItem('refreshToken') || '';
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          saveAuthData({
            accessToken,
            refreshToken,
            user,
            tenantId: activeMembership.tenantId,
            memberships: res.data.memberships,
          });
          router.replace('/dashboard');
          return;
        }
      }
    } catch { /* network error — stay on page */ }
    setChecking(false);
  }

  async function handleLogout() {
    const { clearClientAuth } = await import('@/lib/api');
    await clearClientAuth();
    router.push('/login');
  }

  if (noAuth) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary-50/60 to-white">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <Building2 className="w-10 h-10 text-primary-600" />
          <span className="text-2xl font-display font-bold text-surface-900">istaysin</span>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>

          <div>
            <h1 className="text-xl font-display font-bold text-surface-900 mb-2">
              Under Review
            </h1>
            <p className="text-surface-600 text-sm leading-relaxed">
              <span className="font-semibold text-surface-800">{propertyName}</span>{' '}
              has been registered and is pending verification by our team.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-2.5">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Registration received
            </div>
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              Validation within 24 hours
            </div>
            <p className="text-xs text-amber-600 pt-1 border-t border-amber-200">
              You will receive an email notification once your property is approved.
            </p>
          </div>

          <button
            onClick={checkStatus}
            disabled={checking}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking…' : 'Check Approval Status'}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full text-sm text-surface-400 hover:text-red-500 transition-colors py-2"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
