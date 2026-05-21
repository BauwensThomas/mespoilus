'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const OPTIONS = [20, 50, 100] as const;
export type PerPageValue = typeof OPTIONS[number];

export default function CatalogPerPage({ current }: { current: PerPageValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val === '48') p.delete('per_page');
    else p.set('per_page', val);
    p.delete('page');
    start(() => router.push(`/boutique?${p.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500">
      <span className="shrink-0">Afficher</span>
      <select
        defaultValue={current}
        onChange={handleChange}
        aria-label="Nombre de produits par page"
        className="border border-gray-300 rounded-lg px-2 py-2 bg-white text-gray-700 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer"
      >
        {OPTIONS.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <span className="shrink-0">/ page</span>
    </div>
  );
}
