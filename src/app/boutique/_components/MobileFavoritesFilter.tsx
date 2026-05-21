'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function MobileFavoritesFilter({ active }: { active: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const favs: string[] = JSON.parse(localStorage.getItem('mp_favorites') ?? '[]');
    setFavCount(favs.length);
    const onFavChange = () => {
      const updated: string[] = JSON.parse(localStorage.getItem('mp_favorites') ?? '[]');
      setFavCount(updated.length);
    };
    window.addEventListener('mp:favorites', onFavChange);
    return () => window.removeEventListener('mp:favorites', onFavChange);
  }, []);

  function toggle() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('page');
    if (active) {
      p.delete('fav_ids');
    } else {
      const favs: string[] = JSON.parse(localStorage.getItem('mp_favorites') ?? '[]');
      p.set('fav_ids', favs.length > 0 ? favs.join(',') : '00000000-0000-0000-0000-000000000000');
    }
    start(() => router.push(`/boutique?${p.toString()}`, { scroll: false }));
  }

  return (
    <button
      onClick={toggle}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? 'bg-red-500 text-white border-red-500'
          : 'bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:text-red-500'
      }`}
    >
      <Heart size={12} strokeWidth={1.5} className={active ? 'fill-white' : ''} />
      Favoris
      {favCount > 0 && (
        <span className={`text-xs px-1 rounded-full ${active ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {favCount}
        </span>
      )}
    </button>
  );
}
