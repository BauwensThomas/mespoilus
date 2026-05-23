'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  currentFrom?: string;
  currentTo?: string;
  baseParams: Record<string, string>;
}

export default function DateRangeFilter({ currentFrom, currentTo, baseParams }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(currentFrom ?? '');
  const [to, setTo] = useState(currentTo ?? '');

  function navigate(newFrom: string, newTo: string) {
    const p = new URLSearchParams(baseParams);
    p.delete('page');
    p.delete('newDays');
    if (newFrom) p.set('dateFrom', newFrom); else p.delete('dateFrom');
    if (newTo) p.set('dateTo', newTo); else p.delete('dateTo');
    router.push(`/boutique-v2-admin?${p.toString()}`);
  }

  function reset() {
    setFrom('');
    setTo('');
    navigate('', '');
  }

  const hasFilter = !!(currentFrom || currentTo);

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
        Période
      </label>
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="date"
          value={from}
          onChange={e => { setFrom(e.target.value); navigate(e.target.value, to); }}
          max={to || undefined}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-teal-400 text-gray-700"
        />
        <span className="text-gray-400 text-xs">→</span>
        <input
          type="date"
          value={to}
          onChange={e => { setTo(e.target.value); navigate(from, e.target.value); }}
          min={from || undefined}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-teal-400 text-gray-700"
        />
        {hasFilter && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X size={10} />
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}
