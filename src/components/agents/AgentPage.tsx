'use client';

import { useState, useRef, useEffect } from 'react';
import { Agent, AgentStat, ActivityLog } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PawPrint, Briefcase, PenTool, Search, Smartphone, Code, MessageCircle, BarChart3, Shield, Mail, Clipboard, CheckCircle2, XCircle, Upload, Send, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import type { UnsplashPhoto } from '@/lib/unsplash';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d))     return `aujourd'hui à ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `hier à ${format(d, 'HH:mm')}`;
  return format(d, 'd MMM à HH:mm', { locale: fr });
}

function getAgentIcon(iconId: string) {
  const icons: Record<string, typeof PawPrint> = {
    briefcase: Briefcase,
    'pen-tool': PenTool,
    search: Search,
    smartphone: Smartphone,
    code: Code,
    'message-circle': MessageCircle,
    'bar-chart-3': BarChart3,
    shield: Shield,
    mail: Mail,
  };
  return icons[iconId] || PawPrint;
}

interface DelegationResult {
  agent: string;
  task: string;
  success: boolean;
  result: string;
  priority: number;
}

interface DelegationData {
  thomasDecision: string | null;
  delegations: DelegationResult[];
}

interface AgentPageProps {
  agent: Agent;
  stat?: AgentStat;
  recentLogs: ActivityLog[];
  photo?: UnsplashPhoto | null;
  placeholderSrc?: string;
  monthly?: { tasks: number; failed: number; tokens: number };
}

const QUICK_TASKS: Record<string, string[]> = {
  thomas: [
    'Analyse la situation actuelle de l\'agence et priorise les 5 tâches les plus importantes cette semaine.',
    'Génère le rapport hebdomadaire de l\'équipe avec les KPIs principaux.',
    'Crée une stratégie de croissance pour doubler le trafic du blog en 3 mois.',
  ],
  marie: [
    'Écris un article sur les signes de stress chez le chat et comment y remédier.',
    'Écris un article sur l\'alimentation du chien en été : hydratation et croquettes adaptées.',
    'Écris un article sur les soins à donner à son lapin en hiver.',
  ],
  lucas: [
    'Recherche les 20 meilleurs mots-clés sur la niche "alimentation chien Belgique".',
    'Analyse les tendances de recherche pour les chats en automne et propose 3 sujets d\'articles.',
    'Trouve le meilleur sujet d\'article pour les reptiles ce printemps.',
  ],
  emma: [
    'Crée un post Facebook et Instagram pour le dernier article publié.',
    'Crée un post engageant sur les conseils estivaux pour les animaux de compagnie.',
    'Crée un post Facebook et Instagram sur l\'adoption animale en Belgique.',
  ],
  maxime: [
    'Effectue un audit des performances du site et liste les problèmes Core Web Vitals.',
    'Vérifie les dépendances npm obsolètes et propose un plan de mise à jour.',
    'Optimise les requêtes Supabase pour améliorer les temps de réponse.',
  ],
  lea: [
    'Voici le message d\'un client : "Bonjour, j\'ai commandé un article il y a 2 semaines et je n\'ai rien reçu." -Réponds-lui.',
    'Voici le message d\'un client : "Mon chien refuse de manger ses croquettes depuis 3 jours, que faire ?" -Réponds-lui.',
    'Voici le message d\'un client : "Comment puis-je me désabonner de la newsletter ?" -Réponds-lui.',
  ],
  antoine: [
    'Génère le rapport financier mensuel avec revenus, dépenses et marges.',
    'Analyse la rentabilité de chaque canal de revenus et recommande des optimisations.',
    'Crée des projections financières pour le prochain trimestre avec 3 scénarios.',
  ],
  nathalie: [
    'Effectue un audit de sécurité complet de l\'application Next.js.',
    'Analyse les derniers logs de sécurité et identifie les menaces potentielles.',
    'Génère un rapport sur les bonnes pratiques de sécurité à implémenter en priorité.',
  ],
  sofia: [
    'Rédige la newsletter de cette semaine.',
    'Crée une newsletter spéciale "été" avec des conseils pour les propriétaires d\'animaux.',
    'Rédige une newsletter de bienvenue pour les nouveaux abonnés de Mes Poilus.',
  ],
};

const AGENT_HINTS: Record<string, string> = {
  marie: 'Donne-lui un sujet -ex: "écris un article sur l\'alimentation du chien en été"',
  lucas: 'Donne-lui un animal + saison -ex: "meilleurs sujets pour les chats cet automne"',
  lea:   'Colle-lui le message du client à traiter -elle répondra à sa place',
};

function getLogLink(log: ActivityLog): string | null {
  if (log.agent_id === 'marie') {
    const slug = log.details?.article_slug as string | undefined;
    return slug ? `/blog/${slug}` : '/blog';
  }
  return null;
}

export default function AgentPage({ agent, stat, recentLogs, photo, placeholderSrc, monthly }: AgentPageProps) {
  const [task, setTask] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [delegationState, setDelegationState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [delegationData, setDelegationData] = useState<DelegationData | null>(null);
  const [sendToSocial, setSendToSocial] = useState(false);
  const [socialStatus, setSocialStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [marieImageUrl, setMarieImageUrl] = useState('');
  const [marieUploading, setMarieUploading] = useState(false);
  const marieFileRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  async function handleMarieUpload(file: File) {
    setMarieUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await r.json();
      if (data.url) setMarieImageUrl(data.url);
    } catch { /* ignore */ }
    finally { setMarieUploading(false); }
  }

  async function runTask(taskText: string) {
    if (!taskText.trim() || isLoading) return;

    setIsLoading(true);
    setIsStreaming(true);
    setResponse('');
    setError('');
    setDelegationState('idle');
    setDelegationData(null);

    let finalResponse = '';

    try {
      const body: Record<string, string> = { task: taskText };
      if (agent.id === 'marie' && marieImageUrl) body.imageUrl = marieImageUrl;
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      if (!res.body) throw new Error('Pas de corps de réponse');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalResponse += decoder.decode(value, { stream: true });
        setResponse(finalResponse);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      return;
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }

    // Si Marie + toggle réseaux : appeler Emma avec le slug/titre de l'article
    if (agent.id === 'marie' && sendToSocial && finalResponse.length > 100) {
      setSocialStatus('sending');
      try {
        const slugMatch = finalResponse.match(/^slug:\s*(.+)/m);
        const titleMatch = finalResponse.match(/^title:\s*(.+)/m);
        const slug = slugMatch?.[1]?.trim() ?? '';
        const title = titleMatch?.[1]?.trim() ?? task;
        const instructions = `Crée un post Facebook et Instagram pour cet article de blog :\nTitre : ${title}\nLien : https://mespoilus.com/blog/${slug}\nDonne envie de le lire !`;
        const r = await fetch('/api/admin/emma-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instructions, imageUrl: marieImageUrl || undefined }),
        });
        setSocialStatus(r.ok ? 'done' : 'error');
      } catch {
        setSocialStatus('error');
      }
    }

    if (finalResponse.length >= 150) {
      setDelegationState('loading');
      try {
        const delRes = await fetch('/api/agents/delegate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            agentResponse: finalResponse,
            originalTask: taskText,
          }),
        });
        if (delRes.ok) {
          const data: DelegationData = await delRes.json();
          setDelegationData(data);
        }
      } catch { /* non-bloquant */ }
      setDelegationState('done');
    }
  }

  const quickTasks = QUICK_TASKS[agent.id] ?? [];
  const agentHint = AGENT_HINTS[agent.id] ?? null;
  const heroSrc = photo?.url ?? placeholderSrc ?? '/images/agents/thomas.svg';
  const heroAlt = photo?.alt ?? `${agent.name} - ${agent.role}`;
  const isExternalImage = heroSrc.startsWith('http');

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative w-full h-52 overflow-hidden bg-white">
        <Image
          src={heroSrc}
          alt={heroAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          unoptimized={isExternalImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
        <div className={clsx('absolute inset-0 opacity-20', agent.bgColor)} />

        {photo?.credit && (
          <a
            href={photo.creditUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="absolute bottom-3 right-4 text-[9px] text-gray-600/40 hover:text-gray-600/70 transition-colors bg-black/10 px-1.5 py-0.5 rounded backdrop-blur-sm"
          >
            © {photo.credit} / Unsplash
          </a>
        )}
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-6 pb-8 space-y-6 -mt-16 relative z-10">

        {/* Agent Header */}
        <div className={clsx('card p-6 border', agent.borderColor)}>
          <div className="flex items-start gap-5">
            <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center border-2 flex-shrink-0', agent.bgColor, agent.borderColor)}>
              {(() => {
                const IconComponent = getAgentIcon(agent.icon);
                return <IconComponent size={32} strokeWidth={1.5} />;
              })()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={clsx('text-2xl font-bold', agent.color)}>{agent.name}</h1>
                <span className="text-gray-400">—</span>
                <span className="text-gray-700 text-base">{agent.role}</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="status-dot-online" />
                  <span className="text-sm text-emerald-600 font-medium">En ligne</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{agent.description}</p>

              <div className="flex flex-wrap gap-6 mt-4">
                <StatInline label="Tâches complétées" value={stat?.tasks_completed ?? 0} monthly={monthly?.tasks ?? 0} />
                <StatInline label="Tâches échouées" value={stat?.tasks_failed ?? 0} color="text-red-500" monthly={monthly?.failed ?? 0} monthlyColor="text-red-500" />
                <StatInline label="Tokens utilisés" value={formatTokens(stat?.total_tokens_used ?? 0)} monthly={formatTokens(monthly?.tokens ?? 0)} />
                {stat?.last_active && (
                  <StatInline label="Dernière activité" value={formatDate(stat.last_active)} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Zone d'exécution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Panneau gauche */}
          <div className="lg:col-span-1 space-y-4">
            {agent.id === 'emma' && <EmmaDirectPanel />}
            {agent.id === 'sofia' && <SofiaNewsletterPanel />}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Nouvelle tâche</h2>
              <textarea
                className="input-dark resize-none h-32 mb-3"
                placeholder={`Demande quelque chose à ${agent.name}…`}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runTask(task);
                }}
              />
              {agentHint && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                  {agentHint}
                </p>
              )}
              {agent.id === 'marie' && (
                <div className="mb-3">
                  <div
                    onClick={() => !marieUploading && marieFileRef.current?.click()}
                    className={clsx(
                      'border-2 border-dashed rounded-lg p-2.5 cursor-pointer transition-colors text-center',
                      marieImageUrl ? 'border-purple-300' : 'border-gray-200 hover:border-purple-300'
                    )}
                  >
                    {marieImageUrl ? (
                      <div className="relative">
                        <img src={marieImageUrl} alt="Aperçu" className="max-h-20 mx-auto rounded object-contain" />
                        <button
                          onClick={e => { e.stopPropagation(); setMarieImageUrl(''); }}
                          className="absolute top-0 right-0 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 text-xs"
                        >×</button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <Upload size={12} />
                        {marieUploading ? 'Upload en cours…' : 'Ajouter une image (optionnel)'}
                      </p>
                    )}
                    <input
                      ref={marieFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleMarieUpload(f); }}
                    />
                  </div>
                </div>
              )}
              {agent.id === 'marie' && (
                <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
                  <div
                    onClick={() => setSendToSocial(v => !v)}
                    className={clsx(
                      'w-9 h-5 rounded-full transition-colors flex-shrink-0 relative',
                      sendToSocial ? 'bg-pink-500' : 'bg-gray-200'
                    )}
                  >
                    <span className={clsx(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      sendToSocial ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className="text-xs text-gray-600">Publier aussi sur les réseaux (Emma)</span>
                </label>
              )}
              <button
                onClick={() => { setSocialStatus('idle'); runTask(task); }}
                disabled={isLoading || !task.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    En cours…
                  </span>
                ) : (
                  'Exécuter'
                )}
              </button>
              {agent.id === 'marie' && socialStatus !== 'idle' && (
                <p className={clsx('text-xs mt-2 text-center', socialStatus === 'done' ? 'text-emerald-600' : socialStatus === 'error' ? 'text-red-500' : 'text-pink-500')}>
                  {socialStatus === 'sending' && '📱 Emma publie sur les réseaux…'}
                  {socialStatus === 'done' && '✓ Post publié sur les réseaux'}
                  {socialStatus === 'error' && '✗ Erreur lors de la publication réseaux'}
                </p>
              )}
            </div>

            {quickTasks.length > 0 && (
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Tâches rapides</h2>
                <div className="space-y-2">
                  {quickTasks.map((qt, i) => (
                    <button
                      key={i}
                      onClick={() => { setTask(qt); runTask(qt); }}
                      disabled={isLoading}
                      className="w-full text-left text-sm text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2.5 transition-all duration-150 disabled:opacity-50"
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
                <h2 className="text-base font-semibold text-gray-900">Réponse de {agent.name}</h2>
                {isStreaming && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm text-emerald-600">Génération…</span>
                  </div>
                )}
                {response && !isStreaming && (
                  <button onClick={() => setResponse('')} className="text-sm text-gray-500 hover:text-gray-900">
                    Effacer
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {response ? (
                <div
                  ref={responseRef}
                  className="flex-1 overflow-y-auto scrollbar-thin text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  {response}
                  {isStreaming && <span className="inline-block w-1 h-4 bg-gray-900/70 ml-0.5 animate-pulse" />}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="mb-4 text-gray-300">
                    {(() => {
                      const IconComponent = getAgentIcon(agent.icon);
                      return <IconComponent size={48} strokeWidth={1.5} />;
                    })()}
                  </div>
                  <p className="text-base text-gray-600">{agent.name} attend une tâche</p>
                  <p className="text-sm text-gray-500 mt-1">Tape ta demande ou utilise une tâche rapide</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Délégation Thomas */}
        {delegationState !== 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Briefcase size={16} strokeWidth={1.5} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-orange-600">Thomas analyse</span>
                {delegationState === 'loading' && (
                  <span className="ml-2 text-sm text-gray-500">en cours…</span>
                )}
              </div>
              {delegationState === 'loading' && (
                <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {delegationState === 'done' && delegationData && (
              <>
                <div className={clsx('card p-4 border', delegationData.delegations.length > 0 ? 'border-amber-300' : 'border-gray-200')}>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {delegationData.delegations.length > 0 ? (
                        <Clipboard size={18} strokeWidth={1.5} className="text-orange-600" />
                      ) : (
                        <CheckCircle2 size={18} strokeWidth={1.5} className="text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-1">
                        {delegationData.delegations.length > 0
                          ? `Thomas délègue ${delegationData.delegations.length} tâche${delegationData.delegations.length > 1 ? 's' : ''}`
                          : 'Thomas -Aucune délégation'}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {delegationData.thomasDecision ?? 'Rapport complet, aucune action supplémentaire nécessaire.'}
                      </p>
                    </div>
                  </div>
                </div>

                {delegationData.delegations.length > 0 && (
                  <div className="space-y-3">
                    {delegationData.delegations.map((d, i) => (
                      <DelegationCard key={i} delegation={d} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Historique */}
        <HistoryPanel recentLogs={recentLogs} expandedLog={expandedLog} setExpandedLog={setExpandedLog} />
      </div>
    </div>
  );
}

// ─── Historique avec collapse + filtre date ──────────────────────────────────

function HistoryPanel({
  recentLogs,
  expandedLog,
  setExpandedLog,
}: {
  recentLogs: ActivityLog[];
  expandedLog: string | null;
  setExpandedLog: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const filtered = dateFilter
    ? recentLogs.filter(log => log.created_at.slice(0, 10) === dateFilter)
    : recentLogs;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-base font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          Historique d'activité
          <span className="text-xs font-normal text-gray-400 ml-1">({recentLogs.length})</span>
        </button>
        {open && (
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:border-orange-400"
          />
        )}
      </div>

      {open && (
        <>
          {dateFilter && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour le {new Date(dateFilter + 'T00:00:00').toLocaleDateString('fr-FR')}</span>
              <button onClick={() => setDateFilter('')} className="text-xs text-orange-500 hover:underline">Effacer</button>
            </div>
          )}
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              {dateFilter ? 'Aucune activité ce jour' : 'Aucune activité enregistrée'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 mt-3">
              {filtered.map((log) => {
                const link = getLogLink(log);
                const isExpanded = expandedLog === log.id;
                const hasDetails = log.details && Object.keys(log.details).length > 0;

                const RowContent = (
                  <div className="flex items-start gap-3">
                    <StatusDot status={log.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{log.action}</p>
                      {log.duration_ms && (
                        <p className="text-xs text-gray-500 mt-0.5">{log.duration_ms}ms</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(log.created_at)}</span>
                    {link
                      ? <span className="text-xs text-blue-500 flex-shrink-0">→</span>
                      : hasDetails && <span className="text-xs text-gray-400 flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                    }
                  </div>
                );

                return (
                  <div key={log.id} className="py-2">
                    {link ? (
                      <Link href={link} className="flex items-start gap-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 py-1.5 transition-colors">
                        <StatusDot status={log.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{log.action}</p>
                          {log.duration_ms && <p className="text-xs text-gray-500 mt-0.5">{log.duration_ms}ms</p>}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(log.created_at)}</span>
                        <span className="text-xs text-blue-500 flex-shrink-0">→</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        disabled={!hasDetails}
                        className="w-full text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 py-1.5 transition-colors disabled:cursor-default"
                      >
                        {RowContent}
                      </button>
                    )}
                    {isExpanded && hasDetails && (
                      <div className="mt-2 mb-1 mx-2 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto max-h-[500px]">
                        {typeof log.details.content === 'string' ? (
                          <pre className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-mono">{log.details.content}</pre>
                        ) : (
                          <pre className="text-xs text-emerald-700 leading-relaxed whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Panneau Emma : post direct réseaux sociaux ───────────────────────────────

function EmmaDirectPanel() {
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await r.json();
      if (data.url) setImageUrl(data.url);
      else setError(data.error ?? 'Upload échoué');
    } catch {
      setError('Upload échoué');
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    if (!instructions.trim()) return;
    setGenerating(true);
    setResult('');
    setError('');
    try {
      const r = await fetch('/api/admin/emma-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, imageUrl: imageUrl || undefined }),
      });
      const data = await r.json();
      if (data.success) setResult(data.content);
      else setError(data.error ?? 'Erreur');
    } catch {
      setError('Erreur inconnue');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="card p-5 border border-pink-200">
      <h2 className="text-sm font-semibold text-pink-600 mb-3 flex items-center gap-2">
        <Send size={14} strokeWidth={1.5} />
        Post direct réseaux sociaux
      </h2>

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-3 mb-3 cursor-pointer transition-colors text-center',
          imageUrl ? 'border-pink-300' : 'border-gray-200 hover:border-pink-300'
        )}
      >
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl} alt="Aperçu" className="max-h-28 mx-auto rounded object-contain" />
            <button
              onClick={e => { e.stopPropagation(); setImageUrl(''); }}
              className="absolute top-0 right-0 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 text-xs"
            >×</button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Upload size={13} />
            {uploading ? 'Upload en cours…' : 'Photo (optionnel)'}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
        />
      </div>

      <textarea
        className="input-dark resize-none h-24 mb-3 w-full text-sm"
        placeholder="Dis à Emma quoi publier… ex: 'Fais un post sur nos nouveaux produits pour reptiles'"
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
      />

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={generating || !instructions.trim() || uploading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {generating
          ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Emma génère…</span>
          : 'Générer & Envoyer sur les réseaux'}
      </button>

      {result && (
        <div className="mt-3 bg-pink-50 border border-pink-200 rounded-lg p-3">
          <p className="text-xs text-pink-600 font-semibold mb-1.5">✓ Post envoyé</p>
          <pre className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{result}</pre>
          <button
            onClick={() => { setResult(''); setInstructions(''); setImageUrl(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-2"
          >Nouveau post</button>
        </div>
      )}
    </div>
  );
}

// ─── Panneau Sofia : envoi newsletter manuel ──────────────────────────────────

function SofiaNewsletterPanel() {
  const [target, setTarget] = useState<'admin' | 'all'>('admin');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSend() {
    setSending(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'newsletter', target, bypass: 'true' }),
      });
      const data = await r.json();
      setResult({
        success: data.success,
        message: data.success
          ? `Newsletter envoyée à ${data.sent ?? 1} destinataire${(data.sent ?? 1) > 1 ? 's' : ''}`
          : (data.error ?? data.reason ?? 'Erreur inconnue'),
      });
    } catch {
      setResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card p-5 border border-rose-200">
      <h2 className="text-sm font-semibold text-rose-600 mb-3 flex items-center gap-2">
        <Mail size={14} strokeWidth={1.5} />
        Envoyer newsletter
      </h2>

      <div className="flex gap-2 mb-3">
        {(['admin', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={clsx(
              'flex-1 text-xs py-2 rounded-lg border font-medium transition-colors',
              target === t
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400'
            )}
          >
            {t === 'admin' ? '🔒 Test (admin)' : '📧 Tous les abonnés'}
          </button>
        ))}
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {sending
          ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Génération et envoi…</span>
          : 'Envoyer la newsletter'}
      </button>

      {result && (
        <div className={clsx(
          'mt-3 rounded-lg p-3 text-xs',
          result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
        )}>
          {result.success ? '✓ ' : '✗ '}{result.message}
        </div>
      )}
    </div>
  );
}

const AGENT_META: Record<string, { icon: string; color: string; borderColor: string }> = {
  thomas:   { icon: 'briefcase',     color: 'text-orange-600',  borderColor: 'border-orange-300' },
  marie:    { icon: 'pen-tool',      color: 'text-purple-600',  borderColor: 'border-purple-300' },
  lucas:    { icon: 'search',        color: 'text-blue-600',    borderColor: 'border-blue-300' },
  emma:     { icon: 'smartphone',    color: 'text-pink-600',    borderColor: 'border-pink-300' },
  maxime:   { icon: 'code',          color: 'text-emerald-600', borderColor: 'border-emerald-300' },
  lea:      { icon: 'message-circle', color: 'text-orange-600', borderColor: 'border-orange-300' },
  antoine:  { icon: 'bar-chart-3',   color: 'text-teal-600',    borderColor: 'border-teal-300' },
  nathalie: { icon: 'shield',        color: 'text-red-500',     borderColor: 'border-red-300' },
  sofia:    { icon: 'mail',          color: 'text-rose-600',    borderColor: 'border-rose-300' },
};

function DelegationCard({ delegation }: { delegation: DelegationResult }) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[delegation.agent] ?? { icon: 'user', color: 'text-gray-500', borderColor: 'border-gray-200' };

  return (
    <div className={clsx('card border', meta.borderColor)}>
      <button className="w-full p-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-3">
          <div>
            {(() => {
              const IconComponent = getAgentIcon(meta.icon);
              return <IconComponent size={18} strokeWidth={1.5} />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <span className={clsx('text-sm font-semibold', meta.color)}>
              {delegation.agent.charAt(0).toUpperCase() + delegation.agent.slice(1)}
            </span>
            <p className="text-sm text-gray-600 truncate mt-0.5">{delegation.task}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={clsx(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              delegation.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
            )}>
              {delegation.success ? (
                <><CheckCircle2 size={12} strokeWidth={1.5} />OK</>
              ) : (
                <><XCircle size={12} strokeWidth={1.5} />Erreur</>
              )}
            </div>
            <span className="text-xs text-gray-400">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <pre className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-mono mt-3 max-h-64 overflow-y-auto scrollbar-thin">
            {delegation.result}
          </pre>
        </div>
      )}
    </div>
  );
}

function StatInline({ label, value, color, monthly, monthlyColor }: {
  label: string;
  value: string | number;
  color?: string;
  monthly?: string | number;
  monthlyColor?: string;
}) {
  return (
    <div>
      <div className={clsx('text-base font-bold', color ?? 'text-gray-900')}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {monthly !== undefined && (
        <div className="text-sm text-gray-500 mt-0.5">
          <span className={clsx('font-medium', monthlyColor ?? 'text-amber-600')}>{monthly}</span> ce mois
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: ActivityLog['status'] }) {
  const map = { success: 'bg-emerald-500', error: 'bg-red-500', pending: 'bg-amber-500' };
  return <div className={clsx('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', map[status])} />;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
