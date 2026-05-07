'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function UnsubscribeContent() {
  const params = useSearchParams();
  const success = params.get('success') === '1';
  const error = params.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        {success ? (
          <>
            <div className="text-5xl mb-4">🐾</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Désabonnement confirmé</h1>
            <p className="text-gray-500 mb-6">
              Tu ne recevras plus notre newsletter. On espère te revoir bientôt sur Mes Poilus !
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h1>
            <p className="text-gray-500 mb-6">
              Ce lien de désabonnement est incorrect ou expiré.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block bg-amber-400 hover:bg-amber-500 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Retour à Mes Poilus
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
