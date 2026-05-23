'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Upload, X, ExternalLink, RefreshCw, Check, Image, ChevronUp, Search } from 'lucide-react';
import clsx from 'clsx';
import { getFlagUrl } from '@/lib/partenaires';

const EMOJI_CATEGORIES = [
  {
    label: 'Animaux',
    emojis: ['🐾','🐕','🐈','🐠','🐹','🦜','🦎','🐇','🐢','🐓','🦔','🦦','🦊','🐺','🐻','🐼','🐨','🦁','🐯','🐮','🐷','🐸','🐭','🐱','🐶','🦝','🦡','🦭','🐦','🦅','🦉','🦚','🦩','🐍','🦖','🐊','🐿️','🦫','🐋','🦈','🐬','🐙'],
  },
  {
    label: 'Nutrition',
    emojis: ['🍗','🥩','🦴','🐟','🥗','🌿','🥕','🍎','🫐','🥦','🫛','🌾','🍖','🧆','🐄','🌽','🥣','🍱'],
  },
  {
    label: 'Santé',
    emojis: ['💊','💉','🩺','🏥','❤️','💙','💚','💛','🌡️','🩹','🔬','🧬','🧪','⚕️','🩻','🫀','🧠'],
  },
  {
    label: 'Boutique',
    emojis: ['🛒','📦','🎁','⭐','🏷️','💰','🛍️','🏪','💳','🎀','🪮','✂️','🪣','🧴','🧼','🪥','🛁'],
  },
  {
    label: 'Divers',
    emojis: ['✅','⚡','🔥','💎','🌟','🏆','🎯','🌈','🎉','🔑','🏠','🌍','🌐','📍','🗺️','🚚','📬','🤝'],
  },
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-16 h-16 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-4xl hover:border-orange-400 transition-colors flex-shrink-0"
      >
        {value}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72">
          {/* Onglets catégories */}
          <div className="flex border-b border-gray-100 px-1 pt-1 gap-0.5">
            {EMOJI_CATEGORIES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCat(i)}
                className={clsx('px-2 py-1.5 text-[10px] font-medium rounded-t-lg transition-colors whitespace-nowrap', cat === i ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700')}
              >
                {c.label}
              </button>
            ))}
          </div>
          {/* Grille */}
          <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[cat].emojis.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => { onChange(e); setOpen(false); }}
                className={clsx('w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-orange-50 transition-colors', value === e && 'bg-orange-100')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Partenaire {
  id: string;
  nom: string;
  description: string | null;
  logo_url: string | null;
  logo_urls: string[];
  url: string | null;
  urls_by_country: Record<string, string> | null;
  tag: string | null;
  tag_bg: string;
  tag_text: string;
  pour: string | null;
  emoji: string;
  pays: string[];
  network: string;
  recommend: boolean;
  in_bandeau: boolean;
  display_mode: string;
  flag_position: string;
  link_position: string;
  actif: boolean;
  ordre: number;
}

const PAYS_OPTIONS = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'États-Unis' },
  { code: 'MA', label: 'Maroc' },
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: "Côte d'Ivoire" },
];

const EMPTY_FORM = {
  nom: '',
  description: '',
  logo_url: '',
  logo_urls: [''] as string[],
  url: '',
  urls_by_country: {} as Record<string, string>,
  tag: '',
  tag_bg: '#f3f4f6',
  tag_text: '#374151',
  pour: '',
  emoji: '🐾',
  pays: [] as string[],
  network: 'awin',
  recommend: true,
  in_bandeau: true,
  display_mode: 'card' as 'card' | 'image',
  flag_position: 'bottom-left' as string,
  link_position: 'bottom-right' as string,
  actif: true,
};

export default function PartenairesAdminPage() {
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url' | 'emoji'>('file');
  const [linkMode, setLinkMode] = useState<'single' | 'by_country'>('single');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRefMulti = useRef<HTMLInputElement>(null);
  const pendingUploadIdx = useRef(0);
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/partenaires');
    const data = await res.json();
    setPartenaires(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setLinkMode('single');
    setLocalPreview(null);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function openEdit(p: Partenaire) {
    setEditId(p.id);
    const hasByCountry = !!p.urls_by_country && Object.keys(p.urls_by_country).length > 0;
    setLinkMode(hasByCountry ? 'by_country' : 'single');
    setLocalPreview(null);
    setForm({
      nom: p.nom,
      description: p.description ?? '',
      logo_url: p.logo_url ?? '',
      logo_urls: p.logo_urls?.length ? p.logo_urls : (p.logo_url ? [p.logo_url] : ['']),
      url: p.url ?? '',
      urls_by_country: p.urls_by_country ?? {},
      tag: p.tag ?? '',
      tag_bg: p.tag_bg,
      tag_text: p.tag_text,
      pour: p.pour ?? '',
      emoji: p.emoji,
      pays: p.pays ?? [],
      network: p.network,
      recommend: p.recommend,
      in_bandeau: p.in_bandeau,
      display_mode: (p.display_mode ?? 'card') as 'card' | 'image',
      flag_position: p.flag_position ?? 'bottom-left',
      link_position: p.link_position ?? 'bottom-right',
      actif: p.actif,
    });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  async function uploadLogo(file: File) {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = e => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'card');
    const res = await fetch('/api/admin/partenaires/upload-logo', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      setForm(f => ({ ...f, logo_url: data.url }));
      setLocalPreview(null);
    } else {
      setUploadError(data.error ?? 'Erreur upload - vérifie que le bucket "partner-logos" existe dans Supabase Storage (public)');
    }
  }

  async function uploadImageAtIndex(file: File) {
    setUploadError(null);
    setUploading(true);
    const idx = pendingUploadIdx.current;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'image');
    const res = await fetch('/api/admin/partenaires/upload-logo', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      setForm(f => {
        const urls = [...f.logo_urls];
        urls[idx] = data.url;
        return { ...f, logo_urls: urls };
      });
    } else {
      setUploadError(data.error ?? 'Erreur upload - vérifie que le bucket "partner-logos" existe dans Supabase Storage (public)');
    }
  }

  async function save() {
    setSaving(true);
    const imgMode = form.display_mode === 'image';
    const cleanLogoUrls = form.logo_urls.filter(u => u.trim());
    const payload = {
      ...form,
      logo_url: imgMode ? (cleanLogoUrls[0] ?? null) : (form.logo_url || null),
      logo_urls: imgMode ? cleanLogoUrls : [],
      url: linkMode === 'single' ? form.url || null : null,
      urls_by_country: linkMode === 'by_country'
        ? Object.fromEntries(Object.entries(form.urls_by_country).filter(([, v]) => v.trim()))
        : null,
    };
    if (editId) {
      await fetch('/api/admin/partenaires', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...payload }) });
      setSavedId(editId);
      setTimeout(() => setSavedId(null), 2000);
    } else {
      await fetch('/api/admin/partenaires', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setSaving(false);
    closeForm();
    load();
  }

  async function remove(id: string) {
    await fetch('/api/admin/partenaires', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setDeleteConfirm(null);
    load();
  }

  async function toggleActif(p: Partenaire) {
    await fetch('/api/admin/partenaires', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, actif: !p.actif }) });
    load();
  }

  function togglePays(code: string) {
    setForm(f => ({
      ...f,
      pays: f.pays.includes(code) ? f.pays.filter(c => c !== code) : [...f.pays, code],
    }));
  }

  const isImageMode = form.display_mode === 'image';

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Partenaires</h1>
          <p className="text-gray-500 text-base mt-1">Cartes "Nos recommandations" et bandeau sticky</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={showForm ? closeForm : openAdd}
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors',
              showForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-orange-600 text-white hover:bg-orange-500'
            )}
          >
            {showForm ? <><X size={15} strokeWidth={2} /> Annuler</> : <><Plus size={15} strokeWidth={2} /> Ajouter un partenaire</>}
          </button>
        </div>
      </div>

      {/* Formulaire card (add / edit) */}
      {showForm && (
        <div ref={formRef} className="flex gap-6 items-start">
        <div className="flex-1 bg-white border border-orange-200 rounded-xl p-6 space-y-5 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            {editId ? <><ChevronUp size={16} className="text-orange-500" /> Modifier le partenaire</> : <><Plus size={16} strokeWidth={2} className="text-orange-500" /> Nouveau partenaire</>}
          </h2>

          {/* Style de carte */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Style de carte</label>
            <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, display_mode: 'card' }))}
                className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', !isImageMode ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}
              >
                Carte standard
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, display_mode: 'image' }))}
                className={clsx('flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors', isImageMode ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}
              >
                <Image size={12} /> Image pleine
              </button>
            </div>
            {isImageMode && (
              <div className="mt-3 space-y-4">
                <p className="text-xs text-gray-600">L'image remplit tout le cadre. Positionnez le drapeau et "Découvrir" indépendamment.</p>
                {/* Pickers de position */}
                <div className="flex gap-6 items-start">
                  {([
                    { label: 'Position du drapeau', field: 'flag_position' as const },
                    { label: 'Position de "Découvrir"', field: 'link_position' as const },
                  ] as { label: string; field: 'flag_position' | 'link_position' }[]).map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">{label}</label>
                      <div className="grid grid-cols-2 gap-1.5 w-fit">
                        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => {
                          const isSelected = form[field] === pos;
                          const isTop = pos.startsWith('top');
                          const isLeft = pos.endsWith('left');
                          return (
                            <button key={pos} type="button" onClick={() => setForm(f => ({ ...f, [field]: pos }))}
                              className={clsx('w-16 h-11 rounded-lg border relative overflow-hidden transition-colors', isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300')}
                            >
                              <div className="absolute inset-0 bg-gray-200/50 rounded" />
                              <div className={clsx('absolute w-3.5 h-2 rounded-[2px]', isSelected ? 'bg-orange-500' : 'bg-gray-400', isTop ? 'top-1.5' : 'bottom-1.5', isLeft ? 'left-1.5' : 'right-1.5')} />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{
                        form[field] === 'top-left' ? 'Haut gauche' :
                        form[field] === 'top-right' ? 'Haut droite' :
                        form[field] === 'bottom-left' ? 'Bas gauche' : 'Bas droite'
                      }</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Nom *</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="ex: Dogfy Diet" />
          </div>

          {/* Lien(s) affilié(s) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Lien(s) affilié(s)</label>
              <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                <button type="button" onClick={() => setLinkMode('single')}
                  className={clsx('px-2.5 py-1 text-xs font-medium rounded-md transition-colors', linkMode === 'single' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                  Lien unique
                </button>
                <button type="button" onClick={() => setLinkMode('by_country')}
                  className={clsx('px-2.5 py-1 text-xs font-medium rounded-md transition-colors', linkMode === 'by_country' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                  Par pays
                </button>
              </div>
            </div>

            {linkMode === 'single' ? (
              <div className="relative">
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-orange-400" placeholder="https://..." />
                {form.url && <a href={form.url} target="_blank" rel="noopener noreferrer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"><ExternalLink size={13} /></a>}
              </div>
            ) : (
              <div className="space-y-2">
                {form.pays.length === 0 && (
                  <p className="text-xs text-gray-400 py-2">Sélectionnez d'abord les pays disponibles ci-dessous.</p>
                )}
                {form.pays.map(code => (
                  <div key={code} className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFlagUrl(code)} alt={code} style={{ width: '22px', height: '16px', objectFit: 'cover' }} className="rounded-[2px] border border-gray-200 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-600 w-6 flex-shrink-0">{code}</span>
                    <div className="relative flex-1">
                      <input
                        value={form.urls_by_country[code] ?? ''}
                        onChange={e => setForm(f => ({ ...f, urls_by_country: { ...f.urls_by_country, [code]: e.target.value } }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-orange-400"
                        placeholder={`Lien affilié pour ${code}...`}
                      />
                      {form.urls_by_country[code] && (
                        <a href={form.urls_by_country[code]} target="_blank" rel="noopener noreferrer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images (mode image) ou Logo/Emoji (carte standard) */}
          {isImageMode ? (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Images (cycle auto toutes les 15s - max 5)</label>
              <div className="space-y-2">
                {form.logo_urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                      {url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={url} alt="" className="w-full h-full object-cover" />
                        : <Image size={14} className="text-gray-300" />
                      }
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={url}
                        onChange={e => setForm(f => {
                          const urls = [...f.logo_urls];
                          urls[i] = e.target.value;
                          return { ...f, logo_urls: urls };
                        })}
                        placeholder="https://... ou uploader"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-orange-400"
                      />
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { pendingUploadIdx.current = i; fileRefMulti.current?.click(); }}
                      disabled={uploading}
                      className="flex items-center gap-1 text-xs px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 flex-shrink-0"
                      title="Uploader une image"
                    >
                      {uploading && pendingUploadIdx.current === i
                        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <Upload size={12} />
                      }
                    </button>
                    {form.logo_urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logo_urls: f.logo_urls.filter((_, j) => j !== i) }))}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {form.logo_urls.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, logo_urls: [...f.logo_urls, ''] }))}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-500 font-medium py-1"
                  >
                    <Plus size={13} /> Ajouter une image
                  </button>
                )}
              </div>
              {uploadError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{uploadError}</p>}
              <input ref={fileRefMulti} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadImageAtIndex(e.target.files[0]); e.target.value = ''; }} />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Logo ou emoji</label>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-3">
                <button type="button" onClick={() => setImageInputMode('file')}
                  className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors', imageInputMode === 'file' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                  <Upload size={11} /> Uploader
                </button>
                <button type="button" onClick={() => setImageInputMode('url')}
                  className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors', imageInputMode === 'url' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                  <ExternalLink size={11} /> URL directe
                </button>
                <button type="button" onClick={() => { setImageInputMode('emoji'); setForm(f => ({ ...f, logo_url: '' })); setLocalPreview(null); }}
                  className={clsx('text-xs px-3 py-1.5 rounded-md font-medium transition-colors', imageInputMode === 'emoji' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}>
                  Emoji
                </button>
              </div>
              {imageInputMode === 'emoji' ? (
                <div className="flex items-center gap-4">
                  <EmojiPicker value={form.emoji} onChange={emoji => setForm(f => ({ ...f, emoji }))} />
                  <p className="text-xs text-gray-500">Cliquez sur l'emoji pour ouvrir le sélecteur</p>
                </div>
              ) : imageInputMode === 'url' ? (
                <div className="flex items-center gap-2">
                  <input type="url" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                  {form.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logo_url} alt="" className="h-10 w-20 object-contain rounded border border-gray-200 flex-shrink-0" />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-28 h-14 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {(localPreview || form.logo_url)
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={localPreview ?? form.logo_url!} alt="Logo" className="w-full h-full object-contain p-1" />
                      : <span className="text-2xl">{form.emoji}</span>
                    }
                  </div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50">
                    {uploading ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Envoi...</> : <><Upload size={12} /> Choisir</>}
                  </button>
                  {(form.logo_url || localPreview) && (
                    <button onClick={() => { setForm(f => ({ ...f, logo_url: '' })); setLocalPreview(null); }} className="text-xs text-red-500 hover:underline">Supprimer</button>
                  )}
                </div>
              )}
              {uploadError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{uploadError}</p>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]); e.target.value = ''; }} />
            </div>
          )}

          {/* Description + Pour - carte standard */}
          {!isImageMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" placeholder="Description affichée sur la carte..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Pour (sous-titre)</label>
                <input value={form.pour} onChange={e => setForm(f => ({ ...f, pour: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="ex: Pour les chiens" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tag (label coloré)</label>
                <div className="flex items-center gap-2">
                  <input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="ex: Nutrition fraîche" />
                  <input type="color" value={form.tag_bg} onChange={e => setForm(f => ({ ...f, tag_bg: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Couleur fond" />
                  <input type="color" value={form.tag_text} onChange={e => setForm(f => ({ ...f, tag_text: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Couleur texte" />
                  {form.tag && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: form.tag_bg, color: form.tag_text }}>{form.tag}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Pays */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Pays disponibles</label>
            <div className="flex flex-wrap gap-1.5">
              {PAYS_OPTIONS.map(p => (
                <button key={p.code} type="button" onClick={() => togglePays(p.code)}
                  className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors', form.pays.includes(p.code) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300')}
                >
                  {p.code} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Affichage carte */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-gray-700">Section "Nos recommandations"</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Afficher cette carte sur la page d'accueil</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.recommend} onChange={e => setForm(f => ({ ...f, recommend: e.target.checked }))} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Séparateur Bandeau */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Bandeau du haut</p>

            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-700">Afficher dans le bandeau sticky</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Bandeau visible sur toutes les pages publiques</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.in_bandeau} onChange={e => setForm(f => ({ ...f, in_bandeau: e.target.checked }))} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>

            {form.in_bandeau && (
              <div className="space-y-3">
                {/* Champs bandeau - uniquement en mode image (en mode carte ils sont déjà remplis au-dessus) */}
                {isImageMode && (
                  <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Contenu du bandeau</p>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Texte affiché dans le bandeau</label>
                      <input
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                        placeholder="ex: Repas naturels livrés chez vous"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Tag (label coloré)</label>
                      <div className="flex items-center gap-2">
                        <input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="ex: Nutrition fraîche" />
                        <input type="color" value={form.tag_bg} onChange={e => setForm(f => ({ ...f, tag_bg: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Couleur fond" />
                        <input type="color" value={form.tag_text} onChange={e => setForm(f => ({ ...f, tag_text: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Couleur texte" />
                        {form.tag && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: form.tag_bg, color: form.tag_text }}>{form.tag}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aperçu live */}
                <div className="border border-dashed border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">Aperçu bandeau</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 overflow-hidden">
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold shrink-0">Partenaire</span>
                    <span className="w-px h-3 bg-gray-200 shrink-0" />
                    {form.logo_url && !isImageMode
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.logo_url} alt="" className="h-4 object-contain shrink-0" />
                      : <span className="font-bold text-gray-900 shrink-0">{form.nom || 'Nom du partenaire'}</span>
                    }
                    {form.pays.map(code => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={code} src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt={code} style={{ width: '16px', height: '12px', objectFit: 'cover' }} className="rounded-[2px] border border-gray-200 shrink-0" />
                    ))}
                    {form.tag && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ backgroundColor: form.tag_bg, color: form.tag_text }}>{form.tag}</span>
                    )}
                    {form.description && (
                      <span className="text-gray-400 truncate">{form.description}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actif */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-gray-700">Actif</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Désactiver pour masquer partout sans supprimer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving || !form.nom} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-40 font-medium">
              <Check size={13} strokeWidth={2} />
              {saving ? 'Sauvegarde...' : editId ? 'Enregistrer' : 'Ajouter le partenaire'}
            </button>
            <button onClick={closeForm} className="p-2 text-gray-400 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors">
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Colonne aperçu - sticky à droite */}
        <div className="sticky top-6 w-72 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Aperçu carte</p>
          {isImageMode ? (
            <div className="space-y-3">
              {(() => {
                const CORNER: Record<string, string> = { 'top-left': 'top-2 left-2', 'top-right': 'top-2 right-2', 'bottom-left': 'bottom-2 left-2', 'bottom-right': 'bottom-2 right-2' };
                const flagCls = CORNER[form.flag_position] ?? 'bottom-2 left-2';
                const linkCls = CORNER[form.link_position] ?? 'bottom-2 right-2';
                const imgs = form.logo_urls.filter(u => u.trim());
                const toShow = imgs.length > 0 ? imgs : [''];
                return toShow.map((imgUrl, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl w-full bg-gray-100 shadow-sm" style={{ aspectRatio: '4/3' }}>
                    {imgUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-fill" />
                      : <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">Image {i + 1}</div>
                    }
                    <div className={`absolute ${flagCls} flex gap-1`}>
                      {form.pays.map(code => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={code} src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt={code} style={{ width: '16px', height: '12px', objectFit: 'cover' }} className="rounded-[2px] border border-white/40 drop-shadow" />
                      ))}
                      {form.pays.length === 0 && <span className="text-white/40 text-[9px] bg-black/20 px-1 rounded">🏳</span>}
                    </div>
                    <div className={`absolute ${linkCls}`}>
                      <span className="flex items-center gap-1 text-white text-[10px] font-semibold bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-md drop-shadow">
                        Découvrir <ExternalLink size={9} strokeWidth={2} />
                      </span>
                    </div>
                    {toShow.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        {i + 1}/{toShow.length}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {(localPreview || form.logo_url)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={localPreview ?? form.logo_url!} alt="" className="h-8 max-w-[100px] object-contain" />
                    : <span className="text-2xl">{form.emoji}</span>
                  }
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{form.nom || 'Nom du partenaire'}</p>
                      {form.pays.map(code => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={code} src={getFlagUrl(code)} alt={code} style={{ width: '16px', height: '12px', objectFit: 'cover' }} className="rounded-[2px] border border-gray-200 inline-block" />
                      ))}
                    </div>
                    {form.pour && <p className="text-xs text-gray-400">{form.pour}</p>}
                  </div>
                </div>
                {form.tag && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: form.tag_bg, color: form.tag_text }}>{form.tag}</span>}
              </div>
              {form.description && <p className="text-xs text-gray-500 leading-relaxed">{form.description}</p>}
              <div className="mt-auto text-center text-xs font-semibold bg-orange-700 text-white rounded-xl py-2">
                Découvrir {form.nom || ''}
              </div>
            </div>
          )}
        </div>

        </div>
      )}

      {/* Recherche + stats */}
      {!loading && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un partenaire..."
              className="pl-8 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 w-64"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <span className="text-sm text-gray-500">{partenaires.length} partenaire{partenaires.length !== 1 ? 's' : ''}</span>
          <span className="text-emerald-600 text-sm font-medium">{partenaires.filter(p => p.actif).length} actifs</span>
          {partenaires.filter(p => !p.actif).length > 0 && (
            <span className="text-red-500 text-sm font-medium">{partenaires.filter(p => !p.actif).length} inactifs</span>
          )}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Chargement...</p>
      ) : partenaires.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Aucun partenaire. Cliquez sur "+ Ajouter" pour commencer.</p>
      ) : (
        <div className="space-y-2">
          {partenaires.filter(p => !search || [p.nom, p.tag, p.pour, p.description].some(v => v?.toLowerCase().includes(search.toLowerCase()))).map(p => (
            <div key={p.id} className={clsx('bg-white border rounded-xl overflow-hidden', p.actif ? 'border-gray-200' : 'border-gray-100 opacity-60')}>
              <div className="flex items-center gap-4 p-3">

                {/* Aperçu */}
                <div className={clsx('flex-shrink-0 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50',
                  p.display_mode === 'image' ? 'w-16 h-16 border-gray-100' : 'w-20 h-12 border-gray-100'
                )}>
                  {p.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.logo_url} alt={p.nom} className={clsx('w-full h-full', p.display_mode === 'image' ? 'object-cover' : 'object-contain p-1')} />
                    : <span className="text-xl">{p.emoji}</span>
                  }
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{p.nom}</span>
                    {p.tag && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: p.tag_bg, color: p.tag_text }}>{p.tag}</span>
                    )}
                    {!p.actif && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactif</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.pour}{p.pour && p.pays?.length ? ' · ' : ''}{(p.pays ?? []).join(', ')}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-end gap-1 mr-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.display_mode === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.display_mode === 'image' ? 'Image pleine' : 'Carte standard'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.recommend ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      Accueil : {p.recommend ? 'affiché' : 'non affiché'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.in_bandeau ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      Bandeau : {p.in_bandeau ? 'affiché' : 'non affiché'}
                    </span>
                  </div>
                  {savedId === p.id && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check size={13} strokeWidth={2} /> Sauvegardé
                    </span>
                  )}
                  <button
                    onClick={() => toggleActif(p)}
                    className={clsx('text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors', p.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200')}
                  >
                    {p.actif ? 'Actif' : 'Inactif'}
                  </button>
                  <button
                    onClick={() => editId === p.id && showForm ? closeForm() : openEdit(p)}
                    className={clsx('text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1',
                      editId === p.id && showForm ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    )}
                  >
                    {editId === p.id && showForm ? <><X size={12} /> Fermer</> : 'Modifier'}
                  </button>
                  {deleteConfirm === p.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => remove(p.id)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-500 transition-colors">Confirmer</button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={13} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
