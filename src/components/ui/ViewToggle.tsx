'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const view = searchParams.get('view') === 'list' ? 'list' : 'grid';

  function toggle(v: 'grid' | 'list') {
    const params = new URLSearchParams(searchParams.toString());
    if (v === 'grid') params.delete('view');
    else params.set('view', v);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
      <button
        onClick={() => toggle('grid')}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-1 ${view === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
        aria-label="Vue grille"
      >
        <LayoutGrid size={18} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => toggle('list')}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-1 ${view === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
        aria-label="Vue liste"
      >
        <List size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
