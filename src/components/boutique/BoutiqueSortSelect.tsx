'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ArrowUpDown } from 'lucide-react';

export const SORT_OPTIONS = [
  { value: 'stock',      label: 'Disponibles en premier' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'name_asc',   label: 'Nom A–Z' },
] as const;

export type SortValue = typeof SORT_OPTIONS[number]['value'];

export default function BoutiqueSortSelect({ defaultValue }: { defaultValue: SortValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === 'stock') {
      params.delete('sort');
    } else {
      params.set('sort', e.target.value);
    }
    params.delete('page');
    startTransition(() => router.push(`/boutique?${params.toString()}`));
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={15} className="text-gray-400 shrink-0" />
      <select
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-label="Trier les produits"
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
