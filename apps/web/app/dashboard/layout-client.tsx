'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Building2, LayoutDashboard, BedDouble, CalendarDays, Users, CreditCard,
  BarChart3, Settings, LogOut, Menu, X, Bell, ChevronDown, Sparkles,
  ClipboardList, TrendingUp, Star, Globe, Clock, Network, Tag, Shield, Languages, Lock, Eye, ArrowLeft,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { PropertyTypeProvider, type PropertyType } from '@/lib/property-context';
import { apiFetch } from '@/lib/api';
import { type PlanCode, PLAN_LABELS, hasAccess } from '@/lib/plan-gate';

const DASHBOARD_LOCALES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
] as const;

async function loadMessages(locale: string) {
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return mod.default;
  } catch {
    const mod = await import('@/messages/en.json');
    return mod.default;
  }
}

const sidebarGroups = [
  {
    category: 'Management', i18nKey: 'management',
    links: [
      { href: '/dashboard',           icon: LayoutDashboard, label: 'Overview',       i18nKey: 'overview',       requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/rooms',     icon: BedDouble,       label: 'Rooms',          i18nKey: 'rooms',          requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/bookings',  icon: CalendarDays,    label: 'Bookings',       i18nKey: 'bookings',       requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/guests',    icon: Users,           label: 'Guests',         i18nKey: 'guests',         requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/analytics', icon: BarChart3,       label: 'Analytics',      i18nKey: 'analytics',      requiredPlan: 'basic' as PlanCode },
    ]
  },
  {
    category: 'Front Desk', i18nKey: 'frontDesk',
    links: [
      { href: '/dashboard/front-desk/shifts', icon: Clock,          label: 'Staff Shifts',  i18nKey: 'staffShifts',   requiredPlan: 'basic' as PlanCode },
      { href: '/dashboard/night-audit',       icon: ClipboardList,  label: 'Night Audit',   i18nKey: 'nightAudit',    requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/rooms/calendar',    icon: CalendarDays,   label: 'Room Calendar', i18nKey: 'roomCalendar',  requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/housekeeping',      icon: Sparkles,       label: 'Housekeeping',  i18nKey: 'housekeeping',  requiredPlan: 'free' as PlanCode },
      { href: '/dashboard/reviews',           icon: Star,           label: 'Reviews',       i18nKey: 'reviews',       requiredPlan: 'basic' as PlanCode },
      { href: '/dashboard/billing',           icon: CreditCard,     label: 'Billing',       i18nKey: 'billing',       requiredPlan: 'basic' as PlanCode },
      { href: '/dashboard/compliance/register', icon: Shield,       label: 'Compliance',    i18nKey: 'compliance',    requiredPlan: 'basic' as PlanCode },
    ]
  },
  {
    category: 'Sales & Marketing', i18nKey: 'salesMarketing',
    links: [
      { href: '/dashboard/channels', icon: Network,    label: 'Channel Manager', i18nKey: 'channelManager', requiredPlan: 'enterprise' as PlanCode },
      { href: '/dashboard/pricing',  icon: TrendingUp, label: 'Pricing Engine',  i18nKey: 'pricingEngine',  requiredPlan: 'professional' as PlanCode },
      { href: '/dashboard/coupons',  icon: Tag,        label: 'Coupons',         i18nKey: 'coupons',        requiredPlan: 'basic' as PlanCode },
      { href: '/dashboard/website',  icon: Globe,      label: 'Website Builder', i18nKey: 'websiteBuilder', requiredPlan: 'basic' as PlanCode },
    ]
  },
  {
    category: 'System', i18nKey: 'system',
    links: [
      { href: '/dashboard/settings', icon: Settings, label: 'Settings', i18nKey: 'settings', requiredPlan: 'free' as PlanCode },
    ]
  }
];

// Sidebar badge labels (longer display text than PLAN_LABELS)
const SIDEBAR_PLAN_BADGE: Record<string, string> = {
  free:         'Free Plan',
  basic:        'Starter Plan',
  professional: 'Professional',
  enterprise:   'Enterprise',
};

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const searchParams = useSearchParams();
  const adminPreviewId = searchParams.get('admin_preview');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState<any>(null);
  const [propertyName, setPropertyName] = useState('My Property');
  const [plan, setPlan]               = useState('free');
  const [propertyType, setPropertyType] = useState<PropertyType>('hotel');
  const [locale, setLocale]           = useState('en');
  const [messages, setMessages]       = useState<any>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [previewTenant, setPreviewTenant] = useState<{ name: string; plan: string; propertyType: string } | null>(null);

  // Load messages when locale changes
  useEffect(() => {
    loadMessages(locale).then(setMessages);
  }, [locale]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.preferredLanguage && u.preferredLanguage !== locale) {
        setLocale(u.preferredLanguage);
      }
    }

    // Admin preview mode — fetch the target tenant and override sidebar context.
    // The admin's own membership/plan is NOT changed; only this tab's display changes.
    if (adminPreviewId) {
      const token = localStorage.getItem('accessToken') || '';
      fetch(`/api/v1/platform/tenants/${adminPreviewId}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            const t = res.data;
            setPreviewTenant({ name: t.name, plan: t.plan, propertyType: t.propertyType });
            setPropertyName(t.name);
            setPlan(t.plan || 'free');
            setPropertyType((t.propertyType as PropertyType) || 'hotel');
          }
        })
        .catch(() => {/* non-critical */});
      return; // skip membership read when in preview mode
    }

    const memberships = localStorage.getItem('memberships');
    if (memberships) {
      try {
        const parsed = JSON.parse(memberships);
        if (parsed?.[0]?.tenant) {
          if (parsed[0].tenant.status === 'pending_approval') {
            router.replace('/pending-approval');
            return;
          }
          setPropertyName(parsed[0].tenant.name || 'My Property');
          setPlan(parsed[0].tenant.plan || 'free');
          setPropertyType((parsed[0].tenant.propertyType as PropertyType) || 'hotel');
        }
      } catch { /* ignore */ }
    }
  }, [router, adminPreviewId]);

  async function handleLanguageChange(newLocale: string) {
    setLocale(newLocale);
    setLangMenuOpen(false);
    // Persist to cookie for middleware/SSR
    document.cookie = `istays_locale=${newLocale}; path=/; max-age=${60*60*24*365}`;
    // Persist to user profile in DB
    try {
      await apiFetch('/auth/me/language', { method: 'PUT', body: JSON.stringify({ language: newLocale }) });
      // Update localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        u.preferredLanguage = newLocale;
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch { /* non-critical */ }
  }

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('memberships');
    document.cookie = 'accessToken=; path=/; max-age=0';
    router.push('/login');
  }

  // Don't render until messages are loaded to prevent flash
  if (!messages) {
    return <div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const currentLang = DASHBOARD_LOCALES.find(l => l.code === locale) || DASHBOARD_LOCALES[0];

  return (
    <NextIntlClientProvider locale={locale} messages={messages} getMessageFallback={({key}) => ''}>
    <div className="min-h-screen bg-surface-50 flex flex-col">

      {/* Admin Preview Banner */}
      {previewTenant && (
        <div className="sticky top-0 z-[60] flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500 text-amber-950">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Admin Preview: <strong>{previewTenant.name}</strong> &mdash; {SIDEBAR_PLAN_BADGE[previewTenant.plan] || previewTenant.plan} plan</span>
          </div>
          <a
            href={`/admin/tenants/${adminPreviewId}`}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-950/20 hover:bg-amber-950/30 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit Preview
          </a>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
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
            <button onClick={() => router.push('/dashboard/settings')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-900 border border-surface-800 hover:bg-surface-800 transition-colors text-white group" title="Manage Property Settings">
              <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center border border-surface-700 group-hover:bg-primary-900 group-hover:border-primary-800 transition-colors">
                <Building2 className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{propertyName}</p>
                <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider">{SIDEBAR_PLAN_BADGE[plan] || plan}</p>
              </div>
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-surface-800 group-hover:bg-primary-900 transition-colors">
                <Settings className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-300" />
              </div>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto w-full no-scrollbar">
            {sidebarGroups.map((group) => (
              <div key={group.category} className="space-y-1 w-full">
                <h3 className="px-3 text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
                  {messages?.Dashboard?.sidebar?.[group.i18nKey] || group.category}
                </h3>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                    const locked = !hasAccess(plan, link.requiredPlan);
                    const requiredLabel = PLAN_LABELS[link.requiredPlan];

                    if (locked) {
                      return (
                        <button
                          key={link.href}
                          onClick={() => {
                            toast(`${link.label} requires the ${requiredLabel} plan`, {
                              description: `Upgrade to unlock this feature.`,
                              action: {
                                label: 'Upgrade →',
                                onClick: () => window.open('/pricing', '_blank', 'noopener,noreferrer'),
                              },
                              duration: 4000,
                            });
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-left text-surface-600 opacity-60 cursor-not-allowed hover:opacity-80 transition-opacity"
                        >
                          <link.icon className="w-5 h-5" />
                          <span className="flex-1">{messages?.Dashboard?.sidebar?.[link.i18nKey] || link.label}</span>
                          <Lock className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                        </button>
                      );
                    }

                    return (
                      <Link key={link.href} href={link.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary-900/50 text-primary-400' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                        }`}
                        onClick={() => setSidebarOpen(false)}>
                        <link.icon className="w-5 h-5" />
                        <span>{messages?.Dashboard?.sidebar?.[link.i18nKey] || link.label}</span>
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
              <span>{messages?.Dashboard?.sidebar?.logOut || 'Log out'}</span>
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

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative">
              <button onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-200 bg-white text-xs font-medium text-surface-600 hover:bg-surface-50 transition-all">
                <Languages className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang.native}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-xl border border-surface-200 shadow-xl py-1 max-h-80 overflow-y-auto">
                    {DASHBOARD_LOCALES.map((lang) => (
                      <button key={lang.code} onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-primary-50 transition-colors ${
                          locale === lang.code ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-surface-700'
                        }`}>
                        <span>{lang.native}</span>
                        <span className="text-xs text-surface-400">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="relative text-surface-400 hover:text-surface-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-surface-200">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                {user?.fullName?.[0] || 'U'}
              </div>
              <span className="text-sm font-semibold text-surface-700 hidden md:block">{user?.fullName || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <PropertyTypeProvider propertyType={propertyType}>
          {children}
          </PropertyTypeProvider>
        </main>
      </div>
      </div>
    </div>
    </NextIntlClientProvider>
  );
}
