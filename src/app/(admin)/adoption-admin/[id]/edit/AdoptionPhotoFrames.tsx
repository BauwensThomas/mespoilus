'use client';

import { useState } from 'react';
import PhotoFrameEditor from '@/components/ui/PhotoFrameEditor';

/** Cadrage de chaque photo d'une annonce, enregistré tout de suite (sans le bouton du formulaire). */
export default function AdoptionPhotoFrames({ photos, frames, save }: {
  photos: string[];
  frames: (string | null)[];
  save: (index: number, value: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState(frames);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  if (photos.length === 0) return null;
  return (
    <section className="space-y-6 border-t border-gray-200 pt-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Cadrage des photos</h2>
        <p className="text-xs text-gray-500">Utilisé dans les cartes et miniatures. Sur la page de l&apos;annonce, la grande photo est toujours affichée en entier.</p>
        {message && <p className="text-xs text-green-700 mt-1">{message}</p>}
      </div>
      {photos.map((src, i) => (
        <div key={src} className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Photo {i + 1}{i === 0 ? ' (principale)' : ''}</p>
          <PhotoFrameEditor
            src={src}
            value={current[i] ?? null}
            saving={busy === i}
            onSave={async value => {
              setBusy(i); setMessage('');
              try {
                await save(i, value);
                setCurrent(c => { const next = [...c]; next[i] = value; return next; });
                setMessage(`Cadrage de la photo ${i + 1} enregistré.`);
              } catch {
                setMessage('Enregistrement impossible.');
              } finally { setBusy(null); }
            }}
          />
        </div>
      ))}
    </section>
  );
}
