import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function LegalLayout({ children, title, description }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav - blends into banner */}
      <nav className="relative z-50 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-display font-bold text-white">istaysin</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-indigo-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-cyan-500/10 rounded-full blur-[80px]" />

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-20">
          {title && (
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-3 text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Bottom edge curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full h-8 md:h-10">
            <path d="M0 40V20C240 0 480 0 720 10C960 20 1200 30 1440 20V40H0Z" fill="rgb(248 250 252)" />
          </svg>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 md:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">&copy; 2026 istaysin. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-blue-600 transition-colors">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
