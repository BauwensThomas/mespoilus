'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { Search, X } from 'lucide-react';

export default function CatalogSearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value.trim()) p.set('search', value.trim());
    else p.delete('search');
    p.delete('page');
    start(() => router.push(`/boutique?${p.toString()}`, { scroll: false }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navigate(e.target.value), 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    navigate(inputRef.current?.value ?? '');
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (inputRef.current) inputRef.current.value = '';
    navigate('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          id="catalog-search"
          name="q"
          type="text"
          defaultValue={defaultValue}
          placeholder="Rechercher un produit..."
          aria-label="Rechercher un produit"
          onChange={handleChange}
          className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-8 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
        />
        {defaultValue && (
          <button
            type="button"
            onClick={clear}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        aria-label="Lancer la recherche"
        className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 flex items-center justify-center"
      >
        {isPending ? (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Search size={15} />
        )}
      </button>
    </form>
  );
}
