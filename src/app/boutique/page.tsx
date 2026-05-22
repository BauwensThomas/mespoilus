import type { Metadata } from 'next';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronLeft, ChevronRight, Dog, Cat, Bird, Mouse, Zap, PawPrint, BookOpen, Layers, Pencil, EyeOff, Heart } from 'lucide-react';
import CatalogGrid, { type CatalogItem } from './_components/CatalogGrid';
import CatalogSidebar from './_components/CatalogSidebar';
import CatalogSearchBar from './_components/CatalogSearchBar';
import CatalogSortSelect, { type CatalogSortValue } from './_components/CatalogSortSelect';
import CatalogViewToggle from './_components/CatalogViewToggle';
import CatalogPerPage, { type PerPageValue } from './_components/CatalogPerPage';
import MobileFiltersPanel from './_components/MobileFiltersPanel';

export const metadata: Metadata = {
  title: 'Boutique animaux - Mes Poilus',
  description: 'Trouvez les meilleurs produits pour vos animaux de compagnie. Comparez les prix entre tous nos marchands partenaires.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/boutique' },
};

export const revalidate = 3600;

const VALID_PER_PAGE: PerPageValue[] = [20, 50, 100];
const DEFAULT_PER_PAGE: PerPageValue = 20;

const VALID_SORTS: CatalogSortValue[] = ['price_asc', 'price_desc', 'name_asc', 'name_desc'];

const MOBILE_CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: PawPrint },
  { id: 'chiens',   label: 'Chiens',   icon: Dog },
  { id: 'chats',    label: 'Chats',    icon: Cat },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse },
  { id: 'reptiles', label: 'Reptiles', icon: Zap },
  { id: 'livres',   label: 'Livres',   icon: BookOpen },
  { id: 'general',  label: 'General',  icon: Layers },
];

async function getCatalogItems(params: {
  category?: string;
  search?: string;
  sort: CatalogSortValue;
  minPrice?: number;
  maxPrice?: number;
  merchants?: string[];
  favIds?: string[];
  page: number;
  perPage: PerPageValue;
}): Promise<{ items: CatalogItem[]; total: number }> {
  try {
    const supabase = createAdminClient();
    const PAGE_SIZE = params.perPage;
    const offset = (params.page - 1) * PAGE_SIZE;

    let q = supabase
      .from('catalog_best_offer')
      .select(
        'catalog_id, name, brand, category, image_url, weight_g, price, currency, merchant_name, country, affiliate_url',
        { count: 'exact' }
      );

    if (params.category && params.category !== 'all') {
      q = q.or(`category.eq.${params.category},categories.cs.{${params.category}}`);
    }
    if (params.search) {
      const { data: frMatches } = await supabase
        .from('products_catalog')
        .select('id')
        .ilike('name_fr', `%${params.search}%`)
        .limit(500);
      const frIds = (frMatches ?? []).map(r => r.id);
      if (frIds.length > 0) {
        q = q.or(`name.ilike.%${params.search}%,catalog_id.in.(${frIds.join(',')})`);
      } else {
        q = q.ilike('name', `%${params.search}%`);
      }
    }
    if (params.minPrice) q = q.gte('price', params.minPrice);
    if (params.maxPrice) q = q.lte('price', params.maxPrice);
    if (params.merchants && params.merchants.length > 0) q = q.in('merchant_name', params.merchants);
    if (params.favIds && params.favIds.length > 0) q = q.in('catalog_id', params.favIds);

    if (params.sort === 'price_desc') q = q.order('price', { ascending: false });
    else if (params.sort === 'name_asc') q = q.order('name', { ascending: true });
    else if (params.sort === 'name_desc') q = q.order('name', { ascending: false });
    else q = q.order('price', { ascending: true });

    q = q.range(offset, offset + PAGE_SIZE - 1);

    const { data, count, error } = await q;
    if (error || !data) return { items: [], total: 0 };

    const ids = data.map(r => r.catalog_id as string);

    const [countsRes, nameFrRes] = await Promise.all([
      supabase.rpc('get_offer_counts', { catalog_ids: ids }),
      supabase.from('products_catalog').select('id, name_fr').in('id', ids),
    ]);
    const countMap = new Map<string, number>(
      (countsRes.data ?? []).map((r: { catalog_id: string; offer_count: number }) => [r.catalog_id, Number(r.offer_count)])
    );
    const nameFrMap = new Map<string, string>(
      (nameFrRes.data ?? []).filter(r => r.name_fr).map(r => [r.id, r.name_fr as string])
    );

    return {
      items: data.map(r => ({
        catalog_id:   r.catalog_id as string,
        name:         r.name as string,
        name_fr:      nameFrMap.get(r.catalog_id as string) ?? null,
        image_url:    (r.image_url as string | null) ?? null,
        brand:        (r.brand as string | null) ?? null,
        category:     r.category as string,
        weight_g:     (r.weight_g as number | null) ?? null,
        price:        Number(r.price),
        currency:     (r.currency as string | null) ?? 'EUR',
        merchant_name: r.merchant_name as string,
        country:      (r.country as string | null) ?? null,
        affiliate_url: r.affiliate_url as string,
        offer_count:  countMap.get(r.catalog_id as string) ?? 1,
      })),
      total: count ?? 0,
    };
  } catch {
    return { items: [], total: 0 };
  }
}

async function getMerchants(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('catalog_best_offer')
      .select('merchant_name')
      .limit(15000);
    return [...new Set((data ?? []).map(r => r.merchant_name as string).filter(Boolean))].sort();
  } catch {
    return [];
  }
}

async function getHiddenItems(): Promise<CatalogItem[]> {
  try {
    const supabase = createAdminClient();
    const { data: catalog } = await supabase
      .from('products_catalog')
      .select('id, name, name_fr, brand, category, image_url, weight_g')
      .eq('status', 'hidden')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (!catalog?.length) return [];

    const ids = catalog.map((c: { id: string }) => c.id);
    const { data: offers } = await supabase
      .from('product_offers')
      .select('catalog_id, merchant_name, country, price, currency, affiliate_url')
      .in('catalog_id', ids)
      .gt('price', 0)
      .order('price', { ascending: true });

    const bestOffer = new Map<string, NonNullable<typeof offers>[0]>();
    for (const o of offers ?? []) {
      if (!bestOffer.has(o.catalog_id)) bestOffer.set(o.catalog_id, o);
    }

    return catalog
      .filter(c => bestOffer.has(c.id))
      .map(c => {
        const o = bestOffer.get(c.id)!;
        return {
          catalog_id: c.id,
          name: c.name,
          name_fr: (c as { name_fr?: string | null }).name_fr ?? null,
          image_url: c.image_url ?? null,
          brand: c.brand ?? null,
          category: c.category,
          weight_g: c.weight_g ?? null,
          price: Number(o.price),
          currency: o.currency ?? 'EUR',
          merchant_name: o.merchant_name,
          country: o.country ?? null,
          affiliate_url: o.affiliate_url,
          offer_count: 1,
          status: 'hidden' as const,
        };
      });
  } catch {
    return [];
  }
}

function buildPageUrl(base: URLSearchParams, p: number): string {
  const params = new URLSearchParams(base);
  if (p <= 1) params.delete('page');
  else params.set('page', String(p));
  const qs = params.toString();
  return `/boutique${qs ? `?${qs}` : ''}`;
}

interface Props {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
    view?: string;
    min_price?: string;
    max_price?: string;
    merchants?: string;
    per_page?: string;
    fav_ids?: string;
  }>;
}

export default async function BoutiqueV2Page({ searchParams }: Props) {
  const sp              = await searchParams;
  const category        = sp.category;
  const search          = sp.search?.trim();
  const sort            = (VALID_SORTS.includes(sp.sort as CatalogSortValue)
    ? sp.sort : 'price_asc') as CatalogSortValue;
  const page            = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const view            = sp.view === 'list' ? 'list' as const : 'grid' as const;
  const minPrice        = sp.min_price ? parseFloat(sp.min_price) : undefined;
  const maxPrice        = sp.max_price ? parseFloat(sp.max_price) : undefined;
  const filterMerchants = sp.merchants ? sp.merchants.split(',').filter(Boolean) : [];
  const filterFavIds    = sp.fav_ids ? sp.fav_ids.split(',').filter(Boolean) : [];
  const perPageRaw      = parseInt(sp.per_page ?? '', 10) as PerPageValue;
  const perPage         = VALID_PER_PAGE.includes(perPageRaw) ? perPageRaw : DEFAULT_PER_PAGE;

  let isAdmin = false;
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    isAdmin = !!user;
  } catch { /* non-bloquant */ }

  const [{ items, total }, allMerchants, hiddenItems] = await Promise.all([
    getCatalogItems({ category, search, sort, minPrice, maxPrice, merchants: filterMerchants, favIds: filterFavIds, page, perPage }),
    getMerchants(),
    isAdmin ? getHiddenItems() : Promise.resolve([] as CatalogItem[]),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const baseParams = new URLSearchParams();
  if (category) baseParams.set('category', category);
  if (search) baseParams.set('search', search);
  if (sort !== 'price_asc') baseParams.set('sort', sort);
  if (view === 'list') baseParams.set('view', 'list');
  if (minPrice) baseParams.set('min_price', String(minPrice));
  if (maxPrice) baseParams.set('max_price', String(maxPrice));
  if (filterMerchants.length > 0) baseParams.set('merchants', filterMerchants.join(','));
  if (filterFavIds.length > 0) baseParams.set('fav_ids', filterFavIds.join(','));
  if (perPage !== DEFAULT_PER_PAGE) baseParams.set('per_page', String(perPage));

  const currentCategoryLabel = MOBILE_CATEGORIES.find(c => c.id === (category ?? 'all'))?.label ?? 'Tous';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Barre admin sticky */}
      {isAdmin && (
        <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 bg-gray-900/95 backdrop-blur text-white text-xs flex-wrap">
          <Pencil size={13} strokeWidth={1.5} className="text-orange-400" />
          <span className="text-gray-400">Mode admin</span>
          <span className="text-gray-300">Bouton <strong className="text-white">Masquer</strong> sur chaque card · <strong className="text-white">Afficher</strong> pour remettre</span>
          {hiddenItems.length > 0 && (
            <a
              href="#produits-masques"
              className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/30 transition-colors font-medium"
            >
              <EyeOff size={12} />
              {hiddenItems.length} produit{hiddenItems.length > 1 ? 's' : ''} masque{hiddenItems.length > 1 ? 's' : ''}
            </a>
          )}
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Boutique</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0
              ? `${total.toLocaleString('fr-FR')} produit${total !== 1 ? 's' : ''}${search ? ` pour "${search}"` : ` · ${currentCategoryLabel}`}`
              : 'Aucun produit trouve'}
          </p>
        </div>

        {/* Barre de controle */}
        <div className="space-y-2 mb-4">
          {/* Ligne 1 : recherche pleine largeur */}
          <Suspense fallback={<div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />}>
            <CatalogSearchBar defaultValue={search ?? ''} />
          </Suspense>
          {/* Ligne 2 : tri + filtres mobile + per-page (desktop) + toggle vue */}
          <div className="flex items-center gap-2">
            <Suspense fallback={<div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />}>
              <CatalogSortSelect defaultValue={sort} />
            </Suspense>
            <div className="lg:hidden">
              <Suspense fallback={null}>
                <MobileFiltersPanel
                  merchants={allMerchants}
                  currentMerchants={filterMerchants}
                  currentMinPrice={minPrice ?? null}
                  currentMaxPrice={maxPrice ?? null}
                  currentFavActive={filterFavIds.length > 0}
                />
              </Suspense>
            </div>
            <div className="hidden sm:block">
              <Suspense fallback={<div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse" />}>
                <CatalogPerPage current={perPage} />
              </Suspense>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/favoris"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-500 hover:border-red-200 text-sm font-medium transition-colors"
                aria-label="Mes favoris"
              >
                <Heart size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Favoris</span>
              </Link>
              <Suspense fallback={<div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />}>
                <CatalogViewToggle currentView={view} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Categories mobiles + filtre favoris (lg: cachees par la sidebar) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden scrollbar-hide">
          {MOBILE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = cat.id === (category ?? 'all');
            const catParams = new URLSearchParams(baseParams.toString());
            catParams.delete('page');
            if (cat.id === 'all') catParams.delete('category');
            else catParams.set('category', cat.id);
            const href = `/boutique${catParams.toString() ? `?${catParams.toString()}` : ''}`;
            return (
              <Link
                key={cat.id}
                href={href}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                }`}
              >
                <Icon size={13} strokeWidth={1.5} />
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Layout principal : sidebar + grille */}
        <div className="flex gap-5 items-start">
          <Suspense fallback={<div className="w-52 shrink-0 hidden lg:block h-96 bg-gray-100 rounded-2xl animate-pulse" />}>
            <CatalogSidebar
              merchants={allMerchants}
              currentCategory={category ?? 'all'}
              currentMerchants={filterMerchants}
              currentMinPrice={minPrice ?? null}
              currentMaxPrice={maxPrice ?? null}
              currentFavActive={filterFavIds.length > 0}
            />
          </Suspense>

          <div className="flex-1 min-w-0">
            {items.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-medium text-lg">Aucun produit trouve</p>
                <p className="text-sm text-gray-400 mt-1">Essayez d&apos;ajuster vos filtres ou votre recherche</p>
                <Link href="/boutique" className="inline-block mt-4 text-sm text-orange-600 hover:underline font-medium">
                  Voir tous les produits
                </Link>
              </div>
            ) : (
              <>
                <CatalogGrid items={items} view={view} isAdmin={isAdmin} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                    {/* Précédent */}
                    {page > 1 ? (
                      <Link href={buildPageUrl(baseParams, page - 1)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm font-medium">
                        <ChevronLeft size={15} />
                        <span className="hidden sm:inline">Precedent</span>
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm font-medium cursor-not-allowed">
                        <ChevronLeft size={15} />
                        <span className="hidden sm:inline">Precedent</span>
                      </span>
                    )}

                    {/* Numéros — cachés sur mobile, visibles desktop */}
                    <div className="hidden sm:flex items-center gap-1">
                      {buildPageNumbers(page, totalPages).map((p, i) =>
                        p < 0 ? (
                          <span key={`e${i}`} className="px-1 text-gray-400 text-sm">...</span>
                        ) : (
                          <Link key={p} href={buildPageUrl(baseParams, p)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              p === page ? 'bg-orange-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600'
                            }`}>
                            {p}
                          </Link>
                        )
                      )}
                    </div>

                    {/* Mobile : page courante */}
                    <span className="sm:hidden px-3 py-2 text-sm text-gray-500 font-medium">
                      Page {page} / {totalPages}
                    </span>

                    {/* Suivant */}
                    {page < totalPages ? (
                      <Link href={buildPageUrl(baseParams, page + 1)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm font-medium">
                        <span className="hidden sm:inline">Suivant</span>
                        <ChevronRight size={15} />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm font-medium cursor-not-allowed">
                        <span className="hidden sm:inline">Suivant</span>
                        <ChevronRight size={15} />
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Section produits masqués — admin uniquement */}
        {isAdmin && hiddenItems.length > 0 && (
          <div id="produits-masques" className="mt-10 border-t border-dashed border-gray-300 pt-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
              Produits masques ({hiddenItems.length}) — visibles uniquement en mode admin
            </h2>
            <CatalogGrid items={hiddenItems} view={view} isAdmin={true} />
          </div>
        )}
      </div>

      {/* Disclaimer affilié */}
      <div className="mt-8 border-t border-gray-200 px-4 py-3 sm:fixed sm:bottom-0 sm:left-0 sm:right-0 sm:z-40 sm:bg-white/95 sm:backdrop-blur-sm sm:border-t sm:py-2.5 sm:mt-0">
        <p className="text-xs text-gray-500 text-center max-w-6xl mx-auto">
          Les liens présents sur cette page sont des liens affiliés. Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, -1, total];
  if (current >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  return [1, -1, current - 1, current, current + 1, -2, total];
}
