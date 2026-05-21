'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function CatalogViewToggle({ currentView }: { currentView: 'grid' | 'list' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();

  function toggle(v: 'grid' | 'list') {
    const p = new URLSearchParams(searchParams.toString());
    if (v === 'grid') p.delete('view');
    else p.set('view', 'list');
    start(() => router.push(`/boutique?${p.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-white">
      <button
        onClick={() => toggle('grid')}
        aria-label="Vue grille"
        aria-pressed={currentView === 'grid'}
        className={`p-1.5 rounded-md transition-colors ${
          currentView === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <LayoutGrid size={15} />
      </button>
      <button
        onClick={() => toggle('list')}
        aria-label="Vue liste"
        aria-pressed={currentView === 'list'}
        className={`p-1.5 rounded-md transition-colors ${
          currentView === 'list' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <List size={15} />
      </button>
    </div>
  );
}
