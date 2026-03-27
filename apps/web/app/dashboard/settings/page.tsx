'use client';

import { Settings as SettingsIcon, Building2, Users, CreditCard, Palette } from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    { icon: Building2, title: 'Property Details', desc: 'Name, address, type, contact info, check-in/out times' },
    { icon: Palette, title: 'Branding', desc: 'Logo, colors, tagline, hero image for your property page' },
    { icon: Users, title: 'Staff Management', desc: 'Invite and manage staff members with role-based access' },
    { icon: CreditCard, title: 'Subscription', desc: 'View and manage your istaysin plan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Settings</h1>
        <p className="text-surface-400">Configure your property and account</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="glass-card p-6 hover:bg-white/[0.08] transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <section.icon className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
                <p className="text-sm text-surface-400">{section.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
