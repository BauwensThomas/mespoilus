'use client';

import { useRef, useTransition, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';

interface MobileFiltersPanelProps {
  merchants: string[];
  currentMerchants: string[];
  currentMinPrice: number | null;
  currentMaxPrice: number | null;
  currentFavActive: boolean;
}

export default function MobileFiltersPanel({
  merchants, currentMerchants, currentMinPrice, currentMaxPrice, currentFavActive,
}: MobileFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();
  const [open, setOpen] = useState(false);
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

  const activeCount =
    (currentMerchants.length > 0 ? 1 : 0) +
    (currentMinPrice ? 1 : 0) +
    (currentMaxPrice ? 1 : 0) +
    (currentFavActive ? 1 : 0);

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
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
          activeCount > 0
            ? 'bg-orange-600 text-white border-orange-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
        }`}
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} />
        Filtres
        {activeCount > 0 && (
          <span className="bg-white text-orange-600 text-xs font-bold px-1.5 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Filtres</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} strokeWidth={1.5} className="text-gray-500" />
              </button>
            </div>

            <div className="px-4 py-5 space-y-6">

              {/* Prix entre */}
              <div>
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Prix entre</h3>
                <div className="flex items-center gap-2">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                  />
                  <span className="text-gray-400 shrink-0">-</span>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                  />
                  <span className="text-sm text-gray-400 shrink-0">€</span>
                </div>
                {(currentMinPrice || currentMaxPrice) && (
                  <button
                    onClick={() => navigate({ min_price: null, max_price: null })}
                    className="text-xs text-orange-500 hover:underline mt-1.5"
                  >
                    Supprimer le filtre
                  </button>
                )}
              </div>

              {/* Marchands */}
              {merchants.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Marchands</h3>
                  <div className="space-y-3">
                    {merchants.map(m => {
                      const checked = currentMerchants.length === 0 || currentMerchants.includes(m);
                      return (
                        <label key={m} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => toggleMerchant(m, e.target.checked)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-300 w-4 h-4 shrink-0"
                          />
                          <span>{m}</span>
                        </label>
                      );
                    })}
                  </div>
                  {currentMerchants.length > 0 && (
                    <button
                      onClick={() => navigate({ merchants: null })}
                      className="text-xs text-orange-500 hover:underline mt-2"
                    >
                      Tout selectionner
                    </button>
                  )}
                </div>
              )}

              {/* Favoris */}
              <div>
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Favoris</h3>
                <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer select-none">
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
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-300 w-4 h-4 shrink-0"
                  />
                  <span>Mes favoris</span>
                  {favCount > 0 && (
                    <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {favCount}
                    </span>
                  )}
                </label>
              </div>

            </div>

            <div className="px-4 pb-6">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Voir les résultats
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
