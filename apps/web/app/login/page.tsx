'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // Set cookie for middleware
        document.cookie = `accessToken=${res.data.accessToken}; path=/; max-age=${15 * 60}`;

        if (res.data.memberships?.length > 0) {
          localStorage.setItem('tenantId', res.data.memberships[0].tenantId);
        }

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary-50/60 to-white relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Building2 className="w-10 h-10 text-primary-600" />
            <span className="text-2xl font-display font-bold text-surface-900">istaysin</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Welcome back</h1>
          <p className="text-surface-500">Sign in to manage your property</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
            <input
              id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password" type={showPassword ? 'text' : 'password'} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input-field pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-surface-500">
              <input type="checkbox" className="rounded border-surface-300 bg-white" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-surface-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
