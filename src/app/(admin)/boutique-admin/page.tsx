'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Eye, EyeOff, ExternalLink, ShoppingBag, Globe, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'chiens', label: 'Chiens' },
  { value: 'chats', label: 'Chats' },
  { value: 'oiseaux', label: 'Oiseaux' },
  { value: 'rongeurs', label: 'Rongeurs' },
  { value: 'reptiles', label: 'Reptiles' },
  { value: 'livres', label: 'Livres' },
];

const AFFILIATES = [
  { id: 'all',          label: 'Tous',          merchant: 'all',          icon: ShoppingBag },
  { id: 'awin',         label: 'Awin',          merchant: 'awin',         icon: Globe       },
  { id: 'amazon',       label: 'Amazon',        merchant: 'Amazon FR',    icon: BookOpen    },
  { id: 'canadapetcare',label: 'CanadaPetCare', merchant: 'CanadaPetCare',icon: ShoppingBag },
];

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  categories: string[];
  merchant_name: string;
  product_type: string;
}

interface HiddenEntry {
  affiliate_url: string;
  hidden_at: string;
  product: Product | null;
}

export default function BoutiqueAdminPage() {
  const [products, setProducts]           = useState<Product[]>([]);
  const [hiddenEntries, setHiddenEntries] = useState<HiddenEntry[]>([]);
  const [hiddenSet, setHiddenSet]         = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory]           = useState('');
  const [affiliate, setAffiliate]         = useState('all');
  const [awinMerchants, setAwinMerchants] = useState<string[]>([]);
  const [awinMerchant, setAwinMerchant]   = useState('');
  const [visibility, setVisibility]       = useState<'all' | 'visible' | 'hidden'>('all');
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const [totalPages, setTotalPages]       = useState(1);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchHidden = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/products-hidden');
      const d = await r.json();
      const entries: HiddenEntry[] = d.hidden ?? [];
      setHiddenEntries(entries);
      setHiddenSet(new Set(entries.map(h => h.affiliate_url)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchHidden(); }, [fetchHidden]);

  useEffect(() => {
    if (affiliate !== 'awin') { setAwinMerchants([]); setAwinMerchant(''); return; }
    fetch('/api/admin/products-merchants')
      .then(r => r.json())
      .then(d => setAwinMerchants(d.merchants ?? []))
      .catch(() => {});
  }, [affiliate]);

  const fetchCounts = useCallback(async (merchant: string, specificMerchant: string) => {
    try {
      const src = AFFILIATES.find(a => a.id === merchant) ?? AFFILIATES[0];
      const m = (merchant === 'awin' && specificMerchant) ? specificMerchant : src.merchant;
      const r = await fetch(`/api/admin/products-counts?merchant=${encodeURIComponent(m)}`);
      const d = await r.json();
      setCategoryCounts(d.counts ?? {});
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCounts(affiliate, awinMerchant); }, [affiliate, awinMerchant, fetchCounts]);

  const fetchProducts = useCallback(async () => {
    if (visibility === 'hidden') return;
    setLoading(true);
    try {
      const src = AFFILIATES.find(a => a.id === affiliate) ?? AFFILIATES[0];
      const m = (affiliate === 'awin' && awinMerchant) ? awinMerchant : src.merchant;
      const params = new URLSearchParams({ merchant: m, page: String(page) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category)        params.set('category', category);
      const r = await fetch(`/api/admin/products-list?${params}`);
      const data = await r.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [debouncedSearch, category, page, affiliate, awinMerchant, visibility]);

  useEffect(() => {
    if (visibility === 'hidden') setLoading(false);
    else fetchProducts();
  }, [fetchProducts, visibility]);

  async function toggleHide(url: string, name: string) {
    const isHidden = hiddenSet.has(url);
    if (!isHidden && !confirm(`Cacher "${name}" de la boutique ?`)) return;
    setHiddenSet(prev => { const n = new Set(prev); isHidden ? n.delete(url) : n.add(url); return n; });
    if (isHidden) setHiddenEntries(prev => prev.filter(h => h.affiliate_url !== url));
    await fetch('/api/admin/products-hidden', {
      method: isHidden ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliate_url: url }),
    });
    if (!isHidden) await fetchHidden();
  }

  const isHiddenMode = visibility === 'hidden';

  const hiddenToShow = hiddenEntries.filter(h => {
    if (!h.product) return true;
    if (search && !h.product.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && !h.product.categories?.includes(category)) return false;
    return true;
  });

  const pagedToShow = products.filter(p =>
    visibility !== 'visible' || !hiddenSet.has(p.affiliate_url)
  );

  const displayCount = isHiddenMode ? hiddenToShow.length : total;

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Boutique</h1>
        <p className="text-gray-500 text-base mt-1">Gestion des produits par affilié</p>
      </div>

      {/* Onglets affiliés */}
      <div className="flex gap-1 border-b border-gray-200">
        {AFFILIATES.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => { setAffiliate(a.id); setPage(1); setVisibility('all'); setSearch(''); setCategory(''); setAwinMerchant(''); }}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                affiliate === a.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={15} strokeWidth={1.5} />
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Sous-filtre marchands Awin */}
      {affiliate === 'awin' && awinMerchants.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setAwinMerchant(''); setPage(1); }}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              awinMerchant === '' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Tous Awin
          </button>
          {awinMerchants.map(m => (
            <button
              key={m}
              onClick={() => { setAwinMerchant(m); setPage(1); }}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                awinMerchant === m ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="space-y-3">
        {/* Recherche */}
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Visibilite + count */}
        <div className="flex flex-wrap items-center gap-1.5">
          {([['all', 'Tous'], ['visible', 'Visibles'], ['hidden', 'Masques']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setVisibility(val); setPage(1); }}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                visibility === val
                  ? val === 'hidden' ? 'bg-gray-700 text-white' : 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {label}
              {val === 'hidden' && hiddenSet.size > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {hiddenSet.size}
                </span>
              )}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
            {displayCount.toLocaleString('fr-FR')} produit{displayCount > 1 ? 's' : ''}
          </span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => {
            const count = c.value === '' ? null : (categoryCounts[c.value] ?? 0);
            return (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setPage(1); }}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  category === c.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {c.label}
                {count !== null && (
                  <span className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    category === c.value ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      ) : isHiddenMode ? (
        hiddenToShow.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucun produit masque.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hiddenToShow.map(h => (
              <ProductRow
                key={h.affiliate_url}
                product={h.product}
                affiliateUrl={h.affiliate_url}
                isHidden={true}
                onToggle={toggleHide}
              />
            ))}
          </div>
        )
      ) : pagedToShow.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">Aucun produit trouve.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagedToShow.map(p => (
            <ProductRow
              key={p.id}
              product={p}
              affiliateUrl={p.affiliate_url}
              isHidden={hiddenSet.has(p.affiliate_url)}
              onToggle={toggleHide}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isHiddenMode && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Precedent
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  product: Product | null;
  affiliateUrl: string;
  isHidden: boolean;
  onToggle: (url: string, name: string) => void;
}

function ProductRow({ product, affiliateUrl, isHidden, onToggle }: RowProps) {
  const name = product?.name ?? 'Produit inconnu';
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
      {/* Thumbnail */}
      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        {product?.image_url ? (
          <img src={product.image_url} alt="" className={`w-full h-full object-cover ${isHidden ? 'grayscale opacity-60' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-[10px] font-medium text-center px-1">
            {product?.merchant_name ?? '—'}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'text-sm font-medium truncate block transition-colors',
            isHidden ? 'text-gray-400 line-through' : 'text-gray-900 hover:text-orange-600'
          )}
        >
          {name}
        </a>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {product?.merchant_name ?? '—'}
          {product?.product_type ? ` · ${product.product_type}` : ''}
          {product?.price != null ? ` · ${product.price.toFixed(2)} ${product.currency ?? 'EUR'}` : ''}
          {product?.categories?.length ? ` · ${product.categories.join(', ')}` : ''}
        </p>
      </div>

      {/* Badge masque */}
      {isHidden && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 flex-shrink-0">
          Masque
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onToggle(affiliateUrl, name)}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors',
            isHidden
              ? 'bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-600'
              : 'bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-600'
          )}
        >
          {isHidden
            ? <><Eye size={12} strokeWidth={1.5} /> Afficher</>
            : <><EyeOff size={12} strokeWidth={1.5} /> Masquer</>
          }
        </button>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-600 rounded-lg transition-colors"
        >
          <ExternalLink size={12} strokeWidth={1.5} /> Voir
        </a>
      </div>
    </div>
  );
}
