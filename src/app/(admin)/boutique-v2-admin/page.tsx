import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Package, ShoppingBag, Tag, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight, GitMerge, Store } from 'lucide-react';
import AdminHideToggle from './_components/AdminHideToggle';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

const CATEGORIES = [
  { id: 'all', label: 'Toutes' },
  { id: 'chiens', label: 'Chiens' },
  { id: 'chats', label: 'Chats' },
  { id: 'oiseaux', label: 'Oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs' },
  { id: 'reptiles', label: 'Reptiles' },
  { id: 'livres', label: 'Livres' },
  { id: 'general', label: 'General' },
];

async function getStats() {
  const supabase = createAdminClient();
  const [activeRes, hiddenRes, offersRes, noEanRes, multiRes] = await Promise.all([
    supabase.from('products_catalog').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('products_catalog').select('id', { count: 'exact', head: true }).eq('status', 'hidden'),
    supabase.from('product_offers').select('id', { count: 'exact', head: true }),
    supabase.from('products_catalog').select('id', { count: 'exact', head: true }).is('ean', null),
    supabase.rpc('get_multi_merchant_count'),
  ]);
  return {
    active:   activeRes.count  ?? 0,
    hidden:   hiddenRes.count  ?? 0,
    offers:   offersRes.count  ?? 0,
    noEan:    noEanRes.count   ?? 0,
    multiMerchant: Number(multiRes.data ?? 0),
  };
}

async function getMerchantsAdmin(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_all_merchants');
    if (error) return [];
    return (data ?? []).map((r: { merchant_name: string }) => r.merchant_name).filter(Boolean);
  } catch {
    return [];
  }
}

async function getCatalogList(params: {
  search?: string;
  category?: string;
  status?: string;
  ean?: string;
  merchant?: string;
  multi?: boolean;
  page: number;
}) {
  const supabase = createAdminClient();
  const offset = (params.page - 1) * PAGE_SIZE;

  // Pre-filter for fusionnés (multi-merchant products) via JS computation
  let filterIds: string[] | null = null;

  if (params.multi) {
    const { data } = await supabase
      .from('product_offers')
      .select('catalog_id, merchant_name')
      .gt('price', 0)
      .limit(50000);
    const merchantMap = new Map<string, Set<string>>();
    for (const o of data ?? []) {
      if (!merchantMap.has(o.catalog_id)) merchantMap.set(o.catalog_id, new Set());
      merchantMap.get(o.catalog_id)!.add(o.merchant_name);
    }
    filterIds = [...merchantMap.entries()]
      .filter(([, m]) => m.size > 1)
      .map(([id]) => id);
    if (filterIds.length === 0) return { items: [], total: 0 };
  }

  // Merchant filter uses !inner join (PostgREST) to avoid large .in() arrays
  const selectStr = params.merchant
    ? 'id, name, brand, category, image_url, ean, status, created_at, product_offers!inner(catalog_id)'
    : 'id, name, brand, category, image_url, ean, status, created_at';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('products_catalog')
    .select(selectStr, { count: 'exact' });

  if (params.merchant) q = q.eq('product_offers.merchant_name', params.merchant);

  if (params.status === 'active') q = q.eq('status', 'active');
  else if (params.status === 'hidden') q = q.eq('status', 'hidden');
  else q = q.in('status', ['active', 'hidden']);
  if (params.category && params.category !== 'all') q = q.eq('category', params.category);
  if (params.search) q = q.ilike('name', `%${params.search}%`);
  if (params.ean === 'with')    q = q.not('ean', 'is', null);
  if (params.ean === 'without') q = q.is('ean', null);
  if (filterIds !== null) q = q.in('id', filterIds);

  q = q.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data: catalog, count, error } = await q;
  if (error || !catalog) return { items: [], total: 0 };

  const ids = catalog.map((c: { id: string }) => c.id);

  const { data: offers } = await supabase
    .from('product_offers')
    .select('catalog_id, merchant_name, price, currency')
    .in('catalog_id', ids)
    .gt('price', 0)
    .limit(5000);

  type MerchantPrice = { name: string; minPrice: number; currency: string };
  type OfferSummary = { count: number; minPrice: number; currency: string; merchants: MerchantPrice[] };
  const offerMap = new Map<string, OfferSummary>();
  for (const o of offers ?? []) {
    const entry: OfferSummary = offerMap.get(o.catalog_id) ?? { count: 0, minPrice: Infinity, currency: o.currency ?? 'EUR', merchants: [] };
    entry.count++;
    if (o.price < entry.minPrice) { entry.minPrice = o.price; entry.currency = o.currency ?? 'EUR'; }
    const existing = entry.merchants.find(m => m.name === o.merchant_name);
    if (existing) {
      if (o.price < existing.minPrice) existing.minPrice = o.price;
    } else {
      entry.merchants.push({ name: o.merchant_name, minPrice: o.price, currency: o.currency ?? 'EUR' });
    }
    offerMap.set(o.catalog_id, entry);
  }

  return {
    items: catalog.map(c => ({
      ...c,
      offerSummary: offerMap.get(c.id) ?? null,
    })),
    total: count ?? 0,
  };
}

function buildUrl(base: Record<string, string>, overrides: Record<string, string | null>): string {
  const p = new URLSearchParams(base as Record<string, string>);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === '') p.delete(k);
    else p.set(k, v);
  }
  p.delete('page');
  const qs = p.toString();
  return `/boutique-v2-admin${qs ? `?${qs}` : ''}`;
}

interface Props {
  searchParams: {
    search?: string;
    category?: string;
    status?: string;
    ean?: string;
    merchant?: string;
    multi?: string;
    page?: string;
  };
}

export default async function BoutiqueV2AdminPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const search   = searchParams.search ?? '';
  const category = searchParams.category ?? 'all';
  const status   = searchParams.status ?? 'all';
  const ean      = searchParams.ean ?? 'all';
  const merchant = searchParams.merchant ?? '';
  const multi    = searchParams.multi === '1';
  const page     = Math.max(1, parseInt(searchParams.page ?? '1'));

  const [stats, allMerchants, { items, total }] = await Promise.all([
    getStats(),
    getMerchantsAdmin(),
    getCatalogList({ search, category, status, ean, merchant: merchant || undefined, multi, page }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const baseParams: Record<string, string> = {};
  if (search)   baseParams.search   = search;
  if (category !== 'all') baseParams.category = category;
  if (status   !== 'all') baseParams.status   = status;
  if (ean      !== 'all') baseParams.ean      = ean;
  if (merchant) baseParams.merchant = merchant;
  if (multi)    baseParams.multi    = '1';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/dashboard" className="hover:text-orange-600">Dashboard</Link>
              <span>/</span>
              <span>Boutique V2 Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={22} className="text-orange-500" />
              Boutique V2 — Catalogue
            </h1>
          </div>
          <Link
            href="/boutique"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors"
          >
            Voir la boutique
            <ExternalLink size={13} />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Produits actifs',     value: stats.active,        color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
            { label: 'Produits masques',    value: stats.hidden,        color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200' },
            { label: 'Total offres',        value: stats.offers,        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
            { label: 'Multi-marchands',     value: stats.multiMerchant, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { label: 'Sans EAN',            value: stats.noEan,         color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString('fr-FR')}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="flex-1 min-w-48">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Recherche</label>
            <form method="GET">
              {Object.entries(baseParams).filter(([k]) => k !== 'search').map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <input
                name="search"
                defaultValue={search}
                placeholder="Nom du produit..."
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
              />
            </form>
          </div>

          {/* Categorie */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Categorie</label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(c => (
                <Link
                  key={c.id}
                  href={buildUrl(baseParams, { category: c.id === 'all' ? null : c.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    category === c.id
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                  }`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Statut</label>
            <div className="flex gap-1">
              {[['all', 'Tous'], ['active', 'Actifs'], ['hidden', 'Masques']].map(([v, l]) => (
                <Link
                  key={v}
                  href={buildUrl(baseParams, { status: v === 'all' ? null : v })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    status === v
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {/* EAN */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">EAN</label>
            <div className="flex gap-1">
              {[['all', 'Tous'], ['with', 'Avec'], ['without', 'Sans']].map(([v, l]) => (
                <Link
                  key={v}
                  href={buildUrl(baseParams, { ean: v === 'all' ? null : v })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    ean === v
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {/* Fusionnes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Fusion</label>
            <Link
              href={buildUrl(baseParams, { multi: multi ? null : '1' })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                multi
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
              }`}
            >
              <GitMerge size={11} />
              Fusionnes uniquement
            </Link>
          </div>

          {/* Marchands */}
          {allMerchants.length > 0 && (
            <div className="w-full">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Store size={11} />
                Marchand
              </label>
              <div className="flex flex-wrap gap-1">
                <Link
                  href={buildUrl(baseParams, { merchant: null })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    !merchant
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                  }`}
                >
                  Tous
                </Link>
                {allMerchants.map(m => (
                  <Link
                    key={m}
                    href={buildUrl(baseParams, { merchant: m })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      merchant === m
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    {m}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compteur */}
        <p className="text-sm text-gray-500 mb-3">
          {total.toLocaleString('fr-FR')} produit{total > 1 ? 's' : ''}
          {search && ` pour "${search}"`}
          {' '}· Page {page}/{totalPages || 1}
        </p>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Produit</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">Categorie</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden lg:table-cell">EAN</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">Prix / Marchands</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Aucun produit
                  </td>
                </tr>
              ) : items.map(item => {
                const isHidden = item.status === 'hidden';
                const o = item.offerSummary;
                return (
                  <tr key={item.id} className={`transition-colors ${isHidden ? 'bg-gray-100 hover:bg-gray-200' : 'hover:bg-gray-50'}`}>

                    {/* Produit */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill unoptimized className="object-contain p-1" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-1 text-sm">{item.name}</p>
                          {item.brand && (
                            <p className="text-[11px] text-gray-400 line-clamp-1">{item.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categorie */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        <Tag size={10} />
                        {item.category}
                      </span>
                    </td>

                    {/* EAN */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {item.ean ? (
                        <span className="text-xs font-mono bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200">
                          {item.ean}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-400 px-2.5 py-1 rounded-lg border border-red-100 whitespace-nowrap">
                          <AlertCircle size={11} />
                          Sans EAN
                        </span>
                      )}
                    </td>

                    {/* Offres */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {o ? (
                        <div className="flex flex-wrap gap-1">
                          {o.merchants.map(m => (
                            <span
                              key={m.name}
                              className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap flex items-center gap-1 ${
                                m.minPrice === o.minPrice
                                  ? 'bg-orange-50 text-orange-600 border border-orange-200 font-semibold'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {m.name} · {m.minPrice.toFixed(2)} {m.currency}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic whitespace-nowrap">Aucune offre</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3 text-center">
                      {isHidden ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-200 font-medium">
                          <EyeOff size={10} />
                          Masque
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-200 font-medium">
                          <Eye size={10} />
                          Actif
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/boutique/${item.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="Voir la fiche publique"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <AdminHideToggle catalogId={item.id} name={item.name} status={item.status as 'active' | 'hidden'} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 ? (
              <Link
                href={`/boutique-v2-admin?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 text-sm"
              >
                <ChevronLeft size={15} /> Precedent
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm cursor-not-allowed">
                <ChevronLeft size={15} /> Precedent
              </span>
            )}
            <span className="text-sm text-gray-500 px-3">Page {page} / {totalPages}</span>
            {page < totalPages ? (
              <Link
                href={`/boutique-v2-admin?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 text-sm"
              >
                Suivant <ChevronRight size={15} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-100 text-gray-300 text-sm cursor-not-allowed">
                Suivant <ChevronRight size={15} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
