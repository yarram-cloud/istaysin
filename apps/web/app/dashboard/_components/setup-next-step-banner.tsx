'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2, BedDouble, Palette, Receipt, FileText,
  Users, TrendingUp, ArrowRight, Sparkles, PartyPopper,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'istays_setup_dismissed';

const STEP_ROUTE_MAP: { id: string; matchPath: string; matchSection?: string }[] = [
  { id: 'property_info', matchPath: '/dashboard/settings', matchSection: 'property' },
  { id: 'room_inventory', matchPath: '/dashboard/settings/inventory' },
  { id: 'branding', matchPath: '/dashboard/website' },
  { id: 'billing', matchPath: '/dashboard/settings', matchSection: 'billing' },
  { id: 'compliance', matchPath: '/dashboard/settings', matchSection: 'compliance' },
  { id: 'staff', matchPath: '/dashboard/settings', matchSection: 'staff' },
  { id: 'pricing', matchPath: '/dashboard/pricing' },
];

const STEP_META: Record<string, {
  title: string; subtitle: string; icon: React.ElementType; href: string;
}> = {
  property_info: { title: 'Property Details', subtitle: 'Address, contact & check-in times', icon: Building2, href: '/dashboard/settings?section=property' },
  room_inventory: { title: 'Room Inventory', subtitle: 'Floors, room types & rooms', icon: BedDouble, href: '/dashboard/settings/inventory' },
  branding: { title: 'Set Appearance', subtitle: 'Logo, tagline & website theme', icon: Palette, href: '/dashboard/website' },
  billing: { title: 'Billing & GST', subtitle: 'GST number & legal entity', icon: Receipt, href: '/dashboard/settings?section=billing' },
  compliance: { title: 'Police Compliance', subtitle: 'Sarai Act & FRRO settings', icon: FileText, href: '/dashboard/settings?section=compliance' },
  staff: { title: 'Invite Staff', subtitle: 'Front desk & housekeeping', icon: Users, href: '/dashboard/settings?section=staff' },
  pricing: { title: 'Pricing Rules', subtitle: 'Season & event rates', icon: TrendingUp, href: '/dashboard/pricing' },
};

const STEP_ORDER = ['property_info', 'room_inventory', 'branding', 'billing', 'compliance', 'staff', 'pricing'];

export default function SetupNextStepBanner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [setupDone, setSetupDone] = useState(true); // default hidden

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSetupDone(localStorage.getItem(DISMISSED_KEY) === 'true');
    }
  }, []);

  if (setupDone) return null;

  const fromSetup = searchParams.get('from_setup') === '1';
  if (!fromSetup) return null;

  const section = searchParams.get('section');

  const currentRoute = STEP_ROUTE_MAP.find(r => {
    if (r.matchSection) return pathname === r.matchPath && section === r.matchSection;
    return pathname === r.matchPath && !section;
  });
  if (!currentRoute) return null;

  const currentIdx = STEP_ORDER.indexOf(currentRoute.id);
  const isLastStep = currentIdx === STEP_ORDER.length - 1;
  const nextStepId = !isLastStep && currentIdx >= 0 ? STEP_ORDER[currentIdx + 1] : null;
  const nextMeta = nextStepId ? STEP_META[nextStepId] : null;
  const NextIcon = nextMeta?.icon;
  const stepNumber = currentIdx + 2;

  // Last step — show a "final step" banner
  if (isLastStep) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mb-5 rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-lg shadow-emerald-200/40 relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.10),transparent_60%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Final Step · {STEP_ORDER.length} of {STEP_ORDER.length}
            </p>
            <p className="text-sm font-bold text-white leading-tight">You&apos;re almost there! 🎉</p>
            <p className="text-xs text-emerald-200 mt-0.5">Complete this step and your property will be fully set up.</p>
          </div>
          <Link href="/dashboard"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all active:scale-[0.97] backdrop-blur-sm"
          >
            Back to Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // Not the last step — show "next step" preview
  if (!nextMeta || !NextIcon) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="mb-5 rounded-2xl overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 shadow-lg shadow-violet-200/40 relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.10),transparent_60%)] pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 py-3.5">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <NextIcon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">
            After this · Step {stepNumber} of {STEP_ORDER.length}
          </p>
          <p className="text-sm font-bold text-white leading-tight">{nextMeta.title}</p>
          <p className="text-xs text-violet-200 mt-0.5">{nextMeta.subtitle}</p>
        </div>
        <Link
          href={nextMeta.href.includes('?') ? `${nextMeta.href}&from_setup=1` : `${nextMeta.href}?from_setup=1`}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all active:scale-[0.97] backdrop-blur-sm"
        >
          Skip to this
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
