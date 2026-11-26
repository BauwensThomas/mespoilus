'use client';

import { useState } from 'react';
import PhotoFrameEditor, { type FrameFormat } from '@/components/ui/PhotoFrameEditor';

// Où l'image d'un article est affichée : en-tête grand écran (21:9), cartes du blog, en-tête mobile (4:3)
const ARTICLE_FORMATS: FrameFormat[] = [
  { label: 'En-tête grand écran', ratio: '21 / 9', width: '20rem' },
  { label: 'Carte du blog', ratio: '16 / 9', width: '12rem' },
  { label: 'En-tête mobile', ratio: '4 / 3', width: '9rem' },
];

/** Cadrage de l'image de l'article, enregistré tout de suite (indépendant du bouton du formulaire). */
export default function ArticleImageFrame({ src, value, save }: {
  src: string;
  value: string | null;
  save: (value: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(value);
  const [message, setMessage] = useState('');
  return (
    <section className="mt-8 border-t border-gray-200 pt-6 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Cadrage de l&apos;image</h2>
        <p className="text-xs text-gray-500">Utilisé dans les cartes du blog, de l&apos;accueil et des fiches races, et en haut de l&apos;article.</p>
        {message && <p className="text-xs text-green-700 mt-1">{message}</p>}
      </div>
      <PhotoFrameEditor
        key={src}
        src={src}
        value={current}
        formats={ARTICLE_FORMATS}
        saving={busy}
        onSave={async v => {
          setBusy(true); setMessage('');
          try { await save(v); setCurrent(v); setMessage('Cadrage enregistré.'); }
          catch { setMessage('Enregistrement impossible.'); }
          finally { setBusy(false); }
        }}
      />
    </section>
  );
}
