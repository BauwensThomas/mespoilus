'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix decroissant' },
  { value: 'name_asc',   label: 'Nom A-Z' },
  { value: 'name_desc',  label: 'Nom Z-A' },
] as const;

export type CatalogSortValue = typeof SORT_OPTIONS[number]['value'];

export default function CatalogSortSelect({ defaultValue }: { defaultValue: CatalogSortValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams(searchParams.toString());
    if (e.target.value === 'price_asc') p.delete('sort');
    else p.set('sort', e.target.value);
    p.delete('page');
    start(() => router.push(`/boutique?${p.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex items-center gap-1.5">
      <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
      <select
        defaultValue={defaultValue}
        onChange={handleChange}
        id="catalog-sort"
        name="sort"
        aria-label="Trier les produits"
        className="text-sm border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
