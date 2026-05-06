'use client';

import { useState, useRef, useEffect } from 'react';
import { Agent, AgentStat, ActivityLog } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import type { UnsplashPhoto } from '@/lib/unsplash';

interface AgentPageProps {
  agent: Agent;
  stat?: AgentStat;
  recentLogs: ActivityLog[];
  photo?: UnsplashPhoto | null;
  placeholderSrc?: string;
}

const QUICK_TASKS: Record<string, string[]> = {
  thomas: [
    'Analyse la situation actuelle de l\'agence et priorise les 5 tâches les plus importantes cette semaine.',
    'Génère le rapport hebdomadaire de l\'équipe avec les KPIs principaux.',
    'Crée une stratégie de croissance pour doubler le trafic du blog en 3 mois.',
  ],
  marie: [
    'Écris un article complet sur les meilleurs vétérinaires d\'urgence à Bruxelles.',
    'Rédige un guide pour adopter un chien en Belgique : démarches légales et conseils pratiques.',
    'Crée une description de produit pour une croquette premium pour chat senior.',
  ],
  lucas: [
    'Recherche les 20 meilleurs mots-clés sur la niche "alimentation chien Belgique".',
    'Audite le SEO de notre dernier article et propose des optimisations.',
    'Analyse les tendances de recherche sur les animaux de compagnie en Belgique pour 2025.',
  ],
  emma: [
    'Crée 3 posts pour Instagram, Facebook et TikTok sur la santé des chats en été.',
    'Génère un calendrier de contenu pour le mois de juin centré sur les chiens.',
    'Rédige une campagne de storytelling autour de l\'adoption animale en Belgique.',
  ],
  maxime: [
    'Effectue un audit des performances du site et liste les problèmes Core Web Vitals.',
    'Vérifie les dépendances npm obsolètes et propose un plan de mise à jour.',
    'Optimise les requêtes Supabase pour améliorer les temps de réponse.',
  ],
  lea: [
    'Un client se plaint que son guide PDF commandé n\'est pas arrivé, réponds-lui.',
    'Rédige une réponse type pour les questions sur les délais de livraison.',
    'Un propriétaire demande des conseils pour son chien qui refuse de manger, aide-le.',
  ],
  antoine: [
    'Génère le rapport financier mensuel avec revenus, dépenses et marges.',
    'Analyse la rentabilité de chaque canal de revenus et recommande des optimisations.',
    'Crée des projections financières pour le prochain trimestre avec 3 scénarios.',
  ],
  nathalie: [
    'Effectue un audit de sécurité complet de l\'application Next.js.',
    'Analyse les 10 derniers logs de sécurité et identifie les menaces potentielles.',
    'Génère un rapport sur les bonnes pratiques de sécurité à implémenter en priorité.',
  ],
  sofia: [
    'Rédige la newsletter hebdomadaire en sélectionnant 3 articles sur les soins des animaux de compagnie.',
    'Crée une newsletter spéciale "rentrée" avec des conseils pour les propriétaires d\'animaux.',
    'Rédige une newsletter de bienvenue pour les nouveaux abonnés de Mes Poilus.',
  ],
};

function getLogLink(log: ActivityLog): string | null {
  if (log.agent_id === 'marie') {
    const slug = log.details?.article_slug as string | undefined;
    return slug ? `/blog/${slug}` : '/blog';
  }
  return null;
}

export default function AgentPage({ agent, stat, recentLogs, photo, placeholderSrc }: AgentPageProps) {
  const [task, setTask] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  async function runTask(taskText: string) {
    if (!taskText.trim() || isLoading) return;

    setIsLoading(true);
    setIsStreaming(true);
    setResponse('');
    setError('');

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      if (!res.body) throw new Error('Pas de corps de réponse');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResponse(accumulated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  const quickTasks = QUICK_TASKS[agent.id] ?? [];
  const heroSrc = photo?.url ?? placeholderSrc ?? '/images/agents/thomas.svg';
  const heroAlt = photo?.alt ?? `${agent.name} - ${agent.role}`;
  const isExternalImage = heroSrc.startsWith('http');

  return (
    <div className="animate-fade-in">
      {/* ── Hero photo ambiante ───────────────────────────────────────────── */}
      <div className="relative w-full h-52 overflow-hidden bg-[#0d0d0d]">
        <Image
          src={heroSrc}
          alt={heroAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          unoptimized={!isExternalImage}
        />
        {/* Overlay dégradé profond depuis le bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        {/* Overlay couleur de l'agent */}
        <div className={clsx('absolute inset-0 opacity-20', agent.bgColor)} />

        {/* Crédit photo */}
        {photo?.credit && (
          <a
            href={photo.creditUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="absolute bottom-3 right-4 text-[9px] text-white/40 hover:text-white/70 transition-colors bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm"
          >
            📷 {photo.credit} / Unsplash
          </a>
        )}
      </div>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pb-8 space-y-8 -mt-16 relative z-10">
        {/* Agent Header flottant sur l'image */}
        <div className={clsx('card p-6 border', agent.borderColor)}>
          <div className="flex items-start gap-5">
            <div
              className={clsx(
                'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 flex-shrink-0',
                agent.bgColor,
                agent.borderColor
              )}
            >
              {agent.icon}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={clsx('text-2xl font-bold', agent.color)}>{agent.name}</h1>
                <span className="text-gray-500 text-sm">-</span>
                <span className="text-gray-300 text-sm">{agent.role}</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="status-dot-online" />
                  <span className="text-xs text-emerald-400">En ligne</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{agent.description}</p>

              <div className="flex flex-wrap gap-6 mt-4">
                <StatInline label="Tâches complétées" value={stat?.tasks_completed ?? 0} />
                <StatInline label="Tâches échouées" value={stat?.tasks_failed ?? 0} color="text-red-400" />
                <StatInline label="Tokens utilisés" value={formatTokens(stat?.total_tokens_used ?? 0)} />
                {stat?.last_active && (
                  <StatInline
                    label="Dernière activité"
                    value={formatDistanceToNow(new Date(stat.last_active), { addSuffix: true, locale: fr })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Zone d'exécution ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau gauche */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Nouvelle tâche</h2>
              <textarea
                className="input-dark resize-none h-32 mb-3"
                placeholder={`Demande quelque chose à ${agent.name}…`}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runTask(task);
                }}
              />
              <button
                onClick={() => runTask(task)}
                disabled={isLoading || !task.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    En cours…
                  </span>
                ) : (
                  'Exécuter (⌘+Entrée)'
                )}
              </button>
            </div>

            {quickTasks.length > 0 && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Tâches rapides</h2>
                <div className="space-y-2">
                  {quickTasks.map((qt, i) => (
                    <button
                      key={i}
                      onClick={() => { setTask(qt); runTask(qt); }}
                      disabled={isLoading}
                      className="w-full text-left text-xs text-gray-400 hover:text-gray-200 bg-[#0d0d0d] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-50"
                    >
                      {qt.length > 80 ? qt.slice(0, 80) + '…' : qt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panneau réponse */}
          <div className="lg:col-span-2">
            <div className="card p-5 h-full min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Réponse de {agent.name}</h2>
                {isStreaming && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400">Génération…</span>
                  </div>
                )}
                {response && !isStreaming && (
                  <button onClick={() => setResponse('')} className="text-xs text-gray-500 hover:text-gray-300">
                    Effacer
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {response ? (
                <div
                  ref={responseRef}
                  className="flex-1 overflow-y-auto scrollbar-thin text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono bg-[#0a0a0a] rounded-lg p-4 border border-[#1a1a1a]"
                >
                  {response}
                  {isStreaming && <span className="inline-block w-1 h-4 bg-white/70 ml-0.5 animate-pulse" />}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="text-4xl mb-4">{agent.icon}</div>
                  <p className="text-sm text-gray-500">{agent.name} attend une tâche</p>
                  <p className="text-xs text-gray-600 mt-1">Tape ta demande ou utilise une tâche rapide</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historique */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Historique d'activité</h2>
          {recentLogs.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">Aucune activité enregistrée</p>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {recentLogs.map((log) => {
                const link = getLogLink(log);
                const isExpanded = expandedLog === log.id;
                const hasDetails = log.details && Object.keys(log.details).length > 0;

                const Row = (
                  <div className="flex items-start gap-3">
                    <StatusDot status={log.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{log.action}</p>
                      {log.duration_ms && (
                        <p className="text-[10px] text-gray-600 mt-0.5">{log.duration_ms}ms</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                    </span>
                    {link
                      ? <span className="text-[10px] text-blue-500 flex-shrink-0">→</span>
                      : hasDetails && (
                          <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        )
                    }
                  </div>
                );

                return (
                  <div key={log.id} className="py-2">
                    {link ? (
                      <Link
                        href={link}
                        className="flex items-start gap-3 hover:bg-[#111] rounded-lg px-2 -mx-2 py-1 transition-colors duration-150"
                      >
                        <StatusDot status={log.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 truncate">{log.action}</p>
                          {log.duration_ms && (
                            <p className="text-[10px] text-gray-600 mt-0.5">{log.duration_ms}ms</p>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-600 flex-shrink-0">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                        </span>
                        <span className="text-[10px] text-blue-500 flex-shrink-0">→</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        disabled={!hasDetails}
                        className="w-full text-left hover:bg-[#111] rounded-lg px-2 -mx-2 py-1 transition-colors duration-150 disabled:cursor-default"
                      >
                        {Row}
                      </button>
                    )}

                    {/* Contenu généré expandable */}
                    {isExpanded && hasDetails && (
                      <div className="mt-2 mb-1 mx-2 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-4 overflow-y-auto max-h-[500px]">
                        {typeof log.details.content === 'string' ? (
                          <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                            {log.details.content}
                          </pre>
                        ) : (
                          <pre className="text-[11px] text-emerald-400 leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatInline({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <div className={clsx('text-sm font-bold', color ?? 'text-white')}>{value}</div>
      <div className="text-[10px] text-gray-600">{label}</div>
    </div>
  );
}

function StatusDot({ status }: { status: ActivityLog['status'] }) {
  const map = { success: 'bg-emerald-400', error: 'bg-red-400', pending: 'bg-amber-400' };
  return <div className={clsx('w-2 h-2 rounded-full flex-shrink-0 mt-1', map[status])} />;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
