'use client';

import { ActivityLog } from '@/types';
import { AGENTS } from '@/lib/agents/config';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import Link from 'next/link';

interface ActivityFeedProps {
  logs: ActivityLog[];
  horizontal?: boolean;
}

export default function ActivityFeed({ logs, horizontal = false }: ActivityFeedProps) {
  if (horizontal) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Activité récente</h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Live</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">Aucune activité pour le moment</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {logs.slice(0, 10).map((log) => {
              const agent = AGENTS[log.agent_id];
              return (
                <div
                  key={log.id}
                  className="flex-shrink-0 w-52 flex gap-2.5 p-3 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors duration-150"
                >
                  <Link href={`/agents/${log.agent_id}`} className="flex-shrink-0">
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform duration-150 border',
                        agent?.bgColor ?? 'bg-gray-700/20',
                        agent?.borderColor ?? 'border-gray-700/30'
                      )}
                    >
                      {agent?.icon ?? '🤖'}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Link
                        href={`/agents/${log.agent_id}`}
                        className={clsx('text-xs font-semibold hover:underline truncate', agent?.color ?? 'text-gray-400')}
                      >
                        {log.agent_name}
                      </Link>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{log.action}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Activité récente</h2>
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Live</span>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-3xl mb-3">⚡</div>
          <p className="text-sm text-gray-500">Aucune activité pour le moment</p>
          <p className="text-xs text-gray-600 mt-1">Les agents n'ont pas encore été exécutés</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin pr-1">
          {logs.map((log) => {
            const agent = AGENTS[log.agent_id];
            return (
              <div
                key={log.id}
                className="flex gap-3 p-3 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors duration-150"
              >
                <Link href={`/agents/${log.agent_id}`} className="flex-shrink-0">
                  <div
                    className={clsx(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:scale-110 transition-transform duration-150 border',
                      agent?.bgColor ?? 'bg-gray-700/20',
                      agent?.borderColor ?? 'border-gray-700/30'
                    )}
                  >
                    {agent?.icon ?? '🤖'}
                  </div>
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/agents/${log.agent_id}`}
                      className={clsx('text-xs font-semibold hover:underline', agent?.color ?? 'text-gray-400')}
                    >
                      {log.agent_name}
                    </Link>
                    <StatusBadge status={log.status} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{log.action}</p>
                  {log.duration_ms && (
                    <p className="text-[10px] text-gray-600 mt-0.5">{log.duration_ms}ms</p>
                  )}
                </div>
                <div className="text-[10px] text-gray-600 flex-shrink-0 text-right">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                </div>
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
