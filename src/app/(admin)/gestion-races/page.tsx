'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { RefreshCw, Check, X, ImageOff, Upload, Link, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const ANIMAL_TABS = [
  { id: 'all',     label: 'Tous',     emoji: '🐾' },
  { id: 'chien',   label: 'Chiens',   emoji: '🐕' },
  { id: 'chat',    label: 'Chats',    emoji: '🐈' },
  { id: 'oiseau',  label: 'Oiseaux',  emoji: '🦜' },
  { id: 'rongeur', label: 'Rongeurs', emoji: '🐹' },
  { id: 'reptile', label: 'Reptiles', emoji: '🦎' },
];

const ANIMAL_LABEL: Record<string, string> = {
  chien: 'Chien', chat: 'Chat', oiseau: 'Oiseau', rongeur: 'Rongeur', reptile: 'Reptile',
};

interface Breed {
  id: string;
  name: string;
  slug: string;
  animal: string;
  photo_url: string | null;
  status: string;
}

export default function AdminRacesPage() {
  const [filter, setFilter] = useState('all');
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBreeds = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/breeds');
      const data = await r.json();
      setBreeds(data.breeds ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBreeds(); }, [fetchBreeds]);

  function startEdit(b: Breed) {
    setEditingId(b.id);
    setEditUrl(b.photo_url ?? '');
    setPreviewSrc(null);
    setHasFile(false);
    setUploadMode('file');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHasFile(true);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveByUpload(id: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('breedId', id);
      const r = await fetch('/api/admin/breed-photo-upload', { method: 'POST', body: form });
      const data = await r.json();
      if (data.success) {
        setSavedId(id);
        setTimeout(() => setSavedId(null), 2000);
        setBreeds(prev => prev.map(b => b.id === id ? { ...b, photo_url: data.url } : b));
        cancelEdit();
        window.dispatchEvent(new Event('breed-photo-updated'));
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function saveByUrl(id: string) {
    if (!editUrl.trim()) return;
    setSaving(true);
    try {
      const r = await fetch('/api/admin/breed-photo-upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breedId: id, url: editUrl.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        setSavedId(id);
        setTimeout(() => setSavedId(null), 2000);
        setBreeds(prev => prev.map(b => b.id === id ? { ...b, photo_url: data.url } : b));
        cancelEdit();
        window.dispatchEvent(new Event('breed-photo-updated'));
      } else {
        alert(data.error ?? 'Erreur lors du téléchargement');
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function deletePhoto(id: string) {
    setDeletingId(id);
    try {
      await fetch('/api/admin/breeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, photo_url: null }),
      });
      setBreeds(prev => prev.map(b => b.id === id ? { ...b, photo_url: null } : b));
      window.dispatchEvent(new Event('breed-photo-updated'));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  function handleSave(id: string) {
    if (uploadMode === 'file') saveByUpload(id);
    else saveByUrl(id);
  }

  function cancelEdit() {
    setEditingId(null);
    setPreviewSrc(null);
    setEditUrl('');
    setHasFile(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const displayed = filter === 'all' ? breeds : breeds.filter(b => b.animal === filter);
  const withPhoto = displayed.filter(b => b.photo_url).length;
  const withoutPhoto = displayed.length - withPhoto;

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fiches races</h1>
          <p className="text-gray-500 text-base mt-1">Photos stockées dans Supabase Storage</p>
        </div>
        <button onClick={fetchBreeds} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Onglets filtres */}
      <div className="flex flex-wrap gap-2">
        {ANIMAL_TABS.map(tab => {
          const noPhoto = tab.id === 'all'
            ? breeds.filter(b => !b.photo_url).length
            : breeds.filter(b => b.animal === tab.id && !b.photo_url).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                filter === tab.id
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
              )}
            >
                {tab.label}
              {noPhoto > 0 && (
                <span className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                )}>
                  {noPhoto}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{displayed.length} races</span>
          <span className="text-emerald-600 font-medium">{withPhoto} avec photo</span>
          {withoutPhoto > 0 && <span className="text-red-500 font-medium">{withoutPhoto} sans photo</span>}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Chargement…</p>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Aucune race publiée.</p>
      ) : (
        <div className="space-y-2">
          {displayed.map(b => (
            <div
              key={b.id}
              className={clsx(
                'bg-white border rounded-xl overflow-hidden',
                b.photo_url ? 'border-gray-200' : 'border-red-200 bg-red-50/30'
              )}
            >
              <div className="flex items-center gap-4 p-3">

                {/* Miniature */}
                <div className={clsx(
                  'relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border flex items-center justify-center',
                  b.photo_url ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-200'
                )}>
                  {b.photo_url ? (
                    <Image src={b.photo_url} alt={b.name} fill className="object-cover" sizes="56px" unoptimized />
                  ) : (
                    <ImageOff size={18} strokeWidth={1.5} className="text-red-300" />
                  )}
                </div>

                {/* Nom + animal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {ANIMAL_LABEL[b.animal] ?? b.animal}
                    </span>
                  </div>
                  {b.photo_url ? (
                    <p className="text-xs text-emerald-600 mt-0.5">Supabase Storage ✓</p>
                  ) : (
                    <p className="text-xs text-red-400 mt-0.5 font-medium">Pas de photo</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {savedId === b.id && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check size={13} strokeWidth={2} /> Sauvegardé
                    </span>
                  )}

                  {/* Supprimer photo */}
                  {b.photo_url && editingId !== b.id && savedId !== b.id && (
                    <button
                      onClick={() => deletePhoto(b.id)}
                      disabled={deletingId === b.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Supprimer la photo"
                    >
                      {deletingId === b.id
                        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                        : <Trash2 size={14} strokeWidth={1.5} />
                      }
                    </button>
                  )}

                  {/* Ajouter / Modifier */}
                  {savedId !== b.id && (
                    <button
                      onClick={() => editingId === b.id ? cancelEdit() : startEdit(b)}
                      className={clsx(
                        'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                        editingId === b.id
                          ? 'bg-gray-100 text-gray-600 border-gray-300'
                          : b.photo_url
                            ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                            : 'bg-red-600 text-white border-red-600 hover:bg-red-500'
                      )}
                    >
                      {editingId === b.id ? 'Annuler' : b.photo_url ? 'Modifier' : 'Ajouter photo'}
                    </button>
                  )}
                </div>
              </div>

              {/* Formulaire inline */}
              {editingId === b.id && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">

                  {/* Toggle upload / URL */}
                  <div className="flex gap-1 bg-gray-200 rounded-lg p-1 w-fit">
                    <button
                      onClick={() => setUploadMode('file')}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
                        uploadMode === 'file' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Upload size={12} strokeWidth={2} /> Uploader un fichier
                    </button>
                    <button
                      onClick={() => setUploadMode('url')}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
                        uploadMode === 'url' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Link size={12} strokeWidth={2} /> Coller une URL
                    </button>
                  </div>

                  {/* Upload fichier */}
                  {uploadMode === 'file' && (
                    <div className="flex gap-3 items-start">
                      <div
                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 transition-colors"
                        onClick={() => fileRef.current?.click()}
                      >
                        {previewSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewSrc} alt="preview" className="mx-auto rounded object-cover h-20 w-auto" />
                        ) : (
                          <>
                            <Upload size={20} strokeWidth={1.5} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Cliquez pour choisir une image</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP — stocké dans Supabase</p>
                          </>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleSave(b.id)}
                          disabled={saving || !hasFile}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-40 font-medium whitespace-nowrap"
                        >
                          <Check size={13} strokeWidth={2} />
                          {saving ? 'Upload…' : 'Enregistrer'}
                        </button>
                        <button onClick={cancelEdit} className="p-2 text-gray-400 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors">
                          <X size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL externe */}
                  {uploadMode === 'url' && (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editUrl}
                          onChange={e => { setEditUrl(e.target.value); setPreviewSrc(e.target.value || null); }}
                          placeholder="https://…"
                          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(b.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 font-medium"
                        >
                          <Check size={13} strokeWidth={2} />
                          {saving ? 'Sauvegarde…' : 'Enregistrer'}
                        </button>
                        <button onClick={cancelEdit} className="p-2 text-gray-400 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors">
                          <X size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                      {previewSrc && (
                        <div className="mt-2">
                          <Image src={previewSrc} alt="preview" width={80} height={60} className="rounded object-cover border border-gray-200" unoptimized />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
