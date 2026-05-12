'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Dog, Cat, Bird, Mouse, Zap, Flame, ShoppingBag, Clipboard, Rocket, CheckCircle2, XCircle, Clock, BookOpen, Mail, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const ANIMALS = [
  { value: 'auto-smart',  label: 'Auto (moins utilisée)', icon: Sparkles },
  { value: 'chiens',      label: 'Chiens', icon: Dog },
  { value: 'chats',       label: 'Chats', icon: Cat },
  { value: 'oiseaux',     label: 'Oiseaux', icon: Bird },
  { value: 'rongeurs',    label: 'Rongeurs', icon: Mouse },
  { value: 'reptiles',    label: 'Reptiles', icon: Zap },
];

const ARTICLE_TYPES = [
  { value: '',            label: 'Auto (rotation)', icon: RefreshCw },
  { value: 'trending',   label: 'Trending / Actualité', icon: Flame },
  { value: 'affiliation', label: 'Partenaire / Produit', icon: ShoppingBag },
  { value: 'pratique',   label: 'Conseil pratique', icon: Clipboard },
];

type StepStatus = 'idle' | 'running' | 'done' | 'error';

// ─── Catégories Awin ──────────────────────────────────────────────────────────

const AWIN_CATEGORIES = [
  { key: 'chiens',   label: 'Chiens',   icon: '🐶' },
  { key: 'chats',    label: 'Chats',    icon: '🐱' },
  { key: 'oiseaux',  label: 'Oiseaux',  icon: '🐦' },
  { key: 'rongeurs', label: 'Rongeurs', icon: '🐹' },
  { key: 'reptiles', label: 'Reptiles', icon: '🦎' },
  { key: 'livres',   label: 'Livres',   icon: '📚' },
  { key: 'general',  label: 'Général',  icon: '🐾' },
] as const;

type AwinCategory = typeof AWIN_CATEGORIES[number]['key'];

interface AwinCategoryProgress {
  status: 'idle' | 'running' | 'done' | 'error';
  synced: number;
  current_feed: string | null;
  error: string | null;
  started_at: string | null;
  updated_at: string | null;
}

// ─── Config crons génériques ──────────────────────────────────────────────────

interface CronConfig {
  id: string;
  label: string;
  description: string;
  icon: typeof Rocket;
  color: string;
  borderColor: string;
  steps: Array<{ key: string; label: string; waitAfterMs?: number; }>;
}

const CRONS: CronConfig[] = [
  {
    id: 'content',
    label: 'SEO + Blog + Réseaux',
    description: 'Lucas (mots-clés) → Marie (article) → Emma (post Facebook)',
    icon: BookOpen,
    color: 'text-purple-600',
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
    icon: Clipboard,
    color: 'text-teal-600',
    borderColor: 'border-teal-400/30',
    steps: [{ key: 'finance', label: 'Rapport financier (Antoine)' }],
  },
  {
    id: 'security',
    label: 'Sécurité & Maintenance',
    description: 'Nathalie (audit sécurité) + Maxime (audit technique)',
    icon: Zap,
    color: 'text-red-500',
    borderColor: 'border-red-400/30',
    steps: [{ key: 'security', label: 'Audit sécurité + technique (Nathalie + Maxime)' }],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Sofia crée la newsletter avec les derniers articles',
    icon: Mail,
    color: 'text-rose-600',
    borderColor: 'border-rose-400/30',
    steps: [{ key: 'newsletter', label: 'Newsletter (Sofia)' }],
  },
  {
    id: 'prenoms',
    label: 'Prénoms animaux',
    description: 'Thomas génère les 50 meilleurs prénoms par catégorie (Haiku)',
    icon: Sparkles,
    color: 'text-orange-500',
    borderColor: 'border-orange-400/30',
    steps: [{ key: 'prenoms', label: 'Génération prénoms (Thomas × 5 animaux)' }],
  },
];

// ─── Hook crons génériques ────────────────────────────────────────────────────

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
    setStates(prev => ({ ...prev, [id]: { ...(prev[id] ?? { status: 'idle', currentStep: 0, countdown: 0, error: '' }), ...patch } }));
  }

  async function run(cron: CronConfig, selectedAnimal: string, selectedType: string) {
    const id = cron.id;
    if (getState(id).status === 'running') return;
    setState(id, { status: 'running', currentStep: 0, error: '' });

    for (let i = 0; i < cron.steps.length; i++) {
      const step = cron.steps[i];
      setState(id, { currentStep: i });

      try {
        const body: Record<string, string> = { step: step.key };
        if (step.key === 'blog') {
          if (selectedAnimal === 'auto-smart') body.auto = 'true';
          else if (selectedAnimal) body.animal = selectedAnimal;
          if (selectedType) body.type = selectedType;
        }
        const r = await fetch('/api/admin/run-cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
        await new Promise<void>(resolve => {
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

  return { getState, run: (cron: CronConfig, animal: string, type: string) => run(cron, animal, type), reset };
}

// ─── Hook Awin multi-catégories ───────────────────────────────────────────────

function useAwinSync() {
  const [progress, setProgress] = useState<Record<AwinCategory, AwinCategoryProgress>>(
    () => Object.fromEntries(
      AWIN_CATEGORIES.map(c => [c.key, { status: 'idle', synced: 0, current_feed: null, error: null, started_at: null, updated_at: null }])
    ) as Record<AwinCategory, AwinCategoryProgress>
  );
  const [runningCats, setRunningCats] = useState<Set<AwinCategory>>(new Set());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Poll la progression depuis Supabase via l'API admin
  const pollProgress = async () => {
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'awin-progress' }),
      });
      if (!r.ok) return;
      const data = await r.json();
      if (data.progress && Object.keys(data.progress).length > 0) {
        setProgress(prev => ({ ...prev, ...data.progress }));
        // Arrêter le polling si plus aucune catégorie en cours
        const anyRunning = Object.values(data.progress as Record<string, AwinCategoryProgress>)
          .some(p => p.status === 'running');
        if (!anyRunning) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setRunningCats(new Set());
        }
      }
    } catch {}
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(pollProgress, 2000);
  };

  const launchCategory = async (category: AwinCategory) => {
    if (runningCats.has(category)) return;
    setRunningCats(prev => new Set([...prev, category]));
    setProgress(prev => ({
      ...prev,
      [category]: { ...prev[category], status: 'running', synced: 0, current_feed: null, error: null, started_at: new Date().toISOString() },
    }));
    startPolling();

    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: `awin-sync-${category}` }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erreur ${r.status}`);
    } catch (err) {
      setProgress(prev => ({
        ...prev,
        [category]: { ...prev[category], status: 'error', error: err instanceof Error ? err.message : 'Erreur' },
      }));
      setRunningCats(prev => { const s = new Set(prev); s.delete(category); return s; });
    }
  };

  const launchAll = async () => {
    for (const cat of AWIN_CATEGORIES) {
      await launchCategory(cat.key);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const resetCategory = (category: AwinCategory) => {
    setProgress(prev => ({
      ...prev,
      [category]: { status: 'idle', synced: 0, current_feed: null, error: null, started_at: null, updated_at: null },
    }));
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const totalSynced = Object.values(progress).reduce((s, p) => s + p.synced, 0);
  const anyRunning = Object.values(progress).some(p => p.status === 'running');
  const allDone = AWIN_CATEGORIES.every(c => progress[c.key].status === 'done');

  return { progress, launchCategory, launchAll, resetCategory, totalSynced, anyRunning, allDone };
}

// ─── Composant AwinPanel ──────────────────────────────────────────────────────

function AwinPanel() {
  const { progress, launchCategory, launchAll, resetCategory, totalSynced, anyRunning, allDone } = useAwinSync();
  const [expanded, setExpanded] = useState(true);

  const doneCount = AWIN_CATEGORIES.filter(c => progress[c.key].status === 'done').length;
  const errorCount = AWIN_CATEGORIES.filter(c => progress[c.key].status === 'error').length;

  return (
    <div className="px-4 py-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <ShoppingBag size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-600">Sync Boutique Awin</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
              {anyRunning
                ? `Synchronisation en cours… ${totalSynced} produits`
                : allDone
                ? `✓ ${totalSynced} produits synchronisés`
                : `7 catégories indépendantes (chiens, chats, oiseaux…)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Bouton tout lancer */}
          <button
            onClick={launchAll}
            disabled={anyRunning}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
              allDone
                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                : anyRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
            )}
          >
            {allDone ? (
              <><CheckCircle2 size={14} strokeWidth={1.5} />OK</>
            ) : anyRunning ? (
              <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>
            ) : (
              <>Tout lancer</>
            )}
          </button>

          {/* Toggle détails */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Barre de progression globale */}
      {(anyRunning || allDone || doneCount > 0) && (
        <div className="mt-2 ml-7">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / AWIN_CATEGORIES.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{doneCount}/{AWIN_CATEGORIES.length}</span>
          </div>
          {errorCount > 0 && (
            <p className="text-xs text-red-500">{errorCount} catégorie{errorCount > 1 ? 's' : ''} en erreur</p>
          )}
        </div>
      )}

      {/* Détails par catégorie */}
      {expanded && (
        <div className="mt-2 ml-7 space-y-1.5">
          {AWIN_CATEGORIES.map(cat => {
            const p = progress[cat.key];
            const isRunning = p.status === 'running';
            const isDone = p.status === 'done';
            const isError = p.status === 'error';

            return (
              <div key={cat.key} className="flex items-center gap-2">
                <span className="text-sm w-5">{cat.icon}</span>
                <span className="text-xs text-gray-600 w-16 flex-shrink-0">{cat.label}</span>

                {/* Barre de progression individuelle */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  {isRunning && (
                    <>
                      <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full animate-pulse w-1/2" />
                      </div>
                      <span className="text-xs text-amber-600 flex-shrink-0 min-w-0 truncate max-w-[90px]" title={p.current_feed ?? ''}>
                        {p.synced > 0 ? `${p.synced} produits` : p.current_feed ? `${p.current_feed.slice(0, 12)}…` : '…'}
                      </span>
                    </>
                  )}
                  {isDone && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} strokeWidth={1.5} />
                      {p.synced} produits
                    </span>
                  )}
                  {isError && (
                    <span className="text-xs text-red-500 flex items-center gap-1 truncate" title={p.error ?? ''}>
                      <XCircle size={12} strokeWidth={1.5} />
                      {p.error?.slice(0, 30) ?? 'Erreur'}
                    </span>
                  )}
                  {p.status === 'idle' && (
                    <span className="text-xs text-gray-300">En attente</span>
                  )}
                </div>

                {/* Bouton lancer individuel */}
                {(p.status === 'idle' || p.status === 'error') && (
                  <button
                    onClick={() => launchCategory(cat.key)}
                    className="text-xs text-gray-400 hover:text-amber-600 px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors flex-shrink-0"
                  >
                    {isError ? 'Retry' : 'Lancer'}
                  </button>
                )}
                {isDone && (
                  <button
                    onClick={() => resetCategory(cat.key)}
                    className="text-xs text-gray-300 hover:text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CronLauncher() {
  const [open, setOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState('auto-smart');
  const [selectedType, setSelectedType] = useState('');
  const { getState, run, reset } = useCronRunner();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors"
      >
        <Rocket size={16} strokeWidth={1.5} />
        Lancer un cron
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">Pipelines manuels</p>
            <p className="text-xs text-gray-500 mt-0.5">Déclenche un pipeline immédiatement</p>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Crons génériques */}
            {CRONS.map(cron => {
              const state = getState(cron.id);
              const isRunning = state.status === 'running';
              const step = cron.steps[state.currentStep];
              const isWaiting = isRunning && state.countdown > 0;

              return (
                <div key={cron.id} className="px-4 py-3.5">
                  {cron.id === 'content' && (
                    <div className="mb-2.5 flex flex-col gap-2">
                      <select
                        value={selectedAnimal}
                        onChange={e => setSelectedAnimal(e.target.value)}
                        disabled={isRunning}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-500 disabled:opacity-50"
                      >
                        {ANIMALS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                      <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        disabled={isRunning}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-orange-500 disabled:opacity-50"
                      >
                        {ARTICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <cron.icon size={18} strokeWidth={1.5} className={clsx('mt-0.5 flex-shrink-0', cron.color)} />
                      <div className="min-w-0">
                        <p className={clsx('text-sm font-semibold', cron.color)}>{cron.label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{cron.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => (state.status === 'idle' || state.status === 'error') ? run(cron, cron.id === 'content' ? selectedAnimal : '', cron.id === 'content' ? selectedType : '') : undefined}
                      disabled={isRunning}
                      className={clsx(
                        'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                        state.status === 'done' ? 'bg-emerald-100 text-emerald-600 cursor-default'
                          : state.status === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer'
                          : isRunning ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                      )}
                    >
                      {state.status === 'done' && <><CheckCircle2 size={14} strokeWidth={1.5} />OK</>}
                      {state.status === 'error' && <><XCircle size={14} strokeWidth={1.5} />Retry</>}
                      {isRunning && isWaiting && <><Clock size={14} strokeWidth={1.5} />{state.countdown}s</>}
                      {isRunning && !isWaiting && <><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />En cours</>}
                      {state.status === 'idle' && 'Lancer'}
                    </button>
                  </div>

                  {isRunning && (
                    <p className="text-xs text-amber-600 mt-1.5 ml-7">
                      {isWaiting ? `Pause ${state.countdown}s avant la prochaine étape…` : `${step?.label ?? '…'}`}
                    </p>
                  )}
                  {state.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1.5 ml-7 truncate" title={state.error}>{state.error}</p>
                  )}
                  {state.status === 'done' && (
                    <div className="flex items-center gap-3 mt-1 ml-7">
                      <button onClick={() => reset(cron.id)} className="text-xs text-gray-400 hover:text-gray-700">Réinitialiser</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Panel Awin avec avancement */}
            <AwinPanel />
          </div>

          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-start gap-2">
            <Rocket size={14} strokeWidth={1.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Support client : pas de cron — Léa répond à la demande depuis sa page agent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
