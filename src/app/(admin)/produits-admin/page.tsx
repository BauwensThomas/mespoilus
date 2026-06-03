'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ExternalLink, RefreshCw, Pencil, Check, X, ShoppingBag, Search, Upload } from 'lucide-react';
import clsx from 'clsx';

const ANIMAL_CATEGORIES = [
  { id: 'chiens',   label: 'Chiens' },
  { id: 'chats',    label: 'Chats' },
  { id: 'oiseaux',  label: 'Oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs' },
  { id: 'reptiles', label: 'Reptiles' },
];

const AFFILIATE_SOURCES = [
  { id: 'amazon',        label: 'Amazon', merchant: 'Amazon FR',     icon: BookOpen    },
  { id: 'canadapetcare', label: 'CanadaPetCare', merchant: 'CanadaPetCare', icon: ShoppingBag },
];

const PRODUCT_TYPES = [
  { id: 'nourriture',  label: 'Nourriture' },
  { id: 'jouets',      label: 'Jouets' },
  { id: 'hygiene',     label: 'Hygiène' },
  { id: 'sante',       label: 'Santé' },
  { id: 'habitat',     label: 'Habitat' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'livres',      label: 'Livres' },
];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  categories: string[];
  merchant_name?: string;
  product_type?: string;
}

const EMPTY_FORM = { name: '', description: '', price: '', amazon_url: '', image_url: '', categories: [] as string[], product_type: 'accessoires' };

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [preview, setPreview]   = useState('');
  const [filterAffiliate, setFilterAffiliate] = useState('amazon');
  const [filterCat, setFilterCat]             = useState('all');
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [editCats, setEditCats]               = useState<string[]>([]);
  const [editType, setEditType]               = useState('accessoires');
  const [editUrl, setEditUrl]                 = useState('');
  const [editSaving, setEditSaving]           = useState(false);
  const [importing, setImporting]             = useState(false);

  async function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        setError('Le fichier JSON doit contenir un tableau de produits');
        setImporting(false);
        return;
      }

      const result = await fetch('/api/admin/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: data }),
      });

      const response = await result.json();
      if (response.success) {
        setSuccess(`${response.addedCount}/${response.total} produit(s) importé(s) avec succès${response.failedCount > 0 ? ` (${response.failedCount} en erreur)` : ''}${response.removedCount > 0 ? ` · ${response.removedCount} produit(s) retiré(s) (absents du JSON)` : ''}`);
        // Attendre un peu que la DB se synchronise
        setTimeout(() => fetchProducts(), 1000);
      } else {
        setError(response.error || 'Erreur lors de l\'import');
      }
    } catch {
      setError('Erreur lors de la lecture du fichier JSON');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function handleDeleteImportedProducts() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer TOUS les produits importés du JSON? Cette action est irréversible.')) return;

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const result = await fetch('/api/admin/delete-imported-products', {
        method: 'DELETE',
      });

      const data = await result.json();
      if (data.success) {
        setSuccess(`${data.deleted} produit(s) supprimé(s)`);
        setTimeout(() => fetchProducts(), 1000);
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur de connexion lors de la suppression');
    } finally {
      setImporting(false);
    }
  }

  async function fetchProducts(affiliate = filterAffiliate) {
    setLoading(true);
    const src = AFFILIATE_SOURCES.find(s => s.id === affiliate) ?? AFFILIATE_SOURCES[0];
    try {
      const r = await fetch(`/api/admin/products-list?merchant=${encodeURIComponent(src.merchant)}`);
      const data = await r.json();
      setProducts(data.products ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchProducts(filterAffiliate); }, [filterAffiliate]);

  useEffect(() => {
    const m = form.amazon_url.match(/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i);
    if (m) setPreview(`https://www.amazon.fr/dp/${m[1].toUpperCase()}?tag=mespoilus-21`);
    else setPreview('');
  }, [form.amazon_url]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.amazon_url || !form.image_url || !form.price) {
      setError('Remplis tous les champs obligatoires');
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const r = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const data = await r.json();
      if (data.success) {
        setSuccess(`Produit ajoute ! ASIN : ${data.asin}`);
        setForm(EMPTY_FORM); setPreview('');
        fetchProducts();
      } else {
        setError(data.error ?? 'Erreur');
      }
    } catch { setError('Erreur de connexion'); }
    finally { setSaving(false); }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditCats(p.categories.filter(c => c !== 'livres'));
    setEditType(p.product_type || (p.categories.includes('livres') ? 'livres' : 'accessoires'));
    setEditUrl('');
  }

  async function handleSaveEdit(id: string) {
    setEditSaving(true);
    try {
      const r = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          categories: editCats,
          product_type: editType,
          ...(editUrl.trim() ? { amazon_url: editUrl.trim() } : {}),
        }),
      });
      const data = await r.json();
      if (data.success) { setEditingId(null); setEditUrl(''); fetchProducts(); }
    } catch { /* ignore */ }
    finally { setEditSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchProducts();
  }

  function toggleCategory(id: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter(c => c !== id)
        : [...f.categories, id],
    }));
  }

  const activeSrc = AFFILIATE_SOURCES.find(s => s.id === filterAffiliate) ?? AFFILIATE_SOURCES[0];

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Produits affilies</h1>
        <p className="text-gray-500 text-base mt-1">Amazon et CanadaPetCare</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        {AFFILIATE_SOURCES.map(src => {
          const Icon = src.icon;
          return (
            <button
              key={src.id}
              onClick={() => { setFilterAffiliate(src.id); setFilterCat('all'); }}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                filterAffiliate === src.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={15} strokeWidth={1.5} />
              {src.label}
            </button>
          );
        })}
      </div>

      {/* === AMAZON === */}
      {filterAffiliate === 'amazon' && (
        <>
          <div className="card p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Plus size={16} strokeWidth={2} className="text-orange-600" />
                Ajouter un produit Amazon
              </h2>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    disabled={importing}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    {importing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Import en cours
                      </>
                    ) : (
                      <>
                        <Upload size={14} strokeWidth={2} />
                        Importer JSON
                      </>
                    )}
                  </span>
                </label>
                <button
                  onClick={handleDeleteImportedProducts}
                  disabled={importing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? (
                    <>
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Suppression en cours
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} strokeWidth={2} />
                      Supprimer importés
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Nom du produit *</label>
                  <input className="input-dark w-full" placeholder="ex : Croquettes pour chien adulte"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Prix EUR *</label>
                  <input className="input-dark w-full" type="number" step="0.01" min="0" placeholder="ex : 14.99"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">URL Amazon * <span className="text-gray-400">(copie-colle l'URL du produit)</span></label>
                <input className="input-dark w-full" placeholder="https://www.amazon.fr/dp/XXXXXXXXXX"
                  value={form.amazon_url} onChange={e => setForm(f => ({ ...f, amazon_url: e.target.value }))} />
                {preview && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    Lien affilie : <a href={preview} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-xs">{preview}</a>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">URL image * <span className="text-gray-400">(clic droit sur la couverture Amazon)</span></label>
                <input className="input-dark w-full" placeholder="https://m.media-amazon.com/images/I/..."
                  value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-20 object-contain rounded border border-gray-200" />}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description courte</label>
                <textarea className="input-dark w-full resize-none h-16" placeholder="Resumé en 1-2 phrases"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Type de produit *</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, product_type: t.id }))}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                        form.product_type === t.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Categories animales</label>
                <div className="flex flex-wrap gap-1.5">
                  {ANIMAL_CATEGORIES.map(c => (
                    <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                        form.categories.includes(c.id) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{success}</p>}
              <button type="submit" disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {saving
                  ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Ajout en cours</>
                  : <><Plus size={14} strokeWidth={2} />Ajouter le produit</>}
              </button>
            </form>
          </div>

          <ProductList
            products={products}
            loading={loading}
            label={activeSrc.label}
            filterCat={filterCat}
            onFilterCat={setFilterCat}
            onRefresh={() => fetchProducts()}
            renderActions={p => (
              <>
                <button onClick={() => editingId === p.id ? setEditingId(null) : startEdit(p)}
                  className={clsx('transition-colors', editingId === p.id ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500')} title="Modifier">
                  <Pencil size={15} strokeWidth={1.5} />
                </button>
                <a href={p.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" title="Voir">
                  <ExternalLink size={15} strokeWidth={1.5} />
                </a>
                <button onClick={() => handleDelete(p.id, p.name)} className="text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </>
            )}
            renderExpand={p => editingId === p.id ? (
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Type de produit :</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRODUCT_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setEditType(t.id)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                        editType === t.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-gray-700 mb-2">Categories animales :</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ANIMAL_CATEGORIES.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => setEditCats(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                        editCats.includes(c.id) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-gray-700 mb-1">Nouvelle URL Amazon <span className="text-gray-400">(optionnel — laisse vide pour garder l'actuelle ; sera ré-affiliée automatiquement)</span> :</p>
                <input
                  className="input-dark w-full mb-3 text-sm"
                  placeholder="https://www.amazon.fr/dp/XXXXXXXXXX"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                />
                {editUrl.trim() && (() => {
                  const m = editUrl.match(/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i);
                  return m
                    ? <p className="text-xs text-emerald-600 mb-3 truncate">Lien affilié : https://www.amazon.fr/dp/{m[1].toUpperCase()}?tag=mespoilus-21</p>
                    : <p className="text-xs text-red-500 mb-3">ASIN introuvable dans cette URL</p>;
                })()}
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(p.id)} disabled={editSaving}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50">
                    <Check size={13} strokeWidth={2} />{editSaving ? 'Sauvegarde' : 'Enregistrer'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400">
                    <X size={13} strokeWidth={2} />Annuler
                  </button>
                </div>
              </div>
            ) : null}
          />

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
            Mention legale Amazon presente dans le footer · Tag affilie : <strong>mespoilus-21</strong>
          </div>
        </>
      )}

      {/* === CANADAPETCARE === */}
      {filterAffiliate === 'canadapetcare' && (
        <ProductList
          products={products}
          loading={loading}
          label={activeSrc.label}
          filterCat={filterCat}
          onFilterCat={setFilterCat}
          onRefresh={() => fetchProducts()}
          renderActions={p => (
            <>
              <a href={p.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 transition-colors" title="Voir">
                <ExternalLink size={15} strokeWidth={1.5} />
              </a>
              <button onClick={() => handleDelete(p.id, p.name)} className="text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </>
          )}
        />
      )}
    </div>
  );
}

interface ProductListProps {
  products: Product[];
  loading: boolean;
  label: string;
  filterCat: string;
  onFilterCat: (cat: string) => void;
  onRefresh: () => void;
  renderActions: (p: Product) => React.ReactNode;
  renderExpand?: (p: Product) => React.ReactNode;
}

function ProductList({ products, loading, label, filterCat, onFilterCat, onRefresh, renderActions, renderExpand }: ProductListProps) {
  const [search, setSearch] = useState('');
  const filtered = products
    .filter(p => filterCat === 'all' || p.categories.includes(filterCat))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{label} ({products.length})</h2>
        <button onClick={onRefresh} className="text-gray-400 hover:text-gray-700 transition-colors">
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all', label: 'Tous' }, ...ANIMAL_CATEGORIES].map(c => {
            const count = c.id === 'all' ? null : products.filter(p => p.categories.includes(c.id)).length;
            return (
              <button key={c.id} onClick={() => onFilterCat(c.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  filterCat === c.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}>
                {c.label}
                {count !== null && (
                  <span className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    filterCat === c.id ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Aucun produit {label}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-4 p-3">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-10 h-14 object-contain flex-shrink-0 rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {p.categories.filter(c => c !== 'livres').map(c => (
                      <span key={c} className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium capitalize">{c}</span>
                    ))}
                    <span className="text-xs text-gray-400">{p.price.toFixed(2)} {p.currency ?? 'EUR'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">{renderActions(p)}</div>
              </div>
              {renderExpand?.(p)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
