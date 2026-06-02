'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

interface AchatData {
  id: string;
  positions: number[];
  acheteur_prenom: string;
  devinette: string | null;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const router = useRouter();
  const [achat, setAchat] = useState<AchatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) { setNotFound(true); setLoading(false); return; }

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const res = await fetch(`/api/grille/confirmation?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.achat) {
          setAchat(data.achat);
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
          // Stocke le session_id si la devinette n'a pas encore été soumise
          if (!data.achat.devinette && sessionId) {
            localStorage.setItem('grille_pending_session', sessionId);
          }
          // GA4 : événement d'achat (1 pixel = 1 €), une seule fois par session
          const pixels = data.achat.positions?.length ?? 0;
          const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
          if (gtag && pixels > 0 && !sessionStorage.getItem('grille_purchase_tracked_' + sessionId)) {
            sessionStorage.setItem('grille_purchase_tracked_' + sessionId, '1');
            gtag('event', 'purchase', {
              transaction_id: sessionId,
              value: pixels,
              currency: 'EUR',
              items: [{ item_name: 'Pixels Grille Mystère', quantity: pixels, price: 1 }],
            });
          }
        }
      }
      if (attempts >= 15) {
        setNotFound(true);
        setLoading(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId]);

  useEffect(() => {
    if (!achat) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    const redirect = setTimeout(() => router.push('/grille'), 5000);
    return () => { clearInterval(timer); clearTimeout(redirect); };
  }, [achat, router]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-gray-500">Confirmation de ton paiement en cours…</p>
      </div>
    );
  }

  if (notFound || !achat) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-500 text-center">
          Paiement non trouvé. S&apos;il vient d&apos;être effectué, attends quelques secondes et recharge la page.
        </p>
        <Link href="/grille" className="text-yellow-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Retour à la grille
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Succès */}
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
          <p className="text-gray-500">
            Merci {achat.acheteur_prenom} - <span className="text-orange-600 font-semibold">{achat.positions.length} pixels</span> ont été révélés sur la grille.
          </p>
        </div>

        <Link
          href="/grille"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors"
        >
          Voir mes pixels sur la grille → <span className="opacity-70 text-sm">({countdown}s)</span>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
