'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2, LayoutDashboard, BedDouble, CalendarDays, Users, CreditCard,
  BarChart3, Settings, LogOut, Menu, X, Bell, ChevronDown, Sparkles,
  ClipboardList, TrendingUp, Star, Globe
} from 'lucide-react';

const sidebarLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/rooms', icon: BedDouble, label: 'Rooms' },
  { href: '/dashboard/bookings', icon: CalendarDays, label: 'Bookings' },
  { href: '/dashboard/guests', icon: Users, label: 'Guests' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { href: '/dashboard/housekeeping', icon: ClipboardList, label: 'Housekeeping' },
  { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/pricing', icon: TrendingUp, label: 'Revenue' },
  { href: '/dashboard/website', icon: Globe, label: 'Website' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [propertyName, setPropertyName] = useState('My Property');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    // TODO: fetch property name from memberships
  }, []);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    document.cookie = 'accessToken=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface-900/80 backdrop-blur-xl border-r border-white/[0.06]
        transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary-500" />
              <span className="font-display font-bold text-lg">istaysin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Property selector */}
          <div className="px-4 py-4">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{propertyName}</p>
                <p className="text-xs text-surface-500">Free Plan</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}
                  className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                  onClick={() => setSidebarOpen(false)}>
                  <link.icon className="w-5 h-5" />
                  <span className="text-sm">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-white/[0.06]">
            <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-surface-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="relative text-surface-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-sm font-medium text-primary-400">
                {user?.fullName?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium hidden md:block">{user?.fullName || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
