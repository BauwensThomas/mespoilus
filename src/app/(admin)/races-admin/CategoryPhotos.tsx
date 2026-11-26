'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PhotoFrameEditor from '@/components/ui/PhotoFrameEditor';
import { frameStyle } from '@/lib/image-focus';

interface HeroPhoto { id: string; url: string; alt: string | null; animal_type: string; active: boolean; focus: string | null }

const FORMATS = [
  { label: 'Page Races', ratio: '2 / 3', width: '7rem' },
  { label: 'Accueil', ratio: '3 / 4', width: '7.5rem' },
];

/** Cadrage des photos des cartes "Chiens, Chats..." (une photo tirée au hasard parmi celles de l'animal). */
export default function CategoryPhotos() {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<HeroPhoto[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || photos) return;
    fetch('/api/admin/hero-photos').then(r => r.json()).then(d => setPhotos(d.photos ?? [])).catch(() => setPhotos([]));
  }, [open, photos]);

  async function save(id: string, focus: string) {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/hero-photos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, focus }) });
      if (r.ok) { setPhotos(p => p?.map(x => (x.id === id ? { ...x, focus } : x)) ?? p); setEditing(null); }
    } finally { setBusy(false); }
  }

  const groups = [...new Set((photos ?? []).map(p => p.animal_type))];
  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span>
          <span className="block text-sm font-semibold text-gray-900">Photos des catégories</span>
          <span className="block text-xs text-gray-500">Cartes &quot;Chiens, Chats...&quot; des pages Races et Accueil : une photo tirée au hasard par animal.</span>
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 p-4 space-y-5">
          {!photos && <p className="text-sm text-gray-500">Chargement...</p>}
          {groups.map(type => (
            <div key={type}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{type}</p>
              <div className="flex flex-wrap gap-2">
                {photos!.filter(p => p.animal_type === type).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEditing(editing === p.id ? null : p.id)}
                    className={`relative w-16 aspect-[2/3] rounded-lg overflow-hidden border-2 ${editing === p.id ? 'border-orange-500' : 'border-transparent'} ${p.active ? '' : 'opacity-40'}`}
                    aria-label={`Cadrer la photo ${p.alt ?? ''}`}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" style={frameStyle(p.focus)} />
                  </button>
                ))}
              </div>
              {photos!.some(p => p.id === editing && p.animal_type === type) && (() => {
                const p = photos!.find(x => x.id === editing)!;
                return (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <PhotoFrameEditor key={p.id} src={p.url} value={p.focus} formats={FORMATS} saving={busy} onSave={v => save(p.id, v)} onCancel={() => setEditing(null)} />
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
