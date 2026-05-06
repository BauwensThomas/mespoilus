'use client';

import { useState, useRef } from 'react';

const ANIMAL_TYPES = [
  { id: 'chien',   label: 'Chien'   },
  { id: 'chat',    label: 'Chat'    },
  { id: 'oiseau',  label: 'Oiseau'  },
  { id: 'rongeur', label: 'Rongeur' },
  { id: 'reptile', label: 'Reptile' },
  { id: 'autre',   label: 'Autre'   },
];

const COUNTRIES = [
  // Europe francophone
  'Belgique', 'France', 'Suisse', 'Luxembourg', 'Monaco',
  // Amérique
  'Canada (Québec)', 'Haïti',
  // DOM-TOM français
  'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane française', 'Mayotte',
  'Nouvelle-Calédonie', 'Polynésie française',
  // Maghreb
  'Algérie', 'Maroc', 'Tunisie',
  // Afrique subsaharienne
  'Bénin', 'Burkina Faso', 'Burundi', 'Cameroun', 'Comores',
  'Côte d\'Ivoire', 'Djibouti', 'Gabon', 'Guinée', 'Guinée Équatoriale',
  'Madagascar', 'Mali', 'Maurice', 'Niger', 'République Centrafricaine',
  'République Démocratique du Congo', 'République du Congo', 'Rwanda',
  'Sénégal', 'Seychelles', 'Tchad', 'Togo',
  // Océanie
  'Vanuatu',
];

const EMPTY = {
  poster_name: '', email: '', animal_type: '', breed: '',
  age: '', gender: 'inconnu', country: 'Belgique', region: '', description: '',
  contact_email: '', contact_phone: '',
};

interface PhotoEntry { file: File; preview: string }

export default function AdoptionPostForm() {
  const [form, setForm]     = useState(EMPTY);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError]   = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newEntries = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...newEntries].slice(0, 5));
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (photos.length < 2) {
      setError("Veuillez ajouter au moins 2 photos de l'animal.");
      return;
    }

    setStatus('loading');
    setError('');
    setUploadProgress(0);

    try {
      // 1. Upload chaque photo
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const fd = new FormData();
        fd.append('file', photos[i].file);
        const res  = await fetch('/api/adoption/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur upload photo');
        photoUrls.push(data.url);
        setUploadProgress(i + 1);
      }

      // 2. Soumettre le formulaire
      const { country, region, ...rest } = form;
      const res  = await fetch('/api/adoption/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rest,
          region: region ? `${region}, ${country}` : country,
          photo_urls: photoUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); setStatus('error'); return; }

      setStatus('success');
      setForm(EMPTY);
      photos.forEach(p => URL.revokeObjectURL(p.preview));
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
      setStatus('error');
    }
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30';

  if (status === 'success') {
    return (
      <div className="max-w-2xl">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <span className="text-4xl block mb-3">✅</span>
          <h3 className="text-white font-semibold text-lg mb-2">Annonce envoyée !</h3>
          <p className="text-gray-400 text-sm">
            Votre annonce est en cours de vérification et sera publiée sous 24h après validation.
          </p>
          <button onClick={() => setStatus('idle')} className="mt-4 text-amber-400 hover:underline text-sm">
            Déposer une autre annonce
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Photos ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400 font-medium">
              Photos de l'animal <span className="text-amber-400">*</span>
              <span className="text-gray-600 ml-1">(2 min · 5 max)</span>
            </label>
            <span className={`text-xs font-medium ${photos.length >= 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
              {photos.length} / 5
            </span>
          </div>

          {/* Grille de prévisualisations */}
          {photos.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Bouton ajouter (si < 5) */}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-lg border border-dashed border-gray-600 hover:border-amber-500/50 flex items-center justify-center text-gray-600 hover:text-amber-400 transition-colors text-xl"
                >
                  +
                </button>
              )}
            </div>
          )}

          {/* Zone de drop initiale (si 0 photo) */}
          {photos.length === 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border border-dashed border-gray-600 hover:border-amber-500/50 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-500 hover:text-amber-400 transition-colors"
            >
              <span className="text-sm font-medium">Cliquez pour ajouter des photos</span>
              <span className="text-xs text-gray-600">JPG, PNG, WebP · Max 5 Mo par photo</span>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {/* ── Infos déposant ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Votre prénom *</label>
            <input type="text" required value={form.poster_name} onChange={e => set('poster_name', e.target.value)} placeholder="Jean" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Votre email (privé) *</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="vous@email.com" className={inputCls} />
          </div>
        </div>

        {/* ── Animal ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Type d'animal *</label>
            <select required value={form.animal_type} onChange={e => set('animal_type', e.target.value)} className={inputCls}>
              <option value="">Choisir...</option>
              {ANIMAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Race / Espèce</label>
            <input type="text" value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="ex : Labrador, Siamois…" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Âge approximatif</label>
            <input type="text" value={form.age} onChange={e => set('age', e.target.value)} placeholder="ex : 2 ans" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Sexe</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
              <option value="inconnu">Inconnu</option>
              <option value="mâle">Mâle</option>
              <option value="femelle">Femelle</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Pays *</label>
            <select required value={form.country} onChange={e => set('country', e.target.value)} className={inputCls}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Région / Ville *</label>
            <input type="text" required value={form.region} onChange={e => set('region', e.target.value)} placeholder="ex : Bruxelles" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description *</label>
          <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={4}
            placeholder="Décrivez l'animal : comportement, besoins, pourquoi vous le donnez…"
            className={`${inputCls} resize-none`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email public *</label>
            <input type="email" required value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              placeholder="contact@email.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Téléphone</label>
            <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
              placeholder="ex : 0487 12 34 56" className={inputCls} />
          </div>
        </div>
        <p className="text-[10px] text-gray-600 -mt-3">Ces coordonnées seront visibles sur l'annonce publiée.</p>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'loading' && (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'loading'
            ? uploadProgress < photos.length
              ? `Upload photo ${uploadProgress + 1} / ${photos.length}…`
              : 'Envoi…'
            : "Soumettre l'annonce"}
        </button>
      </form>
    </div>
  );
}
