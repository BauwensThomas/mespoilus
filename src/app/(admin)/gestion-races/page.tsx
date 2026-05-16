'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ClipboardList, RefreshCw, Check, X, ImageOff } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

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
  }

  async function savePhoto(id: string) {
    setSaving(true);
    try {
      await fetch('/api/admin/breeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, photo_url: editUrl.trim() || null }),
      });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
      setBreeds(prev => prev.map(b => b.id === id ? { ...b, photo_url: editUrl.trim() || null } : b));
      setEditingId(null);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const displayed = filter === 'all' ? breeds : breeds.filter(b => b.animal === filter);
  const withPhoto = displayed.filter(b => b.photo_url).length;
  const withoutPhoto = displayed.length - withPhoto;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <ClipboardList size={20} strokeWidth={1.5} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiches races</h1>
          <p className="text-sm text-gray-500">Gérer les photos de chaque race</p>
        </div>
        <button onClick={fetchBreeds} className="ml-auto text-gray-400 hover:text-gray-700 transition-colors">
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
              <span>{tab.emoji}</span>
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
          {withoutPhoto > 0 && (
            <span className="text-red-500 font-medium">{withoutPhoto} sans photo</span>
          )}
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

                {/* Nom + animal + statut photo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {ANIMAL_LABEL[b.animal] ?? b.animal}
                    </span>
                  </div>
                  {b.photo_url ? (
                    <p className="text-xs text-emerald-600 mt-0.5 truncate max-w-xs">{b.photo_url}</p>
                  ) : (
                    <p className="text-xs text-red-400 mt-0.5 font-medium">Pas de photo</p>
                  )}
                </div>

                {/* Bouton */}
                {savedId === b.id ? (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 flex-shrink-0">
                    <Check size={13} strokeWidth={2} /> Sauvegardé
                  </span>
                ) : (
                  <button
                    onClick={() => editingId === b.id ? setEditingId(null) : startEdit(b)}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex-shrink-0',
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

              {/* Formulaire inline */}
              {editingId === b.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">URL de la photo</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      placeholder="https://…"
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
                      autoFocus
                    />
                    <button
                      onClick={() => savePhoto(b.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 font-medium"
                    >
                      <Check size={13} strokeWidth={2} />
                      {saving ? 'Sauvegarde…' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-gray-400 hover:text-gray-700 border border-gray-300 rounded-lg transition-colors"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  {editUrl && (
                    <div className="mt-2">
                      <Image src={editUrl} alt="preview" width={80} height={60} className="rounded object-cover border border-gray-200" unoptimized />
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
