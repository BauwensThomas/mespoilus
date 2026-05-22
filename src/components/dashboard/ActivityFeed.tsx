'use client';

import { ActivityLog } from '@/types';
import { AGENTS } from '@/lib/agents/config';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

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

function isSameDay(dateStr: string, filterDate: string) {
  return dateStr.slice(0, 10) === filterDate;
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  const [open, setOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const todayCount = logs.filter(l => isToday(new Date(l.created_at))).length;
  const filtered = dateFilter ? logs.filter(l => isSameDay(l.created_at, dateFilter)) : logs;

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <h2 className="text-base font-semibold text-gray-900">Activité récente</h2>
          {logs.length > 0 && (
            <span className="text-xs text-gray-400">({logs.length})</span>
          )}
        </div>
        {todayCount > 0 && (
          <span className="text-xs font-semibold text-red-500" suppressHydrationWarning>aujourd'hui ({todayCount})</span>
        )}
        <span className="text-xs text-gray-400 uppercase tracking-wide">Live</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Filtre date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <X size={13} /> Effacer
              </button>
            )}
            {dateFilter && (
              <span className="text-xs text-gray-400">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">Aucune activité pour cette date</p>
          ) : (
            <div className="space-y-0.5 max-h-[calc(10*2.5rem)] overflow-y-auto scrollbar-thin pr-1">
              {filtered.map((log) => {
                const agent = AGENTS[log.agent_id];
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <Link
                      href={`/agents/${log.agent_id}`}
                      className={clsx('text-sm font-semibold flex-shrink-0 w-16 hover:underline', agent?.color ?? 'text-gray-600')}
                    >
                      {log.agent_name}
                    </Link>
                    <StatusBadge status={log.status} />
                    <p className="text-sm text-gray-700 flex-1 truncate">{log.action}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0" suppressHydrationWarning>
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ActivityLog['status'] }) {
  const map = {
    success: 'bg-emerald-100 text-emerald-600',
    error: 'bg-red-100 text-red-500',
    pending: 'bg-amber-100 text-amber-600',
  };
  const labels = { success: '✓', error: '✗', pending: '…' };

  return (
    <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', map[status])}>
      {labels[status]}
    </span>
  );
}
