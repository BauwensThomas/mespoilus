'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';

export default function BoutiqueSearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    startTransition(() => {
      router.push(`/boutique?${params.toString()}`);
    });
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    startTransition(() => {
      router.push(`/boutique?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          placeholder="Rechercher un produit… ex: gamelle, laisse, jouet"
          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white
                     placeholder-gray-400 focus:outline-none focus:border-amber-500/50 focus:ring-1
                     focus:ring-amber-500/30 transition-colors pr-8"
        />
        {defaultValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold
                   px-4 py-2.5 rounded-xl transition-colors shrink-0"
      >
        {isPending ? '…' : 'Rechercher'}
      </button>
    </form>
  );
}
