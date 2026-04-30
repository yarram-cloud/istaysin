'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, LayoutDashboard, Building2, ClipboardCheck,
  LogOut, Menu, X, Settings, ChevronRight, TrendingUp,
} from 'lucide-react';

const adminLinks = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Overview',          color: 'text-blue-400',   active_bg: 'bg-blue-500/10 border-blue-500/20' },
  { href: '/admin/registrations',icon: ClipboardCheck,  label: 'Approvals',         color: 'text-amber-400',  active_bg: 'bg-amber-500/10 border-amber-500/20' },
  { href: '/admin/tenants',      icon: Building2,       label: 'All Properties',    color: 'text-emerald-400',active_bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { href: '/admin/revenue',      icon: TrendingUp,      label: 'Revenue',           color: 'text-cyan-400',   active_bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { href: '/admin/settings',     icon: Settings,        label: 'Platform Settings', color: 'text-violet-400', active_bg: 'bg-violet-500/10 border-violet-500/20' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState<any>(null);
  const [authorized, setAuthorized]   = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.isGlobalAdmin) {
        setAuthorized(true);
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  async function handleLogout() {
    const { clearClientAuth } = await import('@/lib/api');
    await clearClientAuth();
    router.push('/login');
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/50 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-surface-950/95 backdrop-blur-2xl
        border-r border-white/[0.06]
        flex flex-col
        transform transition-transform duration-300
        lg:translate-x-0 lg:static lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-bold text-white text-base">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/25 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-amber-400">
                {user?.fullName?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-200 truncate">{user?.fullName || 'Global Admin'}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.04] my-2" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 pb-2">
          {adminLinks.map((link) => {
            const isActive = link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${isActive
                    ? `${link.active_bg} border ${link.color} font-semibold`
                    : 'text-surface-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }
                `}
              >
                <link.icon className={`w-4 h-4 shrink-0 ${isActive ? link.color : 'text-surface-500 group-hover:text-white'}`} />
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronRight className={`w-3.5 h-3.5 ${link.color} opacity-60`} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 border-t border-white/[0.05] pt-3 space-y-0.5">
          <div className="mb-1">
            <p className="px-3 text-[10px] font-bold text-surface-600 uppercase tracking-widest mb-1">Switch Context</p>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-white hover:bg-white/[0.05] border border-transparent transition-all group"
            >
              <Building2 className="w-4 h-4 text-surface-500 group-hover:text-emerald-400 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">Property Dashboard</p>
                <p className="text-[10px] text-surface-600 mt-0.5">Switch to owner view</p>
              </div>
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/10 border border-transparent transition-all group"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Admin identity chip */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Global Admin</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/25 flex items-center justify-center text-sm font-bold text-amber-400">
              {user?.fullName?.[0] || 'A'}
            </div>
            <span className="text-sm font-medium text-white hidden md:block">{user?.fullName || 'Admin'}</span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
