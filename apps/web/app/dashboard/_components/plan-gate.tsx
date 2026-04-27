'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { type PlanCode, PLAN_LABELS, PLAN_HIGHLIGHTS, hasAccess, getCurrentPlan } from '@/lib/plan-gate';

interface PlanGateProps {
  requiredPlan: PlanCode;
  /** Optional title override for the upgrade wall */
  featureName?: string;
  children: React.ReactNode;
}

/**
 * Wraps content behind a plan gate.
 * - If the user's plan satisfies the requirement → renders children
 * - If not → renders a premium upgrade wall with plan highlights and CTA
 */
export default function PlanGate({ requiredPlan, featureName, children }: PlanGateProps) {
  const [plan, setPlan] = useState<string>('free');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPlan(getCurrentPlan());
    setMounted(true);
  }, []);

  // Avoid flash: wait for client mount before gating
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAccess(plan, requiredPlan)) {
    return <>{children}</>;
  }

  const planLabel = PLAN_LABELS[requiredPlan];
  const highlights = PLAN_HIGHLIGHTS[requiredPlan];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden">
          {/* Top gradient banner */}
          <div className="h-2 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600" />

          <div className="p-5 sm:p-8">
            {/* Lock icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary-500" />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-display font-bold text-surface-900 text-center mb-2">
              {featureName ? featureName : 'Upgrade Required'}
            </h2>
            <p className="text-surface-500 text-center text-sm mb-6">
              This feature is available on the{' '}
              <span className="font-semibold text-primary-600">{planLabel}</span> plan and above.
            </p>

            {/* Feature highlights */}
            {highlights.length > 0 && (
              <div className="bg-surface-50 rounded-2xl p-5 mb-6 border border-surface-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                    What you unlock with {planLabel}
                  </p>
                </div>
                <ul className="space-y-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-surface-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
            >
              Upgrade to {planLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-xs text-surface-400 mt-4">
              Your current plan:{' '}
              <span className="font-semibold capitalize">
                {PLAN_LABELS[plan as PlanCode] || plan}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
