import LegalLayout from '../../components/LegalLayout';
import { Building2, Users, Globe, Shield, Heart, Zap } from 'lucide-react';

export const metadata = {
  title: 'About Us | istaysin',
  description: 'Learn about istaysin, the modern hotel management platform built for Indian hospitality.',
};

export default function AboutPage() {
  return (
    <LegalLayout title="About istaysin" description="We are building the modern operating system for hospitality in India.">

      <div className="space-y-10 text-sm text-surface-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">Our Mission</h2>
          <p>
            India has over 150,000 hotels, lodges, guest houses, and homestays. Most of them still 
            run on registers, spreadsheets, and phone calls. We believe every property, from a 
            5-room dharamshala to a 500-room resort, deserves access to professional management 
            tools without the complexity or cost of legacy software.
          </p>
          <p className="mt-3">
            istaysin is a cloud-first, mobile-ready property management platform designed specifically 
            for Indian hospitality. We handle bookings, rooms, guest check-in, GST-compliant billing, 
            analytics, and even give every property its own branded website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-4">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: 'Privacy First', desc: 'Your data belongs to you. Row-level security ensures every property is isolated at the database level.' },
              { icon: Zap, title: 'Simple by Design', desc: 'No training manuals needed. If your staff can use a phone, they can use istaysin.' },
              { icon: Globe, title: 'Built for India', desc: 'GST billing with proper SAC codes, Form-B/C-Form compliance, UPI payments, and multi-language support.' },
              { icon: Heart, title: 'Fair Pricing', desc: 'Free tier for small properties. No hidden fees, no per-booking commissions, no lock-in contracts.' },
            ].map((item) => (
              <div key={item.title} className="border border-surface-200 rounded-xl p-4">
                <item.icon className="w-5 h-5 text-primary-600 mb-2" />
                <h3 className="font-semibold text-surface-800 mb-1">{item.title}</h3>
                <p className="text-surface-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">Our Story</h2>
          <p>
            istaysin started from a simple observation: small and mid-size hotels across India are 
            underserved by technology. The existing solutions are either too expensive, too complex, 
            or built for Western markets. We set out to build something different: affordable, 
            intuitive, and deeply integrated with Indian regulatory requirements.
          </p>
          <p className="mt-3">
            Today, istaysin is used by properties across 25+ cities in India, collectively managing 
            thousands of rooms and bookings every month.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">Contact</h2>
          <p>
            Have questions? Reach out at{' '}
            <a href="mailto:hello@istaysin.com" className="text-primary-600 hover:underline">hello@istaysin.com</a>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
