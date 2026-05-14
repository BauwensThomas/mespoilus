'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Check } from 'lucide-react';

const TYPE_OPTIONS = [
  { id: 'nourriture',  label: 'Nourriture' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'habitat',     label: 'Habitat' },
  { id: 'jouets',      label: 'Jouets' },
  { id: 'hygiene',     label: 'Hygiène' },
  { id: 'sante',       label: 'Santé' },
  { id: 'livres',      label: 'Livres' },
];

export default function BoutiqueTypeFilter({ currentTypes }: { currentTypes: string[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentTypes);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSelected(currentTypes);
  }, [currentTypes.join(',')]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter(x => x !== id)
      : [...selected, id];
    setSelected(next);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (next.length > 0) params.set('types', next.join(','));
    else params.delete('types');
    router.push(`/boutique?${params.toString()}`);
  }

  function clearAll() {
    setSelected([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('types');
    params.delete('page');
    router.push(`/boutique?${params.toString()}`);
    setOpen(false);
  }

  const activeCount = selected.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 ${
          activeCount > 0
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:text-gray-900'
        }`}
      >
        <SlidersHorizontal size={15} strokeWidth={1.5} />
        <span>Type{activeCount > 0 ? ` (${activeCount})` : ''}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[180px]">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                selected.includes(opt.id)
                  ? 'bg-orange-600 border-orange-600'
                  : 'border-gray-300'
              }`}>
                {selected.includes(opt.id) && <Check size={10} strokeWidth={3} className="text-white" />}
              </div>
              <span>{opt.label}</span>
            </button>
          ))}
          {activeCount > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={clearAll}
                className="w-full px-4 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left transition-colors"
              >
                Effacer les filtres
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
