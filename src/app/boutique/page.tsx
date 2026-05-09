import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import type { AwinProduct } from '@/types';
import Link from 'next/link';
import BoutiqueSearchBar from '@/components/boutique/BoutiqueSearchBar';
import ProductCard from '@/components/boutique/ProductCard';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Boutique animaux -Mes Poilus',
  description: 'Accessoires, alimentation et produits pour animaux de compagnie. Sélection de produits pour chiens, chats, oiseaux, rongeurs et reptiles.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/boutique' },
};

export const revalidate = 3600;

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: PawPrint },
  { id: 'chiens',   label: 'Chiens',   icon: Dog },
  { id: 'chats',    label: 'Chats',    icon: Cat },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse },
  { id: 'reptiles', label: 'Reptiles', icon: Zap },
  { id: 'livres',   label: 'Livres',   icon: BookOpen },
];

async function getProducts(category?: string, search?: string): Promise<AwinProduct[]> {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .gt('price', 0)
      .order('price', { ascending: true })
      .limit(48);
    if (category && category !== 'all') q = q.eq('category', category);
    if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    const { data } = await q;
    return (data as AwinProduct[]) ?? [];
  } catch {
    return [];
  }
}

interface Props {
  searchParams: { category?: string; search?: string };
}

export default async function BoutiquePage({ searchParams }: Props) {
  const category = searchParams.category;
  const search = searchParams.search?.trim();
  const products = await getProducts(category, search);
  const activeCat = CATEGORIES.find(c => c.id === (category ?? 'all')) ?? CATEGORIES[0];
  const hasSynced = products.length > 0;

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-6 space-y-5 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Boutique</h1>
        <p className="text-sm text-gray-500">Sélection de produits pour vos animaux de compagnie</p>
      </div>

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map(cat => {
          const isActive = (cat.id === 'all' && !category) || cat.id === category;
          const IconComponent = cat.icon;
          return (
            <Link
              key={cat.id}
              href={cat.id === 'all' ? '/boutique' : `/boutique?category=${cat.id}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isActive
                  ? 'bg-orange-600 text-white border-orange-600 focus:ring-orange-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:text-orange-600 hover:shadow-md focus:ring-orange-300'
              }`}
            >
              <IconComponent size={18} strokeWidth={1.5} />
              <span>{cat.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Recherche */}
      <BoutiqueSearchBar defaultValue={search ?? ''} />

      {/* Bannière */}
      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Catégorie</p>
          <p className="text-white font-bold text-lg md:text-xl capitalize">{activeCat.label}</p>
        </div>
        <p className="text-white/60 text-sm">
          {hasSynced ? `${products.length} produit${products.length !== 1 ? 's' : ''}` : 'Bientôt disponible'}
          {search ? ` · "${search}"` : ''}
        </p>
      </div>

      {/* Produits */}
      {!hasSynced ? (
        <div className="text-center py-20 bg-orange-50 rounded-3xl border border-orange-100">
          <p className="text-gray-700 font-medium text-lg">Les produits arrivent bientôt !</p>
          <p className="text-gray-600 text-base mt-2">Notre catalogue est en cours de synchronisation.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {products.length} produit{products.length !== 1 ? 's' : ''}
            {category && category !== 'all' ? ` · ${activeCat.label}` : ''}
            {search ? ` · "${search}"` : ''}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-3">
        <p className="text-xs text-gray-600 text-center max-w-6xl mx-auto">
          Les liens présents sur cette page sont des liens affiliés. Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>
    </div>
  );
}
