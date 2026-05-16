'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Pencil, Trash2, Upload, X, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  { id: 'chiens',   label: 'Chiens',   color: 'bg-orange-100 text-orange-700' },
  { id: 'chats',    label: 'Chats',    color: 'bg-pink-100 text-pink-700' },
  { id: 'rongeurs', label: 'Rongeurs', color: 'bg-teal-100 text-teal-700' },
  { id: 'oiseaux',  label: 'Oiseaux',  color: 'bg-blue-100 text-blue-700' },
  { id: 'reptiles', label: 'Reptiles', color: 'bg-green-100 text-green-700' },
  { id: 'general',  label: 'Général',  color: 'bg-gray-100 text-gray-700' },
];

interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  pages_count: number;
  active: boolean;
  created_at: string;
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM = {
  title: '', description: '', category: 'chiens', slug: '',
  pages_count: 1, active: true, file_path: '',
};

export default function GuidesAdminPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchGuides(); }, []);

  async function fetchGuides() {
    setLoading(true);
    const res = await fetch('/api/admin/guides');
    const data = await res.json();
    setGuides(data.guides ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setUploadedFile(null);
    setUploadProgress('idle');
    setError('');
    setShowForm(true);
  }

  function openEdit(g: Guide) {
    setEditId(g.id);
    setForm({
      title: g.title, description: g.description, category: g.category,
      slug: g.slug, pages_count: g.pages_count, active: g.active, file_path: g.file_path,
    });
    setUploadedFile(g.file_path);
    setUploadProgress('done');
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setError('');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.category || !form.slug) {
      setError('Remplis la catégorie et le slug avant d\'uploader le fichier.');
      return;
    }
    setUploadProgress('uploading');
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', form.category);
    fd.append('slug', form.slug);
    const res = await fetch('/api/admin/guides/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setUploadProgress('error');
      setError(data.error ?? 'Erreur upload');
      return;
    }
    setUploadProgress('done');
    setUploadedFile(data.file_path);
    setForm(f => ({ ...f, file_path: data.file_path }));
  }

  async function handleSave() {
    if (!form.title || !form.slug || !form.category || !form.file_path) {
      setError('Titre, slug, catégorie et fichier PDF sont obligatoires.');
      return;
    }
    setSaving(true);
    setError('');

    const url = '/api/admin/guides';
    const method = editId ? 'PATCH' : 'POST';
    const body = editId ? { id: editId, ...form } : form;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Erreur lors de la sauvegarde');
      setSaving(false);
      return;
    }
    await fetchGuides();
    setSaving(false);
    closeForm();
  }

  async function handleDelete(g: Guide) {
    if (!confirm(`Supprimer "${g.title}" ? Le fichier PDF sera aussi supprimé.`)) return;
    await fetch('/api/admin/guides', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id }),
    });
    setGuides(prev => prev.filter(x => x.id !== g.id));
  }

  async function toggleActive(g: Guide) {
    const res = await fetch('/api/admin/guides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, active: !g.active }),
    });
    const data = await res.json();
    if (data.guide) {
      setGuides(prev => prev.map(x => x.id === g.id ? data.guide : x));
    }
  }

  const catInfo = (id: string) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES[5];

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Guides & Checklists</h1>
          <p className="text-gray-500 text-base mt-1">{guides.length} guide{guides.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} strokeWidth={1.5} />
          Ajouter un guide
        </button>
      </div>

      {/* Onglets catégorie */}
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', label: 'Tous' }, ...CATEGORIES].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filterCat === cat.id
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
            }`}
          >
            {cat.label}
            {cat.id !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-70">
                {guides.filter(g => g.category === cat.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Formulaire add/edit */}
      {showForm && (
        <div className="card p-6 border-orange-200 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editId ? 'Modifier le guide' : 'Nouveau guide'}</h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Titre */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
              <input
                className="input-dark"
                placeholder="Guide complet : alimentation du chien adulte"
                value={form.title}
                onChange={e => {
                  const t = e.target.value;
                  setForm(f => ({ ...f, title: t, slug: editId ? f.slug : slugify(t) }));
                }}
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                className="input-dark"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug * <span className="text-gray-400 font-normal">(nom du fichier PDF)</span></label>
              <input
                className="input-dark font-mono text-xs"
                placeholder="alimentation-chien-adulte"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-dark resize-none h-20"
                placeholder="Tout ce qu'il faut savoir pour nourrir son chien correctement selon son âge, son poids et son activité."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Pages */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de pages</label>
              <input
                type="number" min={1} max={200}
                className="input-dark"
                value={form.pages_count}
                onChange={e => setForm(f => ({ ...f, pages_count: parseInt(e.target.value) || 1 }))}
              />
            </div>

            {/* Actif */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-orange-600"
                />
                <span className="text-sm text-gray-700">Visible sur le site public</span>
              </label>
            </div>

            {/* Upload PDF */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Fichier PDF *</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadProgress === 'uploading'}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  <Upload size={15} strokeWidth={1.5} />
                  {uploadProgress === 'uploading' ? 'Upload en cours…' : 'Choisir un PDF'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {uploadProgress === 'done' && uploadedFile && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <Check size={13} strokeWidth={2} />
                    {uploadedFile}
                  </span>
                )}
                {uploadProgress === 'error' && (
                  <span className="text-xs text-red-600">Échec de l'upload</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Max 20 Mo. Le fichier sera stocké dans <code className="bg-gray-100 px-1 rounded">pdf-guides/{form.category || 'catégorie'}/{form.slug || 'slug'}.pdf</code></p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</>
              ) : (
                <><Check size={15} strokeWidth={2} />{editId ? 'Mettre à jour' : 'Créer le guide'}</>
              )}
            </button>
            <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des guides */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : guides.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText size={32} strokeWidth={1} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun guide pour le moment.</p>
            <button onClick={openAdd} className="mt-3 text-sm text-orange-600 hover:underline">Ajouter le premier guide →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-widest">
                <th className="text-left px-5 py-3 font-semibold">Guide</th>
                <th className="text-left px-3 py-3 font-semibold">Catégorie</th>
                <th className="text-left px-3 py-3 font-semibold">Pages</th>
                <th className="text-left px-3 py-3 font-semibold">Fichier</th>
                <th className="text-center px-3 py-3 font-semibold">Actif</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guides.filter(g => filterCat === 'all' || g.category === filterCat).map((g, i) => {
                const cat = catInfo(g.category);
                return (
                  <tr key={g.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i === guides.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{g.title}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{g.slug}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cat.color}`}>{cat.label}</span>
                    </td>
                    <td className="px-3 py-4 text-gray-600">{g.pages_count}p</td>
                    <td className="px-3 py-4">
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdf-guides/${g.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-orange-600 hover:underline"
                      >
                        <ExternalLink size={11} strokeWidth={1.5} />
                        Ouvrir PDF
                      </a>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => toggleActive(g)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                          g.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                        title={g.active ? 'Cliquer pour masquer' : 'Cliquer pour activer'}
                      >
                        {g.active ? <Eye size={11} strokeWidth={1.5} /> : <EyeOff size={11} strokeWidth={1.5} />}
                        {g.active ? 'Visible' : 'Masqué'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <a
                          href={`/guides/${g.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir la page publique"
                        >
                          <ExternalLink size={15} strokeWidth={1.5} />
                        </a>
                        <button
                          onClick={() => openEdit(g)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={15} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(g)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Les guides actifs sont visibles sur <a href="/guides" target="_blank" className="text-orange-500 hover:underline">/guides</a>. Le téléchargement nécessite un email (token 24h, RGPD).
      </p>
    </div>
  );
}
