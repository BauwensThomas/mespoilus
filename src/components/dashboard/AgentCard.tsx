'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Agent, AgentStat } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AgentCardProps {
  agent: Agent;
  stat?: AgentStat;
}

export default function AgentCard({ agent, stat }: AgentCardProps) {
  const lastActive = stat?.last_active
    ? formatDistanceToNow(new Date(stat.last_active), { addSuffix: true, locale: fr })
    : 'Jamais';

  const score = stat?.performance_score ?? 0;

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
              <p className="text-xs text-gray-500">{agent.role}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className="status-dot-online" />
            <span className="text-xs text-emerald-400 font-medium">En ligne</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 relative">{agent.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 relative">
          <Stat label="Tâches" value={stat?.tasks_completed ?? 0} />
          <Stat label="Tokens" value={formatTokens(stat?.total_tokens_used ?? 0)} />
          <Stat label="Score" value={`${score.toFixed(0)}%`} highlight={score >= 80} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between relative mt-auto pt-3 border-t border-[#1a1a1a]">
          <span className="text-[10px] text-gray-600">Actif {lastActive}</span>
          <span className={clsx('text-[10px] font-medium', agent.color, 'group-hover:underline')}>
            Voir le tableau →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-[#0d0d0d] rounded-lg p-2 text-center">
      <div className={clsx('text-sm font-bold', highlight ? 'text-emerald-400' : 'text-white')}>
        {value}
      </div>
      <div className="text-[9px] text-gray-600 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
