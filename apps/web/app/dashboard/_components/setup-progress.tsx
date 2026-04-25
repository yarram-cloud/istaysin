'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, BedDouble, Palette, Receipt, FileText,
  Users, TrendingUp, CheckCircle2, ChevronDown, ArrowRight,
  X, Sparkles, Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import { tenantsApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StepProgress {
  id: string;
  completed: boolean;
  detail: string | null;
}

interface ProgressData {
  percent: number;
  completedCount: number;
  totalCount: number;
  steps: StepProgress[];
}

// ── Step definitions (UI metadata only — completion state comes from API) ─────

const STEP_META: Record<string, {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  href: string;
  guideToast: string;
  color: string;
  bgColor: string;
}> = {
  property_info: {
    title: 'Property Details',
    subtitle: 'Address, contact number & check-in times',
    icon: Building2,
    href: '/dashboard/settings?section=property',
    guideToast: '✏️  Click Edit on the Property Details card to fill in your address, phone and check-in times.',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  room_inventory: {
    title: 'Room Inventory',
    subtitle: 'Floors, room types & individual rooms',
    icon: BedDouble,
    href: '/dashboard/settings/inventory',
    guideToast: '🏗️  Start with a Floor, then add Room Types with rates, then create individual Rooms.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  branding: {
    title: 'Branding & Identity',
    subtitle: 'Logo, tagline & property description',
    icon: Palette,
    href: '/dashboard/settings?section=property',
    guideToast: '🎨  Scroll to the Branding section — upload your logo and add a tagline.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  billing: {
    title: 'Billing & GST',
    subtitle: 'GST number & legal entity name',
    icon: Receipt,
    href: '/dashboard/settings?section=billing',
    guideToast: '📋  Enter your GSTIN and legal business name for GST-compliant invoices.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  compliance: {
    title: 'Police Compliance',
    subtitle: 'Sarai Act register & FRRO settings',
    icon: FileText,
    href: '/dashboard/settings?section=compliance',
    guideToast: '🚔  Add your police station email to enable the Sarai Act guest register submission.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  staff: {
    title: 'Staff Members',
    subtitle: 'Invite your front desk & housekeeping team',
    icon: Users,
    href: '/dashboard/settings?section=staff',
    guideToast: '👥  Enter a phone number, choose a role and hit Invite to add your first staff member.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  pricing: {
    title: 'Pricing Rules',
    subtitle: 'Season, weekend & event-based rates',
    icon: TrendingUp,
    href: '/dashboard/pricing',
    guideToast: '💰  Create a pricing rule to auto-adjust rates for weekends, seasons or special events.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
};

const STEP_ORDER = ['property_info', 'room_inventory', 'branding', 'billing', 'compliance', 'staff', 'pricing'];

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#f43f5e','#facc15','#a78bfa','#34d399'];

function ConfettiBurst() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.6,
    duration: 1.8 + Math.random() * 1,
    rotate: Math.random() * 720 - 360,
    width: 6 + Math.random() * 8,
    height: 4 + Math.random() * 6,
    shape: i % 3 === 0 ? 'circle' : 'rect',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className={p.shape === 'circle' ? 'absolute rounded-full' : 'absolute rounded-sm'}
          style={{ left: p.left, top: '-20px', width: p.width, height: p.height, backgroundColor: p.color }}
          initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '110vh', opacity: [1, 1, 0.8, 0], rotate: p.rotate, scale: [1, 1.2, 0.8, 1] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0, 1, 0.8] }}
        />
      ))}
    </div>
  );
}

// ── Progress Ring ──────────────────────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  // Unique gradient ID per instance to avoid SVG global ID collisions
  const gradId = 'setupRingGrad';

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e8e4f5" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black text-violet-700 leading-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', bounce: 0.4 }}
        >
          {percent}%
        </motion.span>
        <span className="text-[10px] font-semibold text-violet-400 mt-0.5 uppercase tracking-wide">done</span>
      </div>
    </div>
  );
}

// ── Step Row ──────────────────────────────────────────────────────────────────

function StepRow({
  stepId, progress, isCurrent, index, onNavigate,
}: {
  stepId: string;
  progress: StepProgress;
  isCurrent: boolean;
  index: number;
  onNavigate: (href: string, toast: string) => void;
}) {
  const meta = STEP_META[stepId];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
        progress.completed
          ? 'bg-emerald-50/60 border border-emerald-100'
          : isCurrent
          ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 shadow-sm shadow-violet-100'
          : 'bg-surface-50 border border-surface-100 opacity-70'
      }`}
    >
      {/* Step icon / checkmark */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        progress.completed
          ? 'bg-emerald-100'
          : isCurrent
          ? meta.bgColor
          : 'bg-surface-100'
      }`}>
        {progress.completed
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          : <Icon className={`w-4.5 h-4.5 ${progress.completed ? 'text-emerald-500' : isCurrent ? meta.color : 'text-surface-400'}`} />
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${
          progress.completed ? 'text-emerald-700' : isCurrent ? 'text-surface-900' : 'text-surface-500'
        }`}>
          {meta.title}
        </p>
        <p className={`text-xs mt-0.5 truncate ${
          progress.completed
            ? 'text-emerald-500'
            : isCurrent
            ? 'text-surface-500'
            : 'text-surface-400'
        }`}>
          {progress.completed && progress.detail ? progress.detail : meta.subtitle}
        </p>
      </div>

      {/* Action */}
      {progress.completed ? (
        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
          Done ✓
        </span>
      ) : (
        <button
          onClick={() => onNavigate(meta.href, meta.guideToast)}
          className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
            isCurrent
              ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200'
              : 'bg-surface-200 text-surface-500 hover:bg-surface-300'
          }`}
        >
          {isCurrent ? 'Set up' : 'Later'}
          {isCurrent && <ArrowRight className="w-3 h-3" />}
        </button>
      )}
    </motion.div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'istays_setup_dismissed';

export default function SetupProgressWidget() {
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [done, setDone] = useState(false);
  const prevPercentRef = useRef<number | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await tenantsApi.getSetupProgress();
      if (res.success && res.data) {
        const incoming = res.data as ProgressData;

        // Trigger confetti on transition to 100%
        if (prevPercentRef.current !== null && prevPercentRef.current < 100 && incoming.percent === 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          setTimeout(() => setDone(true), 4000);
          localStorage.setItem(DISMISSED_KEY, 'true');
        }
        prevPercentRef.current = incoming.percent;

        // Mark done immediately if already 100% on first load
        if (incoming.percent === 100) {
          setDone(true);
        }

        setData(incoming);
      } else {
        // API returned error (e.g. no property/tenant yet) — show 0% with all steps incomplete
        setData({
          percent: 0,
          completedCount: 0,
          totalCount: STEP_ORDER.length,
          steps: STEP_ORDER.map(id => ({ id, completed: false, detail: null })),
        });
      }
    } catch {
      // Network/auth error — still show widget at 0% so user sees what's needed
      setData({
        percent: 0,
        completedCount: 0,
        totalCount: STEP_ORDER.length,
        steps: STEP_ORDER.map(id => ({ id, completed: false, detail: null })),
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === 'true') {
      setDone(true);
      return;
    }
    fetchProgress();
  }, [fetchProgress]);

  function handleNavigate(href: string, guideToast: string) {
    toast.info(guideToast, {
      duration: 6000,
      style: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontWeight: '500',
        fontSize: '13px',
        padding: '14px 18px',
        boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
      },
    });

    // For settings sections, pass the section param
    const url = href.includes('?section=')
      ? `${href}&from_setup=1`
      : href;
    router.push(url);
  }

  // Don't render if setup is complete or dismissed
  if (done || !data) return null;

  const orderedSteps = STEP_ORDER.map(id => ({
    id,
    progress: data.steps.find(s => s.id === id) ?? { id, completed: false, detail: null },
  }));

  const firstIncompleteIdx = orderedSteps.findIndex(s => !s.progress.completed);

  const motivationText = data.percent === 0
    ? "Let's get your property ready to take bookings!"
    : data.percent < 40
    ? 'Great start — keep going, you\'re building something great.'
    : data.percent < 70
    ? 'More than halfway there — your guests are waiting!'
    : data.percent < 100
    ? 'Almost done — just a few more steps to go! 🚀'
    : '🎉 Everything is set up — you\'re ready to go!';

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      <motion.div
        layout
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="w-full rounded-3xl overflow-hidden border border-violet-200/60 shadow-lg shadow-violet-100/40 bg-white"
      >
        {/* Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 flex items-center gap-4">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Property Setup Guide</p>
            <p className="text-violet-200 text-xs mt-0.5">{motivationText}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-white/90 bg-white/20 px-2.5 py-1 rounded-full">
              {data.completedCount}/{data.totalCount} steps
            </span>
            <button
              onClick={() => setCollapsed(v => !v)}
              className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label={collapsed ? 'Expand setup guide' : 'Collapse setup guide'}
            >
              <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-white" />
              </motion.div>
            </button>
            <button
              onClick={() => { localStorage.setItem(DISMISSED_KEY, 'true'); setDone(true); }}
              className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Dismiss setup guide"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Progress bar under header */}
        <div className="h-1.5 bg-violet-100">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.percent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 flex flex-col sm:flex-row gap-5">
                {/* Left: ring + summary */}
                <div className="flex flex-col items-center justify-center gap-2 sm:w-44 shrink-0">
                  <ProgressRing percent={data.percent} />
                  <p className="text-xs text-surface-500 text-center">
                    {data.completedCount} of {data.totalCount} steps complete
                  </p>
                  {data.percent === 100 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <Sparkles className="w-3 h-3" /> All done!
                    </div>
                  )}
                </div>

                {/* Right: step list */}
                <div className="flex-1 space-y-2">
                  {orderedSteps.map(({ id, progress }, idx) => (
                    <StepRow
                      key={id}
                      stepId={id}
                      progress={progress}
                      isCurrent={idx === firstIncompleteIdx}
                      index={idx}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
