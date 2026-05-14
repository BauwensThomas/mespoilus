'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

const ANIMAL_CATEGORIES = [
  { id: 'chiens',   label: 'Chiens' },
  { id: 'chats',    label: 'Chats' },
  { id: 'oiseaux',  label: 'Oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs' },
  { id: 'reptiles', label: 'Reptiles' },
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
}

const EMPTY_FORM = { name: '', description: '', price: '', amazon_url: '', image_url: '', categories: [] as string[] };

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('');

  async function fetchProducts() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/products-list');
      const data = await r.json();
      setProducts(data.products ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchProducts(); }, []);

  // Générer le lien affilié en temps réel depuis l'URL collée
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
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const data = await r.json();
      if (data.success) {
        setSuccess(`Livre ajouté ! ASIN : ${data.asin}`);
        setForm(EMPTY_FORM);
        setPreview('');
        fetchProducts();
      } else {
        setError(data.error ?? 'Erreur');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <BookOpen size={20} strokeWidth={1.5} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livres Amazon</h1>
          <p className="text-sm text-gray-500">Tag affilié : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-orange-600 text-xs">mespoilus-21</code></p>
        </div>
      </div>

      {/* Formulaire ajout */}
      <div className="card p-6 border border-orange-200">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={16} strokeWidth={2} className="text-orange-600" />
          Ajouter un livre
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Titre du livre *</label>
              <input
                className="input-dark w-full"
                placeholder="ex : Mon chien, mon meilleur ami"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Prix € *</label>
              <input
                className="input-dark w-full"
                type="number"
                step="0.01"
                min="0"
                placeholder="ex : 14.99"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">URL Amazon * <span className="text-gray-400">(copie-colle l'URL du produit)</span></label>
            <input
              className="input-dark w-full"
              placeholder="https://www.amazon.fr/dp/XXXXXXXXXX"
              value={form.amazon_url}
              onChange={e => setForm(f => ({ ...f, amazon_url: e.target.value }))}
            />
            {preview && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                ✓ Lien affilié : <a href={preview} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-xs">{preview}</a>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">URL image * <span className="text-gray-400">(clic droit sur la couverture Amazon → Copier l'adresse de l'image)</span></label>
            <input
              className="input-dark w-full"
              placeholder="https://m.media-amazon.com/images/I/..."
              value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            />
            {form.image_url && (
              <img src={form.image_url} alt="" className="mt-2 h-20 object-contain rounded border border-gray-200" />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Description courte</label>
            <textarea
              className="input-dark w-full resize-none h-16"
              placeholder="Résumé du livre en 1-2 phrases"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Catégories animales <span className="text-gray-400">(en plus de Livres, toujours ajouté)</span></label>
            <div className="flex flex-wrap gap-2">
              {ANIMAL_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={clsx(
                    'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                    form.categories.includes(c.id)
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">✓ {success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving
              ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Ajout en cours…</>
              : <><Plus size={14} strokeWidth={2} />Ajouter le livre</>
            }
          </button>
        </form>
      </div>

      {/* Liste livres existants */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Livres Amazon ({products.length})
          </h2>
          <button onClick={fetchProducts} className="text-gray-400 hover:text-gray-700 transition-colors">
            <RefreshCw size={16} strokeWidth={1.5} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Chargement…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Aucun livre Amazon ajouté</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-10 h-14 object-contain flex-shrink-0 rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.price.toFixed(2)} € · {p.categories.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={p.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                    title="Voir sur Amazon"
                  >
                    <ExternalLink size={15} strokeWidth={1.5} />
                  </a>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Mention légale obligatoire Amazon</p>
        <p>La phrase <em>"En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises."</em> doit apparaître sur le site. Pense à l'ajouter dans le footer.</p>
      </div>
    </div>
  );
}
