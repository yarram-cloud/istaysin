'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, Calendar, Shield, BarChart3, ChevronRight, Star, Search,
  BedDouble, Users, CreditCard, ClipboardList, Globe, Palette, Bell,
  CheckCircle2, Lock, Server, Eye, ChevronDown, ArrowRight, MapPin,
  Laptop, Smartphone, Sparkles, Zap,
  UserCheck, ShieldCheck,
} from 'lucide-react';

/* ─── FAQ Accordion Item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-50 transition-colors"
      >
        <span className="font-medium text-sm md:text-base text-surface-800">{q}</span>
        <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-surface-500 leading-relaxed animate-fade-in">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Stats Counter ─── */
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="text-sm text-surface-500 mt-1">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [searchCity, setSearchCity] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-display font-bold text-surface-900">istaysin</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-surface-500">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#ecosystem" className="hover:text-primary-600 transition-colors">Ecosystem</a>
            <a href="#pricing" className="hover:text-primary-600 transition-colors">Pricing</a>
            <a href="#find-stay" className="hover:text-primary-600 transition-colors">Find a Stay</a>
            <a href="#faq" className="hover:text-primary-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">Log In</Link>
            <Link href="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ═══ 1. HERO BANNER ═══ */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden bg-gradient-to-b from-primary-50/60 to-white">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-sm mb-6">
                <Star className="w-4 h-4" /> Now open for property registrations across India
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
                <span className="text-surface-900">Everything your</span><br />
                <span className="text-surface-900">hotel needs,</span><br />
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  in one platform
                </span>
              </h1>
              <p className="text-lg text-surface-500 max-w-lg mb-8 leading-relaxed">
                Booking engine, room management, guest check-in, GST-compliant billing, analytics, 
                and your own branded website. Set up in minutes, not months.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn-primary text-lg px-8 py-3.5 flex items-center justify-center gap-2">
                  Register Your Property - It&apos;s Free <ChevronRight className="w-5 h-5" />
                </Link>
                <a href="#find-stay" className="btn-secondary text-lg px-8 py-3.5 flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" /> Find a Stay
                </a>
              </div>
            </div>
            {/* Right: hero image */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/10 border border-surface-200">
                <Image src="/images/hero-dashboard.png" alt="istaysin Hotel Management Dashboard" width={700} height={450} className="w-full" priority />
              </div>
              {/* Floating cards */}
              <div className="absolute -left-8 top-12 glass-card p-3 flex items-center gap-3 animate-slide-up">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-800">New Booking!</p>
                  <p className="text-[10px] text-surface-500">Room 204 · ₹3,500/night</p>
                </div>
              </div>
              <div className="absolute -right-4 bottom-16 glass-card p-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-800">Today&apos;s Revenue</p>
                  <p className="text-[10px] text-surface-500">₹1,24,500 · 87% occupancy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. STATS BAR ═══ */}
      <section className="py-10 px-6 border-y border-surface-100 bg-surface-50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value="500+" label="Properties" />
          <StatItem value="10,000+" label="Rooms Managed" />
          <StatItem value="25+" label="Cities" />
          <StatItem value="99.9%" label="Uptime" />
        </div>
      </section>

      {/* ═══ 3. ECOSYSTEM ═══ */}
      <section id="ecosystem" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              The Complete Hotel Ecosystem
            </h2>
            <p className="text-surface-500 max-w-2xl mx-auto">
              Every module your property needs, from the front desk to the back office, 
              working together seamlessly under one roof.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-surface-200 shadow-lg">
              <Image src="/images/ecosystem.png" alt="istaysin Hotel Management Ecosystem" width={600} height={400} className="w-full" />
            </div>
            <div className="space-y-6">
              {[
                { icon: Laptop, title: 'Management Dashboard', desc: 'Real-time overview of occupancy, revenue, check-ins, and housekeeping. All from one screen.', color: 'bg-primary-50 text-primary-600' },
                { icon: Globe, title: 'Your Branded Website', desc: 'Every property gets its own website with your logo, colors, and domain. Guests book directly with zero commissions.', color: 'bg-emerald-50 text-emerald-600' },
                { icon: Smartphone, title: 'Guest Self-Service', desc: 'Guests can browse rooms, check availability, and book online 24/7 from any device.', color: 'bg-amber-50 text-amber-600' },
                { icon: Users, title: 'Multi-Role Access', desc: 'Owner, Manager, Front Desk, Housekeeping, Accountant. Each role sees only what they need.', color: 'bg-accent-500/10 text-accent-600' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 group">
                  <div className={`w-10 h-10 rounded-xl ${item.color.split(' ')[0]} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-5 h-5 ${item.color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. CORE FEATURES ═══ */}
      <section id="features" className="py-20 px-6 bg-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need to Run Your Property
            </h2>
            <p className="text-surface-500 max-w-2xl mx-auto">
              One platform. Zero complexity. From online bookings to GST-compliant invoicing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calendar, title: 'Booking Engine', desc: 'Online + walk-in bookings with real-time availability. Guests book directly, no OTA commissions.', color: 'bg-primary-50 text-primary-600' },
              { icon: BedDouble, title: 'Room Management', desc: 'Visual room board with floors, room types, amenities, status tracking, and seasonal rate management.', color: 'bg-emerald-50 text-emerald-600' },
              { icon: UserCheck, title: 'Guest Check-in/out', desc: 'Digital Form-B, ID verification, C-Form for foreign nationals. Automated housekeeping on checkout.', color: 'bg-amber-50 text-amber-600' },
              { icon: CreditCard, title: 'GST-Compliant Billing', desc: 'Auto-calculate CGST/SGST by Sep 2025 slabs. Folio charges, payments, and professional invoices.', color: 'bg-violet-50 text-violet-600' },
              { icon: BarChart3, title: 'Revenue Analytics', desc: 'Occupancy, ADR, RevPAR dashboards. Compare performance across date ranges and booking sources.', color: 'bg-cyan-50 text-cyan-600' },
              { icon: ClipboardList, title: 'Housekeeping', desc: 'Auto-generated tasks on checkout. Room status board, assignment tracking, and maintenance requests.', color: 'bg-orange-50 text-orange-600' },
              { icon: Users, title: 'Staff Management', desc: 'Invite staff with role-based access. Owner, Manager, Front Desk, Housekeeping, Accountant roles.', color: 'bg-rose-50 text-rose-600' },
              { icon: Bell, title: 'Notifications', desc: 'Email confirmations, booking alerts, payment receipts. SMS integration ready for Phase 2.', color: 'bg-indigo-50 text-indigo-600' },
            ].map((feature) => (
              <div key={feature.title} className="glass-card p-6 hover:shadow-lg transition-all duration-300 group cursor-default">
                <div className={`w-12 h-12 rounded-xl ${feature.color.split(' ')[0]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color.split(' ')[1]}`} />
                </div>
                <h3 className="text-lg font-semibold text-surface-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. YOUR BRAND, YOUR HOTEL ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-surface-200 shadow-xl">
                <Image src="/images/branded-website.png" alt="Your Hotel's Branded Website" width={600} height={400} className="w-full" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-600 text-xs font-medium mb-6">
                <Palette className="w-3.5 h-3.5" /> White-Label Ready
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Your Brand. Your Hotel.{' '}
                <span className="bg-gradient-to-r from-accent-500 to-primary-500 bg-clip-text text-transparent">
                  Your Website.
                </span>
              </h2>
              <p className="text-surface-500 mb-8 leading-relaxed">
                Every property on istaysin gets its own branded website with your logo, colors, 
                tagline, and a direct booking engine. No &quot;powered by&quot; watermarks. Your guests see 
                only your brand.
              </p>
              <div className="space-y-4">
                {[
                  'Custom logo, colors, and tagline',
                  'yourhotel.istaysin.com subdomain (custom domain on Pro)',
                  'Direct booking, zero commission',
                  'Mobile-first, responsive design',
                  'SEO-optimized property pages',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-surface-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. GO LIVE IN 3 STEPS ═══ */}
      <section className="py-20 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Go Live in 3 Simple Steps
          </h2>
          <p className="text-surface-500 mb-16 max-w-xl mx-auto">
            From registration to your first booking, it takes minutes, not months.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: UserCheck, title: 'Register', desc: 'Create your account and register your property. It takes less than 2 minutes.' },
              { step: '02', icon: BedDouble, title: 'Set Up', desc: 'Add your floors, rooms, rates, and amenities. Upload your logo and customize branding.' },
              { step: '03', icon: Zap, title: 'Go Live', desc: 'Start accepting bookings on your branded URL. Share it with guests and go live instantly.' },
            ].map((s) => (
              <div key={s.step} className="glass-card p-8 relative group hover:shadow-lg transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {s.step}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-800 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. FIND A STAY NEARBY ═══ */}
      <section id="find-stay" className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Find a Stay Near You
          </h2>
          <p className="text-surface-500 mb-10 max-w-xl mx-auto">
            Browse verified hotels, lodges, and dharamshalas across India. Book directly at the best rate.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-12">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Enter city (e.g. Jaipur, Manali, Goa)"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="input-field pl-12 py-3.5"
              />
            </div>
            <button className="btn-primary px-8 py-3.5 flex items-center justify-center gap-2">
              <Search className="w-5 h-5" /> Search
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { name: 'Hill View Resort', city: 'Manali, HP', type: 'Resort', rooms: 24, rating: 4.6 },
              { name: 'Lakshmi Guest House', city: 'Varanasi, UP', type: 'Guest House', rooms: 8, rating: 4.3 },
              { name: 'Ocean Breeze Hotel', city: 'Goa', type: 'Hotel', rooms: 42, rating: 4.8 },
            ].map((p) => (
              <div key={p.name} className="glass-card p-5 hover:shadow-lg transition-all cursor-pointer group">
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary-50 to-accent-500/10 flex items-center justify-center mb-4">
                  <Building2 className="w-10 h-10 text-primary-300" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-surface-800 group-hover:text-primary-600 transition-colors">{p.name}</h3>
                    <p className="text-xs text-surface-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {p.city}
                    </p>
                  </div>
                  <span className="badge-info text-xs">{p.type}</span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-surface-500">
                  <span>{p.rooms} rooms</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" /> {p.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8. PRICING ═══ */}
      <section id="pricing" className="py-20 px-6 bg-surface-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-surface-500 mb-16 max-w-xl mx-auto">Start free. Upgrade when you grow. No hidden fees.</p>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Free', price: '₹0', period: 'forever', highlight: false,
                features: ['Up to 5 rooms', '50 bookings/month', 'Basic dashboard', 'yourhotel.istaysin.com', 'Email support'],
              },
              {
                name: 'Starter', price: '₹999', period: '/month', highlight: false,
                features: ['Up to 20 rooms', 'Unlimited bookings', 'Staff management', 'GST invoicing', 'Priority email support'],
              },
              {
                name: 'Professional', price: '₹2,999', period: '/month', highlight: true,
                features: ['Up to 100 rooms', 'Custom domain', 'Advanced analytics', 'Seasonal rates & offers', 'Phone + email support', 'API access'],
              },
              {
                name: 'Enterprise', price: '₹7,999', period: '/month', highlight: false,
                features: ['Unlimited rooms', 'OTA integration', 'Multi-property', 'Dedicated account manager', 'SLA guarantee', 'Custom development'],
              },
            ].map((plan) => (
              <div key={plan.name} className={`glass-card p-6 flex flex-col relative ${plan.highlight ? 'border-primary-500 ring-2 ring-primary-100' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-surface-800 mb-1 mt-2">{plan.name}</h3>
                <p className="mb-4">
                  <span className="text-3xl font-display font-bold text-surface-900">{plan.price}</span>
                  <span className="text-sm text-surface-400">{plan.period}</span>
                </p>
                <ul className="space-y-3 mb-6 flex-1 text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={plan.highlight ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
                  {plan.price === '₹0' ? 'Get Started Free' : 'Start 14-Day Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 9. DATA SECURITY ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise-Grade Security
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Your Data is Safe With Us
          </h2>
          <p className="text-surface-500 mb-12 max-w-xl mx-auto">
            We take data security seriously. Your hotel data and guest information are protected 
            with industry-leading security practices.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted in transit (TLS 1.3) and at rest (AES-256)' },
              { icon: Server, title: 'Isolated Databases', desc: 'Row-level security ensures each property\'s data is strictly isolated' },
              { icon: Eye, title: '99.9% Uptime', desc: 'Built on scalable cloud infrastructure with automatic failover' },
              { icon: Shield, title: 'GDPR Ready', desc: 'Data handling compliant with privacy standards. You own your data.' },
            ].map((item) => (
              <div key={item.title} className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-surface-800 mb-2">{item.title}</h3>
                <p className="text-xs text-surface-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 10. FAQ ═══ */}
      <section id="faq" className="py-20 px-6 bg-surface-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-surface-500 text-center mb-12">
            Everything you need to know about istaysin.
          </p>

          <div className="space-y-3">
            <FaqItem q="What types of properties can use istaysin?" a="istaysin is designed for any accommodation: hotels, lodges, resorts, guest houses, dharamshalas, homestays, and hostels. Whether you have 1 room or 500, istaysin scales with you." />
            <FaqItem q="Is there a free plan?" a="Yes! Our Free tier gives you up to 5 rooms, 50 bookings per month, a basic dashboard, and your own branded subdomain at yourhotel.istaysin.com. No credit card required." />
            <FaqItem q="Do I need to be tech-savvy to set this up?" a="Not at all. You can register, add rooms, and go live within 10 minutes. Our step-by-step setup wizard guides you through everything. If you get stuck, our support team is here to help." />
            <FaqItem q="How does GST billing work?" a="istaysin automatically calculates CGST and SGST based on the Sep 2025 slab rates (exempt up to ₹1000, 12% for ₹1001–₹7500, 18% above ₹7500). Every charge gets the correct SAC code, and invoices are generated with proper tax breakdowns." />
            <FaqItem q="Can I use my own domain?" a="Yes, on the Professional plan and above, you can connect your own custom domain (e.g., book.yourhotel.com). Free and Starter plans get a yourhotel.istaysin.com subdomain." />
            <FaqItem q="Is my guest data secure?" a="Absolutely. Each property's data is strictly isolated using row-level database security. All data is encrypted in transit and at rest. We never sell or share your data with third parties." />
            <FaqItem q="Can I invite my front desk staff?" a="Yes. You can invite staff members with specific roles like Front Desk, Housekeeping, Accountant, and General Manager. Each role sees only what they need." />
            <FaqItem q="What about OTA integration?" a="OTA (Online Travel Agency) integration, including MakeMyTrip, Goibibo, and Booking.com channel manager, is available on the Enterprise plan and coming to Professional in Phase 2." />
          </div>
        </div>
      </section>

      {/* ═══ 11. BOTTOM CTA ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl p-12 md:p-16 relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,92,246,0.3),transparent)]" />
            <div className="relative">
              <Sparkles className="w-10 h-10 text-primary-200 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Ready to Transform Your Property?
              </h2>
              <p className="text-primary-100 mb-8 max-w-lg mx-auto">
                Join hundreds of properties across India already using istaysin. 
                Register today. It&apos;s free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-primary-700 bg-white hover:bg-primary-50 transition-all text-lg gap-2 shadow-lg">
                  Register Your Property <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-white border-2 border-white/30 hover:bg-white/10 transition-all text-lg">
                  Log In to Dashboard
                </Link>
              </div>
              <p className="text-xs text-primary-200 mt-6">
                Free forever for up to 5 rooms. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 px-6 bg-surface-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-7 h-7 text-primary-400" />
                <span className="text-xl font-display font-bold">istaysin</span>
              </div>
              <p className="text-sm text-surface-400 leading-relaxed">
                The modern operating system for hotels, lodges, and hospitality businesses across India.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-surface-300">Product</h4>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#ecosystem" className="hover:text-white transition-colors">Ecosystem</a></li>
                <li><a href="#find-stay" className="hover:text-white transition-colors">Find a Stay</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-surface-300">Company</h4>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-surface-300">Legal</h4>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-surface-700 gap-4">
            <p className="text-sm text-surface-400">
              © 2026 istaysin. All rights reserved. Made with ❤️ in India.
            </p>
            <div className="flex items-center gap-4 text-sm text-surface-400">
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> SSL Secured</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> GDPR Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
