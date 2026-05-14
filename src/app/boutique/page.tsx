import type { Metadata } from 'next';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { AwinProduct } from '@/types';
import Link from 'next/link';
import BoutiqueSearchBar from '@/components/boutique/BoutiqueSearchBar';
import BoutiqueSortSelect, { type SortValue } from '@/components/boutique/BoutiqueSortSelect';
import BoutiqueTypeFilter from '@/components/boutique/BoutiqueTypeFilter';
import ProductCard from '@/components/boutique/ProductCard';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, ChevronLeft, ChevronRight, Store, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Boutique animaux -Mes Poilus',
  description: 'Accessoires, alimentation et produits pour animaux de compagnie. Sélection de produits pour chiens, chats, oiseaux, rongeurs et reptiles.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/boutique' },
};

export const revalidate = 3600;

const PAGE_SIZE = 48;

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: PawPrint },
  { id: 'chiens',   label: 'Chiens',   icon: Dog },
  { id: 'chats',    label: 'Chats',    icon: Cat },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse },
  { id: 'reptiles', label: 'Reptiles', icon: Zap },
  { id: 'livres',   label: 'Livres',   icon: BookOpen },
];


// Marchands hors-Awin ajoutés manuellement (1 requête existence = fiable)
const NON_AWIN_MERCHANTS = ['Amazon FR', 'CanadaPetCare'];

async function getMerchants(category?: string): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const cat = category && category !== 'all' ? category : null;
    const names = new Set<string>();

    // Marchands connus : vérification d'existence (1 row, ultra-rapide)
    await Promise.all(NON_AWIN_MERCHANTS.map(async (merchant) => {
      let q = supabase.from('products').select('id').eq('merchant_name', merchant).limit(1);
      if (cat) q = q.contains('categories', [cat]);
      const { data } = await q;
      if (data && data.length > 0) names.add(merchant);
    }));

    // Marchands Awin : requête dynamique (chaque marchand a des centaines de produits,
    // donc ils apparaissent bien dans les premières lignes)
    let awinQ = supabase.from('products').select('merchant_name')
      .not('merchant_name', 'is', null)
      .not('merchant_name', 'in', `(${NON_AWIN_MERCHANTS.map(m => `"${m}"`).join(',')})`)
      .limit(5000);
    if (cat) awinQ = awinQ.contains('categories', [cat]);
    const { data: awinData } = await awinQ;
    awinData?.forEach((r: { merchant_name: string }) => { if (r.merchant_name) names.add(r.merchant_name); });

    return [...names].sort();
  } catch {
    return [];
  }
}

async function getProducts(
  category: string | undefined,
  search: string | undefined,
  affiliate: string | undefined,
  page: number,
  sort: SortValue,
  productTypes: string[]
): Promise<{ products: AwinProduct[]; total: number }> {
  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * PAGE_SIZE;

    let dataQ = supabase.from('products').select('*').gt('price', 0);

    if (sort === 'price_desc') dataQ = dataQ.order('price', { ascending: false });
    else if (sort === 'name_asc') dataQ = dataQ.order('name', { ascending: true });
    else dataQ = dataQ.order('price', { ascending: true });

    let countQ = supabase.from('products').select('*', { count: 'exact', head: true }).gt('price', 0);

    if (category && category !== 'all') {
      dataQ  = dataQ.contains('categories', [category]);
      countQ = countQ.contains('categories', [category]);
    }
    if (search) {
      const filter = `name.ilike.%${search}%,description.ilike.%${search}%`;
      dataQ  = dataQ.or(filter);
      countQ = countQ.or(filter);
    }
    if (affiliate) {
      dataQ  = dataQ.eq('merchant_name', affiliate);
      countQ = countQ.eq('merchant_name', affiliate);
    }
    if (productTypes.length > 0) {
      dataQ  = dataQ.in('product_type', productTypes);
      countQ = countQ.in('product_type', productTypes);
    }

    dataQ = dataQ.range(offset, offset + PAGE_SIZE - 1);

    const [dataRes, countRes] = await Promise.all([dataQ, countQ]);

    return {
      products: (dataRes.data as AwinProduct[]) ?? [],
      total: countRes.count ?? 0,
    };
  } catch {
    return { products: [], total: 0 };
  }
}

function buildPageUrl(base: URLSearchParams, page: number): string {
  const p = new URLSearchParams(base);
  if (page <= 1) p.delete('page');
  else p.set('page', String(page));
  const qs = p.toString();
  return `/boutique${qs ? `?${qs}` : ''}`;
}

const VALID_SORTS: SortValue[] = ['stock', 'price_desc', 'name_asc'];

const VALID_TYPES = ['nourriture', 'accessoires', 'habitat', 'jouets', 'hygiene', 'sante', 'livres'];

interface Props {
  searchParams: { category?: string; search?: string; page?: string; affiliate?: string; sort?: string; types?: string };
}

export default async function BoutiquePage({ searchParams }: Props) {
  const category     = searchParams.category;
  const search       = searchParams.search?.trim();
  const affiliate    = searchParams.affiliate;
  const page         = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const sort         = (VALID_SORTS.includes(searchParams.sort as SortValue) ? searchParams.sort : 'stock') as SortValue;
  const productTypes = (searchParams.types ?? '').split(',').filter(t => VALID_TYPES.includes(t));

  // Vérifier si admin connecté (cookies → session Supabase)
  let isAdmin = false;
  let merchants: string[] = [];
  try {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    isAdmin = !!user;
    if (isAdmin) merchants = await getMerchants(category);
  } catch { /* non-bloquant */ }

  const { products, total } = await getProducts(category, search, affiliate, page, sort, productTypes);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeCat  = CATEGORIES.find(c => c.id === (category ?? 'all')) ?? CATEGORIES[0];
  const hasSynced  = total > 0;

  const baseParams = new URLSearchParams();
  if (category)              baseParams.set('category', category);
  if (search)                baseParams.set('search', search);
  if (affiliate)             baseParams.set('affiliate', affiliate);
  if (sort && sort !== 'stock') baseParams.set('sort', sort);
  if (productTypes.length > 0) baseParams.set('types', productTypes.join(','));

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
          const href = cat.id === 'all'
            ? (affiliate ? `/boutique?affiliate=${encodeURIComponent(affiliate)}` : '/boutique')
            : `/boutique?category=${cat.id}${affiliate ? `&affiliate=${encodeURIComponent(affiliate)}` : ''}`;
          return (
            <Link
              key={cat.id}
              href={href}
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
        <div className="w-px bg-gray-200 self-stretch mx-1" />
        <BoutiqueTypeFilter currentTypes={productTypes} />
      </div>

      {/* Filtre affilié — admin uniquement */}
      {isAdmin && merchants.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
            <Store size={13} />
            Filtre affilié (admin)
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={category ? `/boutique?category=${category}` : '/boutique'}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                !affiliate ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500 hover:text-amber-700'
              }`}
            >
              Tous les affiliés
            </Link>
            {merchants.map(m => (
              <Link
                key={m}
                href={`/boutique?affiliate=${encodeURIComponent(m)}${category ? `&category=${category}` : ''}`}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  affiliate === m ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500 hover:text-amber-700'
                }`}
              >
                {m}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recherche + Tri */}
      <div className="flex flex-wrap items-center gap-3">
        <BoutiqueSearchBar defaultValue={search ?? ''} />
        <BoutiqueSortSelect defaultValue={sort} />
        {!search && (
          <p className="text-xs text-gray-700">
            Vous ne trouvez pas ce que vous cherchez ?{' '}
            <Link href="/boutique" className="text-orange-500 hover:underline">Voir tous les produits</Link>
            {' '}et recherchez par mot-clé (ex&nbsp;: aquarium, nourriture, laisse…)
          </p>
        )}
      </div>

      {/* Bannière */}
      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
            {affiliate ? 'Affilié' : 'Catégorie'}
          </p>
          <p className="text-white font-bold text-lg md:text-xl capitalize">
            {affiliate ?? activeCat.label}
          </p>
        </div>
        <p className="text-white/60 text-sm">
          {hasSynced
            ? `${total.toLocaleString('fr-FR')} produit${total !== 1 ? 's' : ''}`
            : 'Bientôt disponible'}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {total.toLocaleString('fr-FR')} produit{total !== 1 ? 's' : ''}
              {affiliate ? ` · ${affiliate}` : category && category !== 'all' ? ` · ${activeCat.label}` : ''}
              {search ? ` · "${search}"` : ''}
            </h2>
            {totalPages > 1 && (
              <p className="text-sm text-gray-500">Page {page} / {totalPages}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {page > 1 ? (
                <Link
                  href={buildPageUrl(baseParams, page - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm font-medium cursor-not-allowed">
                  <ChevronLeft size={16} />
                  Précédent
                </span>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <Link
                      key={p}
                      href={buildPageUrl(baseParams, p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600'
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-1 text-gray-400 text-sm">…</span>
                    <Link
                      href={buildPageUrl(baseParams, totalPages)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-colors"
                    >
                      {totalPages}
                    </Link>
                  </>
                )}
              </div>

              {page < totalPages ? (
                <Link
                  href={buildPageUrl(baseParams, page + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm font-medium"
                >
                  Suivant
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm font-medium cursor-not-allowed">
                  Suivant
                  <ChevronRight size={16} />
                </span>
              )}
            </div>
          )}
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
