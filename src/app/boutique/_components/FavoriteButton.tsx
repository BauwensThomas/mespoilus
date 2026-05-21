'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

function getVisitorId(): string {
  let id = localStorage.getItem('mp_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mp_visitor_id', id);
  }
  return id;
}

export default function FavoriteButton({ catalogId, size = 16 }: { catalogId: string; size?: number }) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const visitorId = getVisitorId();
    const stored = localStorage.getItem('mp_favorites');
    const favs: string[] = stored ? JSON.parse(stored) : [];
    setIsFav(favs.includes(catalogId));
  }, [catalogId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const visitorId = getVisitorId();
    const newFav = !isFav;
    setIsFav(newFav);

    // Mise à jour localStorage immédiate
    const stored = localStorage.getItem('mp_favorites');
    const favs: string[] = stored ? JSON.parse(stored) : [];
    const updated = newFav ? [...favs, catalogId] : favs.filter(id => id !== catalogId);
    localStorage.setItem('mp_favorites', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mp:favorites', { detail: { catalogId, isFav: newFav } }));

    // Sync Supabase en arrière-plan
    setLoading(true);
    try {
      await fetch('/api/boutique/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, catalogId }),
      });
    } catch {
      // Rollback si erreur
      setIsFav(!newFav);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className="pointer-events-auto relative z-10 p-1.5 rounded-full transition-colors"
    >
      <Heart
        size={size}
        strokeWidth={1.5}
        className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}
      />
    </button>
  );
}
