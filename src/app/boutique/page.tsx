import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import type { AwinProduct } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { getHeroPhotos, getBannerPhotos, CATEGORY_QUERIES } from '@/lib/unsplash';
import BoutiqueSearchBar from '@/components/boutique/BoutiqueSearchBar';
import BoutiquePartenairesCarousel from '@/components/boutique/BoutiquePartenairesCarousel';
import { PARTENAIRES } from '@/lib/partenaires';

export const metadata: Metadata = {
  title: 'Boutique animaux — Mes Poilus',
  description: 'Accessoires, alimentation et produits pour animaux de compagnie. Sélection de produits pour chiens, chats, oiseaux, rongeurs et reptiles.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/boutique' },
};

export const revalidate = 3600;

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     emoji: '🐾' },
  { id: 'chiens',   label: 'Chiens',   emoji: '🐕' },
  { id: 'chats',    label: 'Chats',    emoji: '🐈' },
  { id: 'oiseaux',  label: 'Oiseaux',  emoji: '🦜' },
  { id: 'rongeurs', label: 'Rongeurs', emoji: '🐹' },
  { id: 'reptiles', label: 'Reptiles', emoji: '🦎' },
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
  const bannerQuery = category && category !== 'all' ? CATEGORY_QUERIES[category] : undefined;

  const [products, allPhotos] = await Promise.all([
    getProducts(category, search),
    bannerQuery ? getBannerPhotos(bannerQuery) : getHeroPhotos(),
  ]);

  const activeCat = CATEGORIES.find(c => c.id === (category ?? 'all')) ?? CATEGORIES[0];
  const hasSynced = products.length > 0;
  const filteredPartenaires = PARTENAIRES;

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8 pb-14 space-y-4 animate-fade-in">
      {/* Flex : colonne gauche (titre/recherche/filtres) | colonne droite (carousel) */}
      <div className="flex items-start gap-8">

        {/* Colonne gauche — espacement identique au blog */}
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Boutique Mes Poilus</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sélection de produits pour vos animaux de compagnie
            </p>
          </div>

          <BoutiqueSearchBar defaultValue={search ?? ''} />

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const isActive = (cat.id === 'all' && !category) || cat.id === category;
              return (
                <Link
                  key={cat.id}
                  href={cat.id === 'all' ? '/boutique' : `/boutique?category=${cat.id}`}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-black border-amber-500 font-semibold'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-500/50 hover:text-amber-600'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Colonne droite — carousel */}
        <BoutiquePartenairesCarousel partenaires={filteredPartenaires} />

      </div>

      {/* Bannière */}
      <div className="relative h-28 rounded-2xl overflow-hidden bg-[#111]">
        {allPhotos[0] && (
          <Image src={allPhotos[0].url} alt={allPhotos[0].alt} fill className="object-cover object-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 from-30% via-amber-500/80 via-55% to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center px-6 z-10">
          <div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium">Catégorie</p>
            <p className="text-white font-bold text-xl">{activeCat.label}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {hasSynced ? `${products.length} produit${products.length !== 1 ? 's' : ''}` : 'Bientôt disponible'}
            </p>
          </div>
        </div>
      </div>

      {!hasSynced ? (
        /* Aucun produit — synchronisation Awin en attente */
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-gray-500 font-medium">Les produits arrivent bientôt !</p>
          <p className="text-gray-400 text-sm mt-1">
            Notre catalogue est en cours de synchronisation avec nos partenaires affiliés.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {products.length} produit{products.length !== 1 ? 's' : ''}
            {category && category !== 'all' ? ` · ${activeCat.label}` : ''}
            {search ? ` · "${search}"` : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500 text-center">
          Les liens présents sur cette page sont des liens affiliés. Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: AwinProduct }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:border-amber-400/30 transition-all shadow-sm">
      {/* Image */}
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🐾</div>
        )}
      </div>

      {/* Corps */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{product.merchant_name}</p>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span className="text-amber-600 font-bold text-base">
            {product.price.toFixed(2)} {product.currency}
          </span>
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Voir sur le site →
          </a>
        </div>
      </div>
    </div>
  );
}
