'use client';

import { ActivityLog } from '@/types';
import { AGENTS } from '@/lib/agents/config';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import Link from 'next/link';

interface ActivityFeedProps {
  logs: ActivityLog[];
  horizontal?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d))     return `aujourd'hui à ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `hier à ${format(d, 'HH:mm')}`;
  return format(d, 'd MMM à HH:mm', { locale: fr });
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Activité récente</h2>
        <span className="text-[10px] text-gray-300 uppercase tracking-wide">Live</span>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-gray-300 py-2">Aucune activité pour le moment</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {logs.slice(0, 20).map((log) => {
            const agent = AGENTS[log.agent_id];
            return (
              <div
                key={log.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#333] transition-colors duration-150"
              >
                <Link
                  href={`/agents/${log.agent_id}`}
                  className={clsx('text-xs font-semibold flex-shrink-0 w-14 hover:underline', agent?.color ?? 'text-gray-200')}
                >
                  {log.agent_name}
                </Link>
                <StatusBadge status={log.status} />
                <p className="text-[11px] text-gray-100 flex-1 truncate">{log.action}</p>
                <span className="text-[10px] text-gray-300 flex-shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ActivityLog['status'] }) {
  const map = {
    success: 'bg-emerald-500/15 text-emerald-400',
    error: 'bg-red-500/15 text-red-400',
    pending: 'bg-amber-500/15 text-amber-400',
  };
  const labels = { success: '✓', error: '✗', pending: '…' };

  return (
    <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', map[status])}>
      {labels[status]}
    </span>
  );
}
