'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AGENTS } from '@/lib/agents/config';
import { Rocket, Clipboard, CheckCircle2, XCircle, Briefcase } from 'lucide-react';

interface AgentResult {
  agent: string;
  success: boolean;
  preview: string;
}

interface OrchestrationResult {
  success: boolean;
  strategy: string;
  results: AgentResult[];
  synthesis: string;
  tokensUsed: number;
  error?: string;
}

export default function OrchestratePage() {
  const [objective, setObjective] = useState('');
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function runOrchestration() {
    if (!objective.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }

  const EXAMPLE_OBJECTIVES = [
    'Lance une campagne de contenu sur l\'adoption de chats en Belgique : article, posts sociaux et stratégie SEO.',
    'Analyse les performances du mois et génère un rapport complet avec recommandations.',
    'Crée un contenu complet sur les vaccins obligatoires pour chiens en Belgique.',
  ];

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
            <Briefcase size={20} strokeWidth={1.5} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orchestration Thomas</h1>
            <p className="text-gray-500 text-xs">Coordination multi-agents par le CEO</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mt-3">
          Thomas analyse ton objectif, crée un plan stratégique, délègue les tâches aux agents concernés,
          puis synthétise les résultats.
        </p>
        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Rocket size={16} strokeWidth={1.5} className="text-emerald-600" />
          <p className="text-emerald-700 text-xs">
            Pipeline réel — les articles sont publiés sur le blog, les posts envoyés sur Facebook.
          </p>
        </div>
      </div>

      {/* Input objectif */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Objectif à orchestrer</h2>
        <textarea
          className="input-dark resize-none h-28"
          placeholder="Ex: Lance une campagne complète sur les chiots en Belgique..."
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={runOrchestration}
            disabled={isLoading || !objective.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Orchestration en cours…
              </>
            ) : (
              <>
                <Rocket size={16} strokeWidth={1.5} />
                Lancer l'orchestration
              </>
            )}
          </button>
          {isLoading && (
            <span className="text-xs text-gray-500">Peut prendre 30-60 secondes…</span>
          )}
        </div>

        {/* Exemples */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Exemples :</p>
          <div className="space-y-1.5">
            {EXAMPLE_OBJECTIVES.map((obj, i) => (
              <button
                key={i}
                onClick={() => setObjective(obj)}
                className="w-full text-left text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2 transition-all duration-150"
              >
                {obj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Résultats */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          {/* Stratégie */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clipboard size={16} strokeWidth={1.5} className="text-orange-600" />
              <h2 className="text-sm font-semibold text-orange-600">Stratégie de Thomas</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.strategy}</p>
          </div>

          {/* Résultats par agent */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Résultats des agents ({result.results.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.results.map((r) => {
                const agent = AGENTS[r.agent as keyof typeof AGENTS];
                return (
                  <div
                    key={r.agent}
                    className={clsx(
                      'card p-4 border',
                      r.success ? (agent?.borderColor ?? 'border-gray-200') : 'border-red-200'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{agent?.icon ?? '🤖'}</span>
                      <span className={clsx('text-sm font-medium', agent?.color ?? 'text-gray-700')}>
                        {agent?.name ?? r.agent}
                      </span>
                      <div
                        className={clsx(
                          'ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full',
                          r.success
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        {r.success ? (
                          <>
                            <CheckCircle2 size={12} strokeWidth={1.5} />
                            OK
                          </>
                        ) : (
                          <>
                            <XCircle size={12} strokeWidth={1.5} />
                            Erreur
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{r.preview}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Synthèse Thomas */}
          <div className="card p-5 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} strokeWidth={1.5} className="text-orange-600" />
              <h2 className="text-sm font-semibold text-orange-600">Synthèse de Thomas</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.synthesis}
            </p>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{result.tokensUsed?.toLocaleString()} tokens utilisés</span>
            <span>{result.results.filter((r) => r.success).length}/{result.results.length} agents réussis</span>
          </div>
        </div>
      )}
    </div>
  );
}
