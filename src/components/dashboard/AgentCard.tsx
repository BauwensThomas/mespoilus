'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Agent, AgentStat } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PawPrint, Briefcase, PenTool, Search, Smartphone, Code, MessageCircle, BarChart3, Shield, Mail } from 'lucide-react';
import { MonthlyAgentStat, TotalAgentStat } from '@/app/(admin)/dashboard/page';

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

interface AgentCardProps {
  agent: Agent;
  stat?: AgentStat;
  monthly?: MonthlyAgentStat;
  total?: TotalAgentStat;
}

export default function AgentCard({ agent, stat, monthly, total }: AgentCardProps) {
  const lastActive = stat?.last_active
    ? formatDate(stat.last_active)
    : 'Jamais';

  const completed = total?.tasks ?? stat?.tasks_completed ?? 0;
  const failed = total?.failed ?? stat?.tasks_failed ?? 0;
  const score = completed + failed > 0 ? (completed / (completed + failed)) * 100 : null;

  return (
    <Link href={`/agents/${agent.id}`} className="block group">
      <div
        className={clsx(
          'card-hover p-4 h-full flex flex-col gap-3 relative overflow-hidden',
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
                'w-11 h-11 rounded-xl flex items-center justify-center border',
                agent.bgColor,
                agent.borderColor
              )}
            >
              {(() => {
                const IconComponent = getAgentIcon(agent.icon);
                return <IconComponent size={20} strokeWidth={1.5} />;
              })()}
            </div>
            <div>
              <h3 className={clsx('font-semibold text-base', agent.color)}>{agent.name}</h3>
              <p className="text-sm text-gray-600">{agent.role}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div className="status-dot-online" />
            <span className="text-xs text-emerald-600 font-medium">En ligne</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 relative min-h-[2.5rem]">{agent.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 relative">
          <Stat
            label="Tâches"
            value={total?.tasks ?? stat?.tasks_completed ?? 0}
            monthly={monthly?.tasks ?? 0}
            failed={failed}
          />
          <Stat
            label="Tokens"
            value={formatTokens(total?.tokens ?? stat?.total_tokens_used ?? 0)}
            monthly={formatTokens(monthly?.tokens ?? 0)}
          />
          <Stat
            label="Score"
            value={score !== null ? `${score.toFixed(0)}%` : '—'}
            highlight={score !== null && score >= 80}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between relative mt-auto pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500" suppressHydrationWarning>Actif {lastActive}</span>
          <span className={clsx('text-xs font-medium', agent.color, 'group-hover:underline')}>
            Voir le tableau →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, highlight, monthly, failed }: {
  label: string;
  value: string | number;
  highlight?: boolean;
  monthly?: string | number;
  failed?: number;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
      <div className="flex items-center justify-center gap-1">
        <span className={clsx('text-base font-bold', highlight ? 'text-emerald-600' : 'text-gray-900')}>
          {value}
        </span>
        {failed !== undefined && failed > 0 && (
          <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded px-1 leading-4">
            {failed}✕
          </span>
        )}
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
      {monthly !== undefined && (
        <div className="text-[10px] text-gray-400 mt-1 border-t border-gray-200 pt-1">
          <span className="text-amber-600 font-medium">{monthly}</span> ce mois
        </div>
      )}
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
