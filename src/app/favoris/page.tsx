'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, LayoutGrid, List, Info } from 'lucide-react';
import CatalogCard from '@/app/boutique/_components/CatalogCard';
import CatalogListItem from '@/app/boutique/_components/CatalogListItem';
import type { CatalogItem } from '@/app/boutique/_components/CatalogGrid';
import ClientWrapper from '@/components/animations/ClientWrapper';

function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mp_visitor_id');
}

export default function FavorisPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const visitorId = getVisitorId();
    if (!visitorId) { setLoading(false); return; }

    fetch(`/api/boutique/favorites?v=${visitorId}`)
      .then(r => r.json())
      .then(async ({ ids }: { ids: string[] }) => {
        if (!ids.length) { setLoading(false); return; }
        const res = await fetch('/api/boutique/favorites/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        setItems(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">

        {/* Header avec animation */}
        <div className="flex items-center gap-3 mb-4 fade-up">
          <Link href="/boutique" className="text-gray-400 hover:text-orange-600 transition-colors">
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span className="sr-only">Retour à la boutique</span>
          </Link>
          <div className="flex items-center gap-2">
            <Heart size={20} className="fill-red-500 text-red-500" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight glow-text">Mes favoris</h1>
          </div>
        </div>

        {/* Notice localStorage avec animation */}
        <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-6 text-sm text-orange-800 fade-up reveal-color">
          <Info size={15} strokeWidth={1.5} className="shrink-0 mt-0.5 text-orange-500" />
          <p>
            Vos favoris sont sauvegardés sur cet appareil et ce navigateur.
            Si vous videz votre historique ou changez de navigateur, ils seront perdus.
          </p>
        </div>

        {/* Loading skeleton avec animation */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-container">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="stagger-child h-72 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <Heart size={48} className="text-gray-200 mx-auto mb-4 animate-pulse" strokeWidth={1} />
            <p className="text-gray-500 text-lg font-medium">Aucun favori pour l&apos;instant</p>
            <p className="text-gray-400 text-sm mt-1">Cliquez sur le coeur d&apos;un produit pour le sauvegarder</p>
            <Link
              href="/boutique"
              className="inline-block mt-6 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
            >
              Découvrir les produits
            </Link>
          </div>
        ) : (
          <>
            {/* Barre d'outils avec animations */}
            <div className="flex items-center justify-between mb-4 fade-up">
              <p className="text-sm text-gray-500">
                {items.length} produit{items.length > 1 ? 's' : ''} sauvegarde{items.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 transition-all duration-300 ${view === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  aria-label="Vue grille"
                >
                  <LayoutGrid size={15} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 transition-all duration-300 ${view === 'list' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  aria-label="Vue liste"
                >
                  <List size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Grille des favoris avec stagger */}
            {view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-container">
                {items.map((item, idx) => (
                  <div key={item.catalog_id} className="stagger-child relative h-full">
                    <CatalogCard
                      catalogId={item.catalog_id}
                      name={item.name}
                      nameFr={item.name_fr}
                      imageUrl={item.image_url}
                      brand={item.brand}
                      weightG={item.weight_g}
                      price={item.price}
                      currency={item.currency}
                      merchantName={item.merchant_name}
                      country={item.country}
                      affiliateUrl={item.affiliate_url}
                      offerCount={item.offer_count}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 stagger-container">
                {items.map((item, idx) => (
                  <div key={item.catalog_id} className="stagger-child">
                    <CatalogListItem
                      catalogId={item.catalog_id}
                      name={item.name}
                      nameFr={item.name_fr}
                      imageUrl={item.image_url}
                      brand={item.brand}
                      weightG={item.weight_g}
                      category={item.category}
                      price={item.price}
                      currency={item.currency}
                      merchantName={item.merchant_name}
                      country={item.country}
                      affiliateUrl={item.affiliate_url}
                      offerCount={item.offer_count}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <ClientWrapper />
    </div>
  );
}