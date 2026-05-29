'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Pin, Trash2 } from 'lucide-react';

export default function AdminHideToggle({
  catalogId, name, status,
}: {
  catalogId: string;
  name: string;
  status: 'active' | 'hidden' | 'pinned';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isHidden = status === 'hidden';
  const isPinned = status === 'pinned';

  async function toggle() {
    const action = isHidden ? 'show' : 'hide';
    const label = isHidden
      ? `Épingler "${name}" (protégé du masquage automatique) ?`
      : `Masquer "${name}" du catalogue ?`;
    if (!confirm(label)) return;
    setLoading(true);
    await fetch('/api/boutique/hide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog_id: catalogId, action }),
    });
    router.refresh();
  }

  async function unpin() {
    if (!confirm(`Désépingler "${name}" (le cron pourra le masquer automatiquement) ?`)) return;
    setLoading(true);
    await fetch('/api/boutique/hide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog_id: catalogId, action: 'hide' }),
    });
    router.refresh();
  }

  if (isPinned) {
    return (
      <button
        onClick={unpin}
        disabled={loading}
        title="Désépingler (le cron peut le masquer)"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
      >
        <Pin size={12} />
        Épinglé
      </button>
    );
  }

  if (isHidden) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          disabled={loading}
          title="Épingler dans le catalogue (protégé du cron)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
        >
          <Eye size={12} />
          Afficher
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Supprimer définitivement "${name}" ? Cette action est irréversible.`)) return;
            setLoading(true);
            const res = await fetch('/api/boutique/delete-catalog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ catalog_id: catalogId }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              alert(`Erreur : ${data.error ?? res.status}`);
              setLoading(false);
              return;
            }
            router.refresh();
          }}
          disabled={loading}
          title="Supprimer définitivement"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title="Masquer du catalogue"
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 border-gray-200 hover:border-red-300"
    >
      <EyeOff size={12} />
      Masquer
    </button>
  );
}
