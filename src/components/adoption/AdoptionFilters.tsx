'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface Props {
  available: {
    countries: string[];
    breeds:    string[];
    ageUnits:  string[];
    genders:   string[];
  };
}

const selectCls = 'bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-400 cursor-pointer';

export default function AdoptionFilters({ available }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete(''); // clean
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasFilters = params.get('pays') || params.get('race') || params.get('age_unit') || params.get('gender');

  return (
    <>
      {available.countries.length > 0 && (
        <select value={params.get('pays') ?? ''} onChange={e => update('pays', e.target.value)} className={selectCls}>
          <option value="">Tous les pays</option>
          {available.countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {available.genders.length > 0 && (
        <select value={params.get('gender') ?? ''} onChange={e => update('gender', e.target.value)} className={selectCls}>
          <option value="">Mâle / Femelle</option>
          {available.genders.map(g => (
            <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)}</option>
          ))}
        </select>
      )}
      {available.breeds.length > 0 && (
        <select value={params.get('race') ?? ''} onChange={e => update('race', e.target.value)} className={selectCls}>
          <option value="">Toutes les races</option>
          {available.breeds.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      )}
      {available.ageUnits.length > 1 && (
        <select value={params.get('age_unit') ?? ''} onChange={e => update('age_unit', e.target.value)} className={selectCls}>
          <option value="">Tout âge</option>
          <option value="mois">En mois</option>
          <option value="ans">En années</option>
        </select>
      )}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5"
        >
          Réinitialiser ×
        </button>
      )}
    </>
  );
}
