'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2, LayoutDashboard, BedDouble, CalendarDays, Users, CreditCard,
  BarChart3, Settings, LogOut, Menu, X, Bell, ChevronDown, Sparkles,
  ClipboardList, TrendingUp, Star, Globe, Clock, Network
} from 'lucide-react';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';

const sidebarGroups = [
  {
    category: 'Management',
    links: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { href: '/dashboard/rooms', icon: BedDouble, label: 'Rooms' },
      { href: '/dashboard/bookings', icon: CalendarDays, label: 'Bookings' },
      { href: '/dashboard/guests', icon: Users, label: 'Guests' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ]
  },
  {
    category: 'Front Desk',
    links: [
      { href: '/dashboard/front-desk/shifts', icon: Clock, label: 'Staff Shifts' },
      { href: '/dashboard/housekeeping', icon: Sparkles, label: 'Housekeeping' },
      { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
      { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    ]
  },
  {
    category: 'Sales & Marketing',
    links: [
      { href: '/dashboard/channels', icon: Network, label: 'Channel Manager' },
      { href: '/dashboard/pricing', icon: TrendingUp, label: 'Pricing Engine' },
      { href: '/dashboard/website', icon: Globe, label: 'Website Builder' },
    ]
  },
  {
    category: 'System',
    links: [
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ]
  }
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
    <NextIntlClientProvider locale="en" messages={{}} getMessageFallback={({key}) => ''}>
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface-950 border-r border-surface-800
        transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-surface-800">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary-500" />
              <span className="font-display font-bold text-lg text-white">istaysin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Property selector */}
          <div className="px-4 py-4">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 transition-colors text-white">
              <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center border border-surface-700">
                <Building2 className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{propertyName}</p>
                <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider">Free Plan</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto w-full no-scrollbar">
            {sidebarGroups.map((group) => (
              <div key={group.category} className="space-y-1 w-full">
                <h3 className="px-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
                  {group.category}
                </h3>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                    return (
                      <Link key={link.href} href={link.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary-900/50 text-primary-400' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                        }`}
                        onClick={() => setSidebarOpen(false)}>
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-surface-800">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 w-full transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
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
        <header className="h-16 flex items-center justify-between px-6 border-b border-surface-200 bg-white sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-surface-600 hover:text-surface-900">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-6">
            <button className="relative text-surface-400 hover:text-surface-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-surface-200">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                {user?.fullName?.[0] || 'U'}
              </div>
              <span className="text-sm font-semibold text-surface-700 hidden md:block">{user?.fullName || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <Toaster position="top-right" />
          {children}
        </main>
      </div>
    </div>
    </NextIntlClientProvider>
  );
}
