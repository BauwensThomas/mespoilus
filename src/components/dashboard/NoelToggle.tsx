'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';
import { isNoelSeason } from '@/lib/noel';

export default function NoelToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/noel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `Erreur ${r.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally { setBusy(false); }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Gift size={20} className={enabled ? 'text-red-600' : 'text-gray-400'} />
        <div>
          <p className="text-sm font-semibold text-gray-900">Décorations de Noël</p>
          <p className="text-xs text-gray-600" suppressHydrationWarning>
            {!enabled ? 'Désactivées.' : isNoelSeason() ? 'Affichées sur le site, jusqu\'au 10 janvier.' : 'Automatiques, du 25 novembre au 10 janvier.'}
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Décorations de Noël"
        onClick={toggle}
        disabled={busy}
        className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${enabled ? 'bg-green-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
