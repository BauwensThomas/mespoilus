'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Agent, AgentStat } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MonthlyAgentStat } from '@/app/(admin)/dashboard/page';

interface AgentCardProps {
  agent: Agent;
  stat?: AgentStat;
  monthly?: MonthlyAgentStat;
}

export default function AgentCard({ agent, stat, monthly }: AgentCardProps) {
  const lastActive = stat?.last_active
    ? formatDistanceToNow(new Date(stat.last_active), { addSuffix: true, locale: fr })
    : 'Jamais';

  const completed = stat?.tasks_completed ?? 0;
  const failed = stat?.tasks_failed ?? 0;
  const score = completed + failed > 0 ? (completed / (completed + failed)) * 100 : 0;

  return (
    <Link href={`/agents/${agent.id}`} className="block group">
      <div
        className={clsx(
          'card-hover p-5 h-full flex flex-col gap-4 relative overflow-hidden',
          'group-hover:shadow-lg transition-all duration-200'
        )}
      >
        {/* Gradient accent en arrière-plan */}
        <div
          className={clsx(
            'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            agent.bgColor
          )}
          style={{ transform: 'translate(30%, -30%)' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl border',
                agent.bgColor,
                agent.borderColor
              )}
            >
              {agent.icon}
            </div>
            <div>
              <h3 className={clsx('font-semibold text-sm', agent.color)}>{agent.name}</h3>
              <p className="text-xs text-gray-200">{agent.role}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className="status-dot-online" />
            <span className="text-xs text-emerald-400 font-medium">En ligne</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-200 leading-relaxed line-clamp-2 relative h-8 overflow-hidden">{agent.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 relative">
          <Stat
            label="Tâches"
            value={stat?.tasks_completed ?? 0}
            monthly={monthly?.tasks ?? 0}
          />
          <Stat
            label="Tokens"
            value={formatTokens(stat?.total_tokens_used ?? 0)}
            monthly={formatTokens(monthly?.tokens ?? 0)}
          />
          <Stat label="Score" value={`${score.toFixed(0)}%`} highlight={score >= 80} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between relative mt-auto pt-3 border-t border-[#404040]">
          <span className="text-[10px] text-gray-300">Actif {lastActive}</span>
          <span className={clsx('text-[10px] font-medium', agent.color, 'group-hover:underline')}>
            Voir le tableau →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, highlight, monthly }: {
  label: string;
  value: string | number;
  highlight?: boolean;
  monthly?: string | number;
}) {
  return (
    <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg p-2 text-center">
      <div className={clsx('text-sm font-bold', highlight ? 'text-emerald-400' : 'text-white')}>
        {value}
      </div>
      <div className="text-[9px] text-gray-300 uppercase tracking-wide mt-0.5">{label}</div>
        <div className="text-[9px] text-gray-500 mt-1 border-t border-[#2a2a2a] pt-1">
          <span className="text-amber-400 font-medium">{monthly}</span> ce mois
        </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
