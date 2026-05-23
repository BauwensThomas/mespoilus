'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition, useEffect, useState } from 'react';
import { Dog, Cat, Bird, Mouse, Zap, PawPrint, BookOpen, Layers, Utensils, Gamepad2, Sparkles, HeartPulse, Home, ShoppingBag } from 'lucide-react';

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: PawPrint },
  { id: 'chiens',   label: 'Chiens',   icon: Dog },
  { id: 'chats',    label: 'Chats',    icon: Cat },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse },
  { id: 'reptiles', label: 'Reptiles', icon: Zap },
  { id: 'livres',   label: 'Livres',   icon: BookOpen },
  { id: 'general',  label: 'General',  icon: Layers },
];

const PRODUCT_TYPES = [
  { id: 'nourriture',  label: 'Alimentation',  icon: Utensils },
  { id: 'jouets',      label: 'Jouets',         icon: Gamepad2 },
  { id: 'hygiene',     label: 'Soin & Hygiène', icon: Sparkles },
  { id: 'sante',       label: 'Santé',          icon: HeartPulse },
  { id: 'habitat',     label: 'Habitat',        icon: Home },
  { id: 'accessoires', label: 'Accessoires',    icon: ShoppingBag },
];

interface CatalogSidebarProps {
  merchants: string[];
  currentCategory: string;
  currentProductType: string | null;
  currentMerchants: string[];
  currentMinPrice: number | null;
  currentMaxPrice: number | null;
  currentFavActive: boolean;
}

export default function CatalogSidebar({
  merchants, currentCategory, currentProductType, currentMerchants, currentMinPrice, currentMaxPrice, currentFavActive,
}: CatalogSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  function navigate(updates: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    p.delete('page');
    start(() => router.push(`/boutique?${p.toString()}`, { scroll: false }));
  }

  function toggleMerchant(m: string, checked: boolean) {
    const base = currentMerchants.length === 0 ? merchants : currentMerchants;
    const next = checked ? [...base, m] : base.filter(x => x !== m);
    const allSelected = next.length === 0 || next.length >= merchants.length;
    navigate({ merchants: allSelected ? null : next.join(',') });
  }

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="bg-gray-200 rounded-2xl border border-orange-300 p-4 space-y-5 sticky top-4">

        {/* Animal */}
        <div>
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Animal</h3>
          <div className="space-y-0.5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === currentCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate({ category: cat.id === 'all' ? null : cat.id })}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-base transition-colors text-left ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="-mx-4 border-orange-300" />

        {/* Type de produit */}
        <div>
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Type</h3>
          <div className="space-y-0.5">
            <button
              onClick={() => navigate({ product_type: null })}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-base transition-colors text-left ${
                !currentProductType
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Layers size={14} strokeWidth={1.5} />
              Tous
            </button>
            {PRODUCT_TYPES.map(pt => {
              const Icon = pt.icon;
              const isActive = currentProductType === pt.id;
              return (
                <button
                  key={pt.id}
                  onClick={() => navigate({ product_type: pt.id })}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-base transition-colors text-left ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} />
                  {pt.label}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="-mx-4 border-orange-300" />

        {/* Prix entre */}
        <div>
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Prix entre</h3>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              step={1}
              defaultValue={currentMinPrice ?? ''}
              placeholder="Min"
              aria-label="Prix minimum"
              onChange={e => {
                if (minTimer.current) clearTimeout(minTimer.current);
                const val = e.target.value;
                minTimer.current = setTimeout(() => navigate({ min_price: val || null }), 600);
              }}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-all"
            />
            <span className="text-gray-400 shrink-0 text-sm">-</span>
            <input
              type="number"
              min={0}
              step={1}
              defaultValue={currentMaxPrice ?? ''}
              placeholder="Max"
              aria-label="Prix maximum"
              onChange={e => {
                if (maxTimer.current) clearTimeout(maxTimer.current);
                const val = e.target.value;
                maxTimer.current = setTimeout(() => navigate({ max_price: val || null }), 600);
              }}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-all"
            />
            <span className="text-sm text-gray-400 shrink-0">€</span>
          </div>
          {(currentMinPrice || currentMaxPrice) && (
            <button
              onClick={() => navigate({ min_price: null, max_price: null })}
              className="text-xs text-orange-500 hover:underline mt-1"
            >
              Supprimer le filtre
            </button>
          )}
        </div>

        {merchants.length > 0 && <hr className="-mx-4 border-orange-300" />}

        {/* Marchands */}
        {merchants.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Marchands</h3>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {merchants.map(m => {
                const checked = currentMerchants.length === 0 || currentMerchants.includes(m);
                return (
                  <label key={m} className="flex items-center gap-2 text-base text-gray-700 cursor-pointer hover:text-gray-900 select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => toggleMerchant(m, e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-300 focus:ring-offset-0 w-3.5 h-3.5 shrink-0"
                    />
                    <span className="line-clamp-1">{m}</span>
                  </label>
                );
              })}
            </div>
            {currentMerchants.length > 0 && (
              <button
                onClick={() => navigate({ merchants: null })}
                className="text-xs text-orange-500 hover:underline mt-1.5"
              >
                Tout selectionner
              </button>
            )}
          </div>
        )}

        <hr className="-mx-4 border-orange-300" />

        {/* Favoris */}
        <div>
          <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Favoris</h3>
          <label className="flex items-center gap-2 text-base text-gray-700 cursor-pointer hover:text-gray-900 select-none">
            <input
              type="checkbox"
              checked={currentFavActive}
              onChange={() => {
                if (currentFavActive) {
                  navigate({ fav_ids: null });
                } else {
                  const favs: string[] = JSON.parse(localStorage.getItem('mp_favorites') ?? '[]');
                  navigate({ fav_ids: favs.length > 0 ? favs.join(',') : '00000000-0000-0000-0000-000000000000' });
                }
              }}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-300 focus:ring-offset-0 w-3.5 h-3.5 shrink-0"
            />
            <span>Mes favoris</span>
            {favCount > 0 && (
              <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">
                {favCount}
              </span>
            )}
          </label>
        </div>
      </div>
    </aside>
  );
}
