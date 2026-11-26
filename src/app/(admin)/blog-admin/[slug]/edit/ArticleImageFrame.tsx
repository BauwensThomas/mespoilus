'use client';

import { useState } from 'react';
import PhotoFrameEditor from '@/components/ui/PhotoFrameEditor';

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
