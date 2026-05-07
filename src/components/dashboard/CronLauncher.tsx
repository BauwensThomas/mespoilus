'use client';

import { useState } from 'react';
import clsx from 'clsx';

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface CronConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  steps: Array<{
    key: string;
    label: string;
    waitAfterMs?: number;
  }>;
}

const CRONS: CronConfig[] = [
  {
    id: 'content',
    label: 'SEO + Blog + Réseaux',
    description: 'Lucas (mots-clés) → Marie (article) → Emma (post Facebook)',
    icon: '📝',
    color: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    steps: [
      { key: 'blog',   label: 'Blog (Lucas + Marie)', waitAfterMs: 35000 },
      { key: 'social', label: 'Réseaux (Emma → Facebook)' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Antoine génère le rapport financier mensuel',
    icon: '📊',
    color: 'text-teal-400',
    borderColor: 'border-teal-400/30',
    steps: [
      { key: 'finance', label: 'Rapport financier (Antoine)' },
    ],
  },
  {
    id: 'security',
    label: 'Sécurité & Maintenance',
    description: 'Nathalie (audit sécurité) + Maxime (audit technique)',
    icon: '🛡️',
    color: 'text-red-400',
    borderColor: 'border-red-400/30',
    steps: [
      { key: 'security', label: 'Audit sécurité + technique (Nathalie + Maxime)' },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Sofia crée la newsletter avec les derniers articles',
    icon: '💌',
    color: 'text-rose-400',
    borderColor: 'border-rose-400/30',
    steps: [
      { key: 'newsletter', label: 'Newsletter (Sofia)' },
    ],
  },
];

interface CronState {
  status: StepStatus;
  currentStep: number;
  countdown: number;
  error: string;
}

function useCronRunner() {
  const [states, setStates] = useState<Record<string, CronState>>({});

  function getState(id: string): CronState {
    return states[id] ?? { status: 'idle', currentStep: 0, countdown: 0, error: '' };
  }

  function setState(id: string, patch: Partial<CronState>) {
    setStates((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { status: 'idle', currentStep: 0, countdown: 0, error: '' }), ...patch } }));
  }

  async function run(cron: CronConfig) {
    const id = cron.id;
    if (getState(id).status === 'running') return;

    setState(id, { status: 'running', currentStep: 0, error: '' });

    for (let i = 0; i < cron.steps.length; i++) {
      const step = cron.steps[i];
      setState(id, { currentStep: i });

      try {
        const r = await fetch('/api/admin/run-cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: step.key }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
      } catch (err) {
        setState(id, { status: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' });
        return;
      }

      if (step.waitAfterMs && i < cron.steps.length - 1) {
        let remaining = Math.ceil(step.waitAfterMs / 1000);
        setState(id, { countdown: remaining });
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            remaining--;
            setState(id, { countdown: remaining });
            if (remaining <= 0) { clearInterval(interval); resolve(); }
          }, 1000);
        });
      }
    }

    setState(id, { status: 'done' });
  }

  function reset(id: string) {
    setState(id, { status: 'idle', currentStep: 0, countdown: 0, error: '' });
  }

  return { getState, run, reset };
}

export default function CronLauncher() {
  const [open, setOpen] = useState(false);
  const { getState, run, reset } = useCronRunner();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black transition-colors"
      >
        🚀 Lancer un cron
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#262626] border border-[#484848] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#484848]">
            <p className="text-xs font-semibold text-white">Pipelines manuels</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Déclenche un pipeline immédiatement</p>
          </div>

          <div className="divide-y divide-[#3a3a3a]">
            {CRONS.map((cron) => {
              const state = getState(cron.id);
              const isRunning = state.status === 'running';
              const step = cron.steps[state.currentStep];
              const isWaiting = isRunning && state.countdown > 0;

              return (
                <div key={cron.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-base mt-0.5">{cron.icon}</span>
                      <div className="min-w-0">
                        <p className={clsx('text-xs font-semibold', cron.color)}>{cron.label}</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed mt-0.5">{cron.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => state.status === 'idle' || state.status === 'error' ? run(cron) : undefined}
                      disabled={isRunning}
                      className={clsx(
                        'flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                        state.status === 'done'
                          ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                          : state.status === 'error'
                          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 cursor-pointer'
                          : isRunning
                          ? 'bg-white/5 text-gray-400 cursor-not-allowed'
                          : 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                      )}
                    >
                      {state.status === 'done' && '✅ OK'}
                      {state.status === 'error' && '❌ Retry'}
                      {isRunning && isWaiting && `⏳ ${state.countdown}s`}
                      {isRunning && !isWaiting && (
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                          En cours
                        </span>
                      )}
                      {state.status === 'idle' && 'Lancer'}
                    </button>
                  </div>

                  {isRunning && (
                    <p className="text-[10px] text-amber-400 mt-1.5 ml-6">
                      {isWaiting ? `Pause ${state.countdown}s avant la prochaine étape…` : `${step?.label ?? '…'}`}
                    </p>
                  )}
                  {state.status === 'error' && (
                    <p className="text-[10px] text-red-400 mt-1.5 ml-6 truncate" title={state.error}>{state.error}</p>
                  )}
                  {state.status === 'done' && (
                    <button onClick={() => reset(cron.id)} className="text-[10px] text-gray-400 hover:text-gray-200 mt-1 ml-6">
                      Réinitialiser
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-[#484848] bg-[#1e1e1e]">
            <p className="text-[10px] text-gray-400">
              💡 Support client : pas de cron — Léa répond à la demande depuis sa page agent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
