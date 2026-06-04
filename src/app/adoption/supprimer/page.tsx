'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Trash2, CheckCircle2, XCircle, Heart, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type Reason = 'adopted' | 'error';

function SupprimerContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const id      = params.get('id') ?? '';
  const token   = params.get('token') ?? '';

  const [reason, setReason]     = useState<Reason | null>(null);
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleDelete() {
    if (!id || !token || !reason) return;
    setStatus('loading');
    try {
      const res  = await fetch('/api/adoption/delete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, token, reason }),
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
      <div className="min-h-screen flex items-center justify-center px-4">
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto" strokeWidth={1.5} />
          <h2 className="text-gray-900 font-semibold text-lg">Annonce retirée !</h2>
          <p className="text-gray-500 text-sm">
            {reason === 'adopted'
              ? 'Félicitations pour l\'adoption ! Votre animal a trouvé un foyer.'
              : 'Annonce supprimée avec succès.'}
          </p>
          <p className="text-gray-400 text-xs">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full space-y-6">

        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={26} className="text-red-500" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-gray-900 font-bold text-xl">Retirer mon annonce</h1>
          <p className="text-gray-500 text-sm">Pourquoi souhaitez-vous retirer cette annonce ?</p>
        </div>

        {/* Choix de la raison */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setReason('adopted')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              reason === 'adopted'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <Heart size={24} className={reason === 'adopted' ? 'text-emerald-600' : 'text-gray-400'} strokeWidth={1.5} />
            <span className={`text-sm font-semibold ${reason === 'adopted' ? 'text-emerald-700' : 'text-gray-600'}`}>
              Animal adopté
            </span>
            <span className="text-xs text-gray-400 text-center leading-tight">Il a trouvé un foyer</span>
          </button>

          <button
            onClick={() => setReason('error')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              reason === 'error'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50'
            }`}
          >
            <AlertCircle size={24} className={reason === 'error' ? 'text-gray-600' : 'text-gray-400'} strokeWidth={1.5} />
            <span className={`text-sm font-semibold ${reason === 'error' ? 'text-gray-700' : 'text-gray-600'}`}>
              Erreur / Autre
            </span>
            <span className="text-xs text-gray-400 text-center leading-tight">Annonce incorrecte</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleDelete}
          disabled={!reason || status === 'loading'}
          className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={16} strokeWidth={1.5} />
          )}
          {status === 'loading' ? 'Suppression…' : 'Confirmer la suppression'}
        </button>

        <Link href="/adoption" className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Annuler - Garder mon annonce en ligne
        </Link>
      </div>
    </div>
  );
}

export default function SupprimerAnnoncePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SupprimerContent />
    </Suspense>
  );
}
