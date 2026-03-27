import LegalLayout from '../../components/LegalLayout';
import { Mail, Phone, MapPin, MessageCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | istaysin',
  description: 'Get in touch with istaysin support, sales, or partnership teams.',
};

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us" description="We are here to help. Reach out for support, sales inquiries, or partnerships.">

      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {[
          {
            icon: Mail,
            title: 'General Inquiries',
            detail: 'hello@istaysin.com',
            href: 'mailto:hello@istaysin.com',
            desc: 'For general questions and information',
          },
          {
            icon: MessageCircle,
            title: 'Support',
            detail: 'support@istaysin.com',
            href: 'mailto:support@istaysin.com',
            desc: 'Technical help and platform issues',
          },
          {
            icon: Phone,
            title: 'Sales',
            detail: '+91 98765 43210',
            href: 'tel:+919876543210',
            desc: 'Enterprise plans and bulk onboarding',
          },
          {
            icon: MapPin,
            title: 'Office',
            detail: 'Hyderabad, Telangana, India',
            href: '#',
            desc: 'Visits by appointment only',
          },
        ].map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="border border-surface-200 rounded-xl p-5 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
          >
            <item.icon className="w-5 h-5 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-surface-800 text-sm mb-0.5">{item.title}</h3>
            <p className="text-primary-600 font-medium text-sm mb-1">{item.detail}</p>
            <p className="text-xs text-surface-400">{item.desc}</p>
          </a>
        ))}
      </div>

      <div className="border border-surface-200 rounded-xl p-5 bg-surface-50/50">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-surface-500" />
          <h3 className="font-semibold text-surface-800 text-sm">Support Hours</h3>
        </div>
        <div className="text-sm text-surface-600 space-y-1">
          <p>Monday to Friday: 9:00 AM - 7:00 PM IST</p>
          <p>Saturday: 10:00 AM - 4:00 PM IST</p>
          <p>Sunday and national holidays: Email support only (response within 24 hours)</p>
        </div>
      </div>
    </LegalLayout>
  );
}
