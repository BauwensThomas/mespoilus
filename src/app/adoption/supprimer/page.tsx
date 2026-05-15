'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function SupprimerContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const id       = params.get('id') ?? '';
  const token    = params.get('token') ?? '';

  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleDelete() {
    if (!id || !token) { setErrorMsg('Lien invalide.'); setStatus('error'); return; }
    setStatus('loading');
    try {
      const res  = await fetch('/api/adoption/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Erreur'); setStatus('error'); return; }
      setStatus('success');
      setTimeout(() => router.push('/adoption'), 3000);
    } catch {
      setErrorMsg('Erreur inattendue. Réessayez.');
      setStatus('error');
    }
  }

  if (!id || !token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <XCircle size={48} className="text-red-400 mx-auto" strokeWidth={1.5} />
          <p className="text-gray-700 font-medium">Lien invalide ou expiré.</p>
          <Link href="/adoption" className="text-orange-600 hover:underline text-sm">← Retour aux annonces</Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto" strokeWidth={1.5} />
          <h2 className="text-gray-900 font-semibold text-lg">Annonce supprimée !</h2>
          <p className="text-gray-500 text-sm">Félicitations pour l'adoption ! Redirection…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 size={26} className="text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-gray-900 font-bold text-xl">Supprimer mon annonce</h1>
          <p className="text-gray-500 text-sm">
            Votre animal a trouvé un foyer ? Super nouvelle !<br />
            Cliquez ci-dessous pour retirer votre annonce.
          </p>
        </div>

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleDelete}
          disabled={status === 'loading'}
          className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={16} strokeWidth={1.5} />
          )}
          {status === 'loading' ? 'Suppression…' : 'Confirmer la suppression'}
        </button>

        <Link href="/adoption" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Annuler — garder mon annonce en ligne
        </Link>
      </div>
    </div>
  );
}

export default function SupprimerAnnoncePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SupprimerContent />
    </Suspense>
  );
}
