'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { Search, X } from 'lucide-react';

export default function AdoptionSearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    startTransition(() => {
      router.push(`/adoption?${params.toString()}`);
    });
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    startTransition(() => {
      router.push(`/adoption?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-md">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          placeholder="Rechercher un animal…"
          aria-label="Rechercher un animal à adopter"
          className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900
                     placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2
                     focus:ring-orange-200 transition-all duration-200"
        />
        {defaultValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Effacer la recherche"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        aria-label="Lancer la recherche"
        className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-400 text-white text-sm font-semibold
                   px-5 py-2.5 rounded-xl transition-colors duration-200 shrink-0 flex items-center gap-2
                   focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
      >
        {isPending ? <span className="inline-block animate-spin">⟳</span> : <Search size={16} />}
        <span className="hidden sm:inline">Chercher</span>
      </button>
    </form>
  );
}
