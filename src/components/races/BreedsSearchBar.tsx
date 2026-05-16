'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { Search, X, LayoutGrid, List } from 'lucide-react';

export default function BreedsSearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const view = searchParams.get('view') === 'list' ? 'list' : 'grid';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('q', value);
    else params.delete('q');
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function handleView(v: 'grid' | 'list') {
    const params = new URLSearchParams(searchParams.toString());
    if (v === 'grid') params.delete('view');
    else params.set('view', v);
    startTransition(() => router.push(`?${params.toString()}`));
  }

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-md">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            defaultValue={defaultValue}
            placeholder="Rechercher une race…"
            aria-label="Rechercher une race"
            className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900
                       placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2
                       focus:ring-orange-200 transition-all duration-200"
          />
          {defaultValue && (
            <button type="button" onClick={handleClear} aria-label="Effacer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
        >
          {isPending ? <span className="inline-block animate-spin">⟳</span> : <Search size={16} />}
          <span className="hidden sm:inline">Chercher</span>
        </button>
      </form>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
        <button
          onClick={() => handleView('grid')}
          className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
          aria-label="Vue grille"
        >
          <LayoutGrid size={18} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handleView('list')}
          className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
          aria-label="Vue liste"
        >
          <List size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
