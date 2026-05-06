import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import type { AwinProduct } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import BackButton from '@/components/ui/BackButton';

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

async function getProducts(category?: string): Promise<AwinProduct[]> {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('price', { ascending: true })
      .limit(48);
    if (category && category !== 'all') q = q.eq('category', category);
    const { data } = await q;
    return (data as AwinProduct[]) ?? [];
  } catch {
    return [];
  }
}

interface Props {
  searchParams: { category?: string };
}

export default async function BoutiquePage({ searchParams }: Props) {
  const category = searchParams.category;
  const products = await getProducts(category);
  const activeCat = CATEGORIES.find(c => c.id === (category ?? 'all')) ?? CATEGORIES[0];
  const hasSynced = products.length > 0;

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      <BackButton label="← Accueil" href="/" />

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Boutique Mes Poilus</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sélection de produits pour vos animaux de compagnie
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = (cat.id === 'all' && !category) || cat.id === category;
          return (
            <Link
              key={cat.id}
              href={cat.id === 'all' ? '/boutique' : `/boutique?category=${cat.id}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-black border-amber-500 font-semibold'
                  : 'bg-transparent text-gray-400 border-[#333] hover:border-amber-500/50 hover:text-amber-400'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          );
        })}
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
          <p className="text-sm text-gray-500">
            {products.length} produit{products.length !== 1 ? 's' : ''}
            {category && category !== 'all' ? ` · ${activeCat.label}` : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-gray-500 pt-4 border-t border-gray-800 mt-auto">
        Les liens présents sur cette page sont des liens affiliés. Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
      </p>
    </div>
  );
}

function ProductCard({ product }: { product: AwinProduct }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-500/30 transition-colors">
      {/* Image */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">🐾</div>
        )}
      </div>

      {/* Corps */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-gray-600 uppercase tracking-wide">{product.merchant_name}</p>
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-800/60">
          <span className="text-amber-400 font-bold text-base">
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
