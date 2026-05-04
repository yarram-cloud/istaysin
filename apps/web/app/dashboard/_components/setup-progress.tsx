'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, BedDouble, Palette, Receipt, FileText,
  Users, CheckCircle2, ChevronDown, ArrowRight,
  X, Sparkles, Rocket, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { tenantsApi } from '@/lib/api';

interface StepProgress { id: string; completed: boolean; detail: string | null; skippable?: boolean; skipped?: boolean; }
interface ProgressData { percent: number; completedCount: number; totalCount: number; steps: StepProgress[]; }

const STEP_META: Record<string, {
  title: string; subtitle: string; icon: React.ElementType;
  href: string; guideToast: string; actionLabel: string;
  gradient: string; iconBg: string; iconColor: string;
}> = {
  property_info: {
    title: 'Property Details', subtitle: 'Address, contact & check-in times',
    icon: Building2, href: '/dashboard/settings?section=property',
    guideToast: '✏️  Fill in your address, phone and check-in times.',
    actionLabel: 'Edit Details',
    gradient: 'from-violet-500 to-indigo-600', iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
  },
  room_inventory: {
    title: 'Room Inventory', subtitle: 'Floors, room types & rooms',
    icon: BedDouble, href: '/dashboard/settings/inventory',
    guideToast: '🏗️  Add Floors → Room Types → Individual Rooms.',
    actionLabel: 'Add Rooms',
    gradient: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
  },
  branding: {
    title: 'Set Appearance', subtitle: 'Logo, tagline & website theme',
    icon: Palette, href: '/dashboard/website',
    guideToast: '🎨  Customise your property website — logo, colours & layout.',
    actionLabel: 'Open Builder',
    gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-100', iconColor: 'text-pink-600',
  },
  billing: {
    title: 'Billing & GST', subtitle: 'GST number & legal entity',
    icon: Receipt, href: '/dashboard/settings?section=billing',
    guideToast: '📋  Enter your GSTIN and legal business name.',
    actionLabel: 'Add GST',
    gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
  },
  compliance: {
    title: 'Police Compliance', subtitle: 'Sarai Act & FRRO settings',
    icon: FileText, href: '/dashboard/settings?section=compliance',
    guideToast: '🚔  Add police station email for Sarai Act compliance.',
    actionLabel: 'Configure',
    gradient: 'from-rose-500 to-red-500', iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
  },
  staff: {
    title: 'Invite Staff', subtitle: 'Front desk & housekeeping',
    icon: Users, href: '/dashboard/settings?section=staff',
    guideToast: '👥  Invite your first staff member.',
    actionLabel: 'Invite Staff',
    gradient: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
  },
};

const STEP_ORDER = ['property_info', 'room_inventory', 'branding', 'billing', 'compliance', 'staff'];
const CONFETTI_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#f43f5e'];
const DISMISSED_KEY = 'istays_setup_dismissed';

function ConfettiBurst() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`, delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1, rotate: Math.random() * 720 - 360,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute rounded-sm"
          style={{ left: p.left, top: '-20px', width: p.w, height: p.h, backgroundColor: p.color }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0, 1, 0.8] }}
        />
      ))}
    </div>
  );
}

/* ── Desktop Horizontal Stepper ──────────────────────────────────────────── */

function DesktopStepper({ steps, currentId, onSelect }: {
  steps: { id: string; progress: StepProgress }[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="hidden md:flex items-start justify-between relative px-2 py-3">
      {steps.map(({ id, progress }, idx) => {
        const meta = STEP_META[id];
        if (!meta) return null;
        const Icon = meta.icon;
        const isActive = id === currentId;
        const isDone = progress.completed;
        const isLast = idx === steps.length - 1;

        return (
          <div key={id} className="flex items-start flex-1 min-w-0" style={{ maxWidth: isLast ? 'fit-content' : undefined }}>
            <button onClick={() => onSelect(id)}
              className="flex flex-col items-center gap-2.5 group cursor-pointer relative z-10"
              style={{ width: '96px' }}>
              {/* Circle */}
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                  : isActive
                  ? `bg-gradient-to-br ${meta.gradient} shadow-[0_0_0_4px_rgba(99,102,241,0.12)] shadow-lg`
                  : 'bg-white border-2 border-surface-200 group-hover:border-violet-300 group-hover:shadow-md'
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                ) : (
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : `${meta.iconColor} group-hover:scale-110 transition-transform`
                  }`} />
                )}
                {isActive && !isDone && (
                  <motion.div className="absolute inset-0 rounded-full border-2 border-violet-400/50"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                )}
              </div>
              {/* Label */}
              <span className={`text-[11px] font-semibold text-center leading-tight line-clamp-2 transition-colors ${
                isDone ? 'text-emerald-600' : isActive ? 'text-surface-900' : 'text-surface-400 group-hover:text-surface-600'
              }`}>{meta.title}</span>
            </button>

            {/* Connector */}
            {!isLast && (
              <div className="flex-1 h-[3px] mt-[22px] mx-[-4px] relative min-w-[24px]">
                <div className="absolute inset-0 bg-surface-100 rounded-full" />
                <motion.div className="absolute inset-y-0 left-0 bg-emerald-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: isDone ? '100%' : '0%' }}
                  transition={{ duration: 0.8, delay: idx * 0.08, ease: 'easeOut' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile Stepper (compact scroll) ──────────────────────────────────────── */

function MobileStepper({ steps, currentId, onSelect }: {
  steps: { id: string; progress: StepProgress }[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIdx = steps.findIndex(s => s.id === currentId);

  useEffect(() => {
    if (scrollRef.current && currentIdx >= 0) {
      const child = scrollRef.current.children[currentIdx] as HTMLElement;
      if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentIdx]);

  return (
    <div className="md:hidden">
      {/* Mini progress dots */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {steps.map(({ id, progress }) => (
          <button key={id} onClick={() => onSelect(id)}
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.completed ? 'w-2 bg-emerald-400'
              : id === currentId ? 'w-6 bg-violet-500'
              : 'w-2 bg-surface-200'
            }`} />
        ))}
      </div>

      {/* Scrollable cards */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {steps.map(({ id, progress }, idx) => {
          const meta = STEP_META[id];
          if (!meta) return null;
          const Icon = meta.icon;
          const isActive = id === currentId;
          const isDone = progress.completed;

          return (
            <button key={id} onClick={() => onSelect(id)}
              className={`snap-center shrink-0 flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-200 ${
                isDone
                  ? 'bg-emerald-50/80 border-emerald-200 min-w-[180px]'
                  : isActive
                  ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 shadow-sm min-w-[200px]'
                  : 'bg-white border-surface-150 min-w-[160px] opacity-60'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDone ? 'bg-emerald-100' : isActive ? meta.iconBg : 'bg-surface-100'
              }`}>
                {isDone ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                  : <Icon className={`w-4 h-4 ${isActive ? meta.iconColor : 'text-surface-400'}`} />}
              </div>
              <div className="text-left min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isDone ? 'text-emerald-700' : isActive ? 'text-surface-900' : 'text-surface-400'
                }`}>{meta.title}</p>
                <p className={`text-[10px] truncate ${
                  isDone ? 'text-emerald-500' : 'text-surface-400'
                }`}>{isDone ? 'Complete ✓' : `Step ${idx + 1}`}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Detail Card (current step CTA) ───────────────────────────────────────── */

function DetailCard({ stepId, nextStepId, onNavigate, onSkip, skippable }: {
  stepId: string;
  nextStepId: string | null;
  onNavigate: (href: string, t: string) => void;
  onSkip?: (stepId: string) => void;
  skippable?: boolean;
}) {
  const meta = STEP_META[stepId];
  if (!meta) return null;
  const Icon = meta.icon;
  const nextMeta = nextStepId ? STEP_META[nextStepId] : null;
  const NextIcon = nextMeta?.icon;

  return (
    <motion.div key={stepId}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-4 rounded-2xl border border-surface-150 overflow-hidden"
    >
      {/* Current step */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-surface-50 to-surface-100/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
          <Icon className={`w-5 h-5 ${meta.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-500 mb-0.5">Up Next</p>
          <p className="text-base font-bold text-surface-900 leading-tight">{meta.title}</p>
          <p className="text-sm text-surface-500 mt-0.5">{meta.subtitle}</p>
        </div>
        <div className="shrink-0 w-full sm:w-auto flex flex-col gap-2">
          <button onClick={() => onNavigate(meta.href, meta.guideToast)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${meta.gradient} text-white text-sm font-bold hover:shadow-lg transition-all active:scale-[0.97] shadow-md`}>
            {meta.actionLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
          {skippable && onSkip && (
            <button onClick={() => onSkip(stepId)}
              className="text-xs text-surface-400 hover:text-surface-600 transition-colors font-medium">
              Skip this step →
            </button>
          )}
        </div>
      </div>

      {/* Next step preview */}
      {nextMeta && NextIcon && (
        <div className="px-4 sm:px-5 py-2.5 bg-surface-50/80 border-t border-surface-100 flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
            <NextIcon className={`w-3.5 h-3.5 text-surface-400`} />
          </div>
          <p className="text-xs text-surface-400 flex-1 min-w-0">
            <span className="font-semibold text-surface-500">Then:</span>{' '}
            {nextMeta.title} — {nextMeta.subtitle}
          </p>
          <ChevronRight className="w-3.5 h-3.5 text-surface-300 shrink-0" />
        </div>
      )}
    </motion.div>
  );
}

function DoneCard({ stepId, detail, skipped }: { stepId: string; detail: string | null; skipped?: boolean }) {
  const meta = STEP_META[stepId];
  if (!meta) return null;
  return (
    <motion.div key={`done-${stepId}`}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
      className={`mt-4 p-4 sm:p-5 rounded-2xl border flex items-center gap-4 ${
        skipped ? 'bg-surface-50/60 border-surface-200' : 'bg-emerald-50/60 border-emerald-100'
      }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        skipped ? 'bg-surface-100' : 'bg-emerald-100'
      }`}>
        <CheckCircle2 className={`w-5 h-5 ${skipped ? 'text-surface-400' : 'text-emerald-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${skipped ? 'text-surface-500' : 'text-emerald-700'}`}>{meta.title}</p>
        <p className={`text-xs mt-0.5 ${skipped ? 'text-surface-400' : 'text-emerald-500'}`}>{detail || 'Completed successfully'}</p>
      </div>
      <span className={`hidden sm:inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${
        skipped ? 'bg-surface-100 text-surface-400 border-surface-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
      }`}>{skipped ? 'Skipped' : 'Done ✓'}</span>
    </motion.div>
  );
}

/* ── Main Widget ──────────────────────────────────────────────────────────── */

export default function SetupProgressWidget() {
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const prevPercentRef = useRef<number | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await tenantsApi.getSetupProgress();
      if (res.success && res.data) {
        const incoming = res.data as ProgressData;
        if (prevPercentRef.current !== null && prevPercentRef.current < 100 && incoming.percent === 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          setTimeout(() => setDone(true), 4000);
          localStorage.setItem(DISMISSED_KEY, 'true');
        }
        prevPercentRef.current = incoming.percent;
        if (incoming.percent === 100) setDone(true);
        setData(incoming);
      } else {
        setData({ percent: 0, completedCount: 0, totalCount: STEP_ORDER.length,
          steps: STEP_ORDER.map(id => ({ id, completed: false, detail: null })) });
      }
    } catch {
      setData({ percent: 0, completedCount: 0, totalCount: STEP_ORDER.length,
        steps: STEP_ORDER.map(id => ({ id, completed: false, detail: null })) });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === 'true') {
      setDone(true); return;
    }
    fetchProgress();
  }, [fetchProgress]);

  function handleNavigate(href: string, guideToast: string) {
    const url = href.includes('?') ? `${href}&from_setup=1` : `${href}?from_setup=1`;
    router.push(url);
  }

  async function handleSkip(stepId: string) {
    try {
      await tenantsApi.skipSetupStep(stepId);
      toast.success(`${STEP_META[stepId]?.title || stepId} skipped — you can set it up anytime.`);
      fetchProgress();
    } catch (err: any) {
      toast.error(err.message || 'Failed to skip step');
    }
  }

  if (done || !data) return null;

  const orderedSteps = STEP_ORDER.map(id => ({
    id, progress: data.steps.find(s => s.id === id) ?? { id, completed: false, detail: null },
  }));
  const firstIncompleteIdx = orderedSteps.findIndex(s => !s.progress.completed);
  const currentStepId = selectedStep ?? (firstIncompleteIdx >= 0 ? orderedSteps[firstIncompleteIdx].id : null);
  const currentStepData = currentStepId ? orderedSteps.find(s => s.id === currentStepId) : null;

  const motivationText = data.percent === 0
    ? "Follow the roadmap below to launch your property."
    : data.percent < 40 ? 'Great start — keep going, you\'re building something great.'
    : data.percent < 70 ? 'More than halfway there — your guests are waiting!'
    : 'Almost done — just a few more steps! 🚀';

  return (
    <>
      {showConfetti && <ConfettiBurst />}
      <motion.div layout initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-surface-200 shadow-lg shadow-surface-200/20 bg-white">

        {/* ── Header ── */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-surface-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-display font-bold text-surface-900 leading-tight">
              Property Activation Tracker
            </h2>
            <p className="text-xs sm:text-sm text-surface-400 mt-0.5 line-clamp-1">{motivationText}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full whitespace-nowrap ${
              data.percent >= 100
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-violet-50 text-violet-600 border border-violet-200'
            }`}>{data.percent}% COMPLETE</span>
            <button onClick={() => setCollapsed(v => !v)}
              className="w-8 h-8 rounded-lg bg-surface-50 hover:bg-surface-100 flex items-center justify-center transition-colors">
              <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-surface-400" />
              </motion.div>
            </button>
            <button onClick={() => { localStorage.setItem(DISMISSED_KEY, 'true'); setDone(true); }}
              className="w-8 h-8 rounded-lg bg-surface-50 hover:bg-surface-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-surface-400" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div key="body" initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                {/* Desktop stepper */}
                <DesktopStepper steps={orderedSteps} currentId={currentStepId} onSelect={setSelectedStep} />
                {/* Mobile stepper */}
                <MobileStepper steps={orderedSteps} currentId={currentStepId} onSelect={setSelectedStep} />

                {/* Detail card */}
                <AnimatePresence mode="wait">
                  {currentStepData && !currentStepData.progress.completed && (() => {
                    const curIdx = STEP_ORDER.indexOf(currentStepData.id);
                    const nextIncomplete = STEP_ORDER.slice(curIdx + 1).find(
                      sid => !orderedSteps.find(s => s.id === sid)?.progress.completed
                    ) ?? null;
                    return <DetailCard stepId={currentStepData.id} nextStepId={nextIncomplete} onNavigate={handleNavigate} onSkip={handleSkip} skippable={!!currentStepData.progress.skippable} />;
                  })()}
                  {currentStepData && currentStepData.progress.completed && (
                    <DoneCard stepId={currentStepData.id} detail={currentStepData.progress.detail} skipped={currentStepData.progress.skipped} />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
