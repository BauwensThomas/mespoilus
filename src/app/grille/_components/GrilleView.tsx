'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Lock, Trophy, Users, Zap, X, Timer, Share2, Check } from 'lucide-react';

interface Top3Item {
  rang: number;
  prenom: string;
  total: number;
}

interface Props {
  grilleId: string;
  animal: string;
  pixelsVendus: number;
  totalPixels: number;
  top3Initial: Top3Item[];
  gagnantTrouve: boolean;
  endsAt: string | null;
}

const RANK_EMOJI = ['🥇', '🥈', '🥉'];
const PIXEL_OPTIONS = [5, 10, 15, 20];

export default function GrilleView({
  grilleId,
  animal,
  pixelsVendus: initialPixelsVendus,
  totalPixels,
  top3Initial,
  gagnantTrouve: initialGagnantTrouve,
  endsAt,
}: Props) {
  const [imageVersion, setImageVersion] = useState(0);
  const [pixelsVendus, setPixelsVendus] = useState(initialPixelsVendus);
  const [top3, setTop3] = useState(top3Initial);
  const [gagnantTrouve, setGagnantTrouve] = useState(initialGagnantTrouve);
  const [gagnantPrenom, setGagnantPrenom] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [nbPixels, setNbPixels] = useState(5);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
  const [pendingSession, setPendingSession] = useState<string | null>(null);
  const [pendingDevinette, setPendingDevinette] = useState('');
  const [pendingResult, setPendingResult] = useState<{ correct: boolean; race?: string } | null>(null);
  const [pendingSubmitting, setPendingSubmitting] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareText = 'Un animal mystère se cache derrière une grille de pixels ! Devine sa race et gagne un cadeau 🐾';
  const shareUrl = 'https://www.mespoilus.com/grille';

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Grille Mystère - Mes Poilus', text: shareText, url: shareUrl }); } catch { /* annulé */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch { /* ignore */ }
    }
  }

  const pourcentageExact = (pixelsVendus / totalPixels) * 100;
  const pourcentage = Math.round(pourcentageExact);
  const pourcentageLabel = pixelsVendus > 0 && pourcentageExact < 1
    ? pourcentageExact.toFixed(2).replace('.', ',')
    : String(pourcentage);

  // Source unique de vérité : ends_at de la base (fallback env si absent)
  const endTime = endsAt
    ? new Date(endsAt)
    : (() => { const d = new Date(process.env.NEXT_PUBLIC_GRILLE_START_DATE ?? Date.now()); d.setMonth(d.getMonth() + 3); return d; })();

  const endDate = endTime.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' à ' + endTime.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const end = endTime;

    const tick = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ jours: 0, heures: 0, minutes: 0, secondes: 0 }); return; }
      setTimeLeft({
        jours: Math.floor(diff / 86400000),
        heures: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        secondes: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);

  useEffect(() => {
    const session = localStorage.getItem('grille_pending_session');
    if (!session) return;
    // Vérifie que la session est encore valide (achat existant + devinette non soumise)
    fetch(`/api/grille/confirmation?session_id=${session}`)
      .then(r => r.json())
      .then(d => {
        if (d.achat && !d.achat.devinette) {
          setPendingSession(session);
        } else {
          localStorage.removeItem('grille_pending_session'); // session périmée
        }
      })
      .catch(() => {});
  }, []);

  const handlePendingGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDevinette.trim() || !pendingSession) return;
    setPendingSubmitting(true);
    const res = await fetch('/api/grille/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: pendingSession, devinette: pendingDevinette }),
    });
    const data = await res.json();
    setPendingResult(data);
    setPendingSubmitting(false);
    if (!data.error) {
      localStorage.removeItem('grille_pending_session');
      refreshData();
    }
  };

  // Références pour ne recharger l'image / déclencher les effets QUE si l'état change
  const lastPixelsRef = useRef(initialPixelsVendus);
  const lastGagnantRef = useRef(initialGagnantTrouve);
  const lastAchatAtRef = useRef<string | null>(null);
  const lastMilestoneRef = useRef<number>(
    [75, 50, 25].find(m => (initialPixelsVendus / totalPixels) * 100 >= m) ?? 0
  );

  const refreshData = useCallback(async () => {
    const res = await fetch('/api/grille');
    const data = await res.json();
    if (data.grille) {
      const newVendus: number = data.grille.pixels_vendus;
      const newGagnant: boolean = data.grille.gagnant_trouve;
      setPixelsVendus(newVendus);
      setGagnantTrouve(newGagnant);
      setGagnantPrenom(data.grille.gagnant_prenom ?? null);
      // Recharge l'image uniquement si de nouveaux pixels OU race trouvée
      if (newVendus !== lastPixelsRef.current || (newGagnant && !lastGagnantRef.current)) {
        setImageVersion(Date.now());
      }
      lastPixelsRef.current = newVendus;
      lastGagnantRef.current = newGagnant;

      // Confettis au franchissement d'un palier 25/50/75 %
      const pct = (newVendus / data.grille.total_pixels) * 100;
      const palier = [75, 50, 25].find(m => pct >= m) ?? 0;
      if (palier > lastMilestoneRef.current) {
        lastMilestoneRef.current = palier;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setToast(`🎉 La grille atteint ${palier}% de pixels révélés !`);
      }
    }
    if (data.top3) setTop3(data.top3);

    // Toast "X vient d'acheter" sur nouvel achat (pas au tout premier chargement)
    if (data.dernier_achat) {
      const at: string = data.dernier_achat.at;
      if (lastAchatAtRef.current && at !== lastAchatAtRef.current) {
        const { prenom: p, pixels } = data.dernier_achat;
        setToast(`${p} vient d'acheter ${pixels} pixel${pixels > 1 ? 's' : ''} !`);
      }
      lastAchatAtRef.current = at;
    }
  }, [totalPixels]);

  // Auto-masquage du toast après 5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Mise à jour live par polling de l'endpoint serveur sécurisé (toutes les 12s).
  // (On n'utilise plus Supabase Realtime : RLS verrouille pixel_achats côté anon.)
  useEffect(() => {
    const id = setInterval(refreshData, 12000);
    return () => clearInterval(id);
  }, [refreshData]);

  const handleAcheter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/grille/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grilleId, prenom: prenom.trim(), email: email.trim(), nbPixels, newsletter }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Toast temps réel */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-orange-600 text-xs font-medium mb-3">
            <Lock className="w-3 h-3" />
            Mystère en cours
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            Qui se cache derrière les pixels ?
          </h1>
          <p className="text-gray-500 text-sm mx-auto max-w-lg">
            Achète des pixels pour révéler la photo mystère. Devine la race en premier et remporte un cadeau surprise.
          </p>
          <p className="text-orange-600 font-medium text-sm mt-1">
            3 cadeaux surprises à gagner. Plus la grille se remplit, plus les cadeaux sont généreux.
          </p>

          {/* Partage */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Lien copié !' : 'Partager'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:brightness-95 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:brightness-95 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            >
              Facebook
            </a>
          </div>
        </div>

        {/* Barre : compte à rebours | progression | bouton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 items-stretch">

          {/* Compte à rebours */}
          <div className={`rounded-2xl px-5 py-4 flex flex-col justify-center shadow-sm border ${gagnantTrouve ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <p className="text-[10px] uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5 text-gray-400">
              <Timer className="w-3 h-3 text-orange-400" /> {gagnantTrouve ? 'Race trouvée !' : 'Temps restant'}
            </p>
            {gagnantTrouve ? (
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <Trophy className="w-6 h-6" /> Terminé
              </div>
            ) : !endsAt ? (
              <p className="text-sm font-medium text-gray-700 leading-snug">
                Le compte à rebours de 90 jours démarre dès le 1<sup>er</sup> pixel acheté !
              </p>
            ) : (
              <div className="flex items-end gap-2">
                {[
                  { val: timeLeft.jours, label: 'jours' },
                  { val: timeLeft.heures, label: 'heures' },
                  { val: timeLeft.minutes, label: 'min' },
                  { val: timeLeft.secondes, label: 'sec' },
                ].map(({ val, label }, i, arr) => (
                  <div key={label} className="flex items-end gap-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{String(val).padStart(2, '0')}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{label}</div>
                    </div>
                    {i < arr.length - 1 && <span className="text-gray-300 font-bold mb-4">:</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progression */}
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col justify-center shadow-sm">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Progression</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{pourcentageLabel}</span>
              <span className="text-2xl font-bold text-gray-900 leading-none">%</span>
              <span className="text-xs text-gray-600 ml-1">{pixelsVendus.toLocaleString('fr-BE')} / {totalPixels.toLocaleString('fr-BE')} pixels</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(pourcentage, 0.3)}%` }}
              />
            </div>
          </div>

          {/* Bouton */}
          {gagnantTrouve ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-center gap-2 text-green-700 font-semibold">
              <Trophy className="w-5 h-5 shrink-0" />
              <span className="text-base">La race a été trouvée !</span>
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold rounded-2xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm px-5 py-4"
            >
              <Zap className="w-5 h-5 shrink-0" />
              <span className="text-xl font-bold">Révéler des pixels<br /><span className="font-normal opacity-90 text-base"></span></span>
            </button>
          )}
        </div>

        {/* Bannière devinette en attente */}
        {pendingSession && !pendingResult && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
            <p className="font-semibold text-gray-900 text-sm mb-3">Tu n&apos;as pas encore soumis ta devinette !</p>
            {pendingResult === null && (
              <form onSubmit={handlePendingGuess} className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-4 py-2.5 focus-within:border-orange-400 transition-colors">
                  <span className="text-gray-400 text-sm whitespace-nowrap shrink-0">Je pense que c&apos;est un(e)</span>
                  <input
                    type="text"
                    value={pendingDevinette}
                    onChange={e => setPendingDevinette(e.target.value)}
                    required
                    maxLength={100}
                    className="flex-1 min-w-0 text-gray-900 text-sm focus:outline-none"
                    placeholder="Labrador…"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pendingSubmitting || !pendingDevinette.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shrink-0"
                >
                  {pendingSubmitting ? '…' : 'Valider'}
                </button>
              </form>
            )}
          </div>
        )}
        {pendingResult && (
          <div className={`rounded-2xl p-4 mb-5 text-sm font-medium ${pendingResult.correct ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {pendingResult.correct ? `Bravo ! C'était bien un(e) ${pendingResult.race}.` : 'Mauvaise réponse. Continue à acheter des pixels !'}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Image */}
          <div className="w-full lg:max-w-[480px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 aspect-square">
              {/* Spinner en fond - l'image opaque le recouvre une fois chargée */}
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={imageVersion}
                src={`/api/grille/${grilleId}/image?v=${imageVersion}`}
                alt={`Grille mystère - ${animal}`}
                className="relative z-[1] w-full aspect-square object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
              {gagnantTrouve && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900">Race trouvée !</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Top 3 / Gagnants */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                {gagnantTrouve ? <Trophy className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4 text-orange-500" />}
                {gagnantTrouve ? 'Gagnants' : 'Top investisseurs'}
              </h2>

              {gagnantTrouve ? (
                <ul className="space-y-3">
                  {/* Gagnant 1 : devineur */}
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg w-6">🥇</span>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{gagnantPrenom ?? top3[0]?.prenom ?? '?'}</span>
                        <p className="text-xs text-orange-500 font-medium">A trouvé la race</p>
                      </div>
                    </div>
                    <span className="text-amber-500 font-bold text-sm shrink-0">Prix #1</span>
                  </li>
                  {/* Gagnants 2 et 3 : top investisseurs */}
                  {top3.slice(0, 2).map((item, i) => (
                    <li key={`${item.prenom}-${i}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg w-6">{RANK_EMOJI[i + 1]}</span>
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{item.prenom}</span>
                          <p className="text-xs text-gray-400">{item.total} px achetés</p>
                        </div>
                      </div>
                      <span className="text-gray-500 font-semibold text-sm shrink-0">Prix #{i + 2}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  {top3.length === 0 ? (
                    <p className="text-gray-400 text-sm">Sois le premier à acheter des pixels !</p>
                  ) : (
                    <ul className="space-y-3">
                      {top3.map((item, i) => (
                        <li key={`${item.prenom}-${i}`} className="flex items-center gap-2">
                          <span className="text-lg w-6">{RANK_EMOJI[i]}</span>
                          <span className="font-medium text-gray-900 text-sm truncate">{item.prenom}</span>
                        </li>
                      ))}
                      {[...Array(3 - top3.length)].map((_, i) => (
                        <li key={`empty-${i}`} className="flex items-center gap-2 opacity-30">
                          <span className="text-lg w-6">{RANK_EMOJI[top3.length + i]}</span>
                          <span className="text-gray-400 text-sm">disponible</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Règles */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Comment ça marche ?</h2>
              <div className="flex flex-col gap-2">
                {[
                  'Achète des pixels qui s\'affichent aléatoirement et révèlent progressivement l\'image cachée.',
                  'Chaque achat te permet de soumettre une devinette sur la race de l\'animal.',
                  endsAt
                    ? `La grille se termine le ${endDate}. 3 cadeaux surprises à gagner.`
                    : 'Le compte à rebours de 90 jours démarre au 1er pixel acheté. 3 cadeaux surprises à gagner.',
                  '1er cadeau : le premier à deviner la race. Si personne ne trouve, le plus gros acheteur le remporte.',
                  '2e et 3e cadeaux : les deux plus gros acheteurs de pixels.',
                  'Une partie des recettes est reversée à un refuge animalier ou une association.',
                ].map((text, i) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-gray-500 bg-gray-100 border border-orange-200 rounded-xl p-3">
                    <span className="shrink-0 font-bold text-gray-900 w-4 text-center">{i + 1}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-5">Questions fréquentes</h2>
          <div className="space-y-2">
            {[
              { q: 'Que gagne-t-on exactement ?', r: 'Des cadeaux surprises. Leur valeur dépend du montant collecté : plus la grille se remplit, plus les cadeaux sont généreux. Aucune valeur n\'est garantie à l\'avance.' },
              { q: 'Comment saurai-je si j\'ai gagné ?', r: 'Les gagnants sont contactés directement par email à l\'adresse renseignée lors de l\'achat, à la fin de la grille. Pense à utiliser un email valide.' },
              { q: 'Puis-je acheter plusieurs fois ?', r: 'Oui ! Chaque achat ajoute des pixels et te donne une nouvelle tentative de devinette. Acheter plusieurs fois augmente tes chances de deviner et d\'être dans le top des acheteurs.' },
              { q: 'Mon achat est-il remboursable ?', r: 'Non, l\'achat de pixels est définitif. Le paiement est sécurisé par Stripe ; nous ne voyons jamais tes données bancaires.' },
              { q: 'Est-ce une loterie ou une tombola ?', r: 'Non. Les gains reposent sur une devinette (concours de connaissance) et sur le nombre de pixels achetés, jamais sur un tirage au sort.' },
              { q: 'Où va l\'argent reversé ?', r: 'Une partie des recettes de chaque grille est reversée à un refuge animalier ou une association. Jouer, c\'est aussi soutenir une bonne cause.' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {item.q}
                  <span className="text-orange-500 text-lg shrink-0 ml-3">{faqOpen === i ? '−' : '+'}</span>
                </button>
                {faqOpen === i && (
                  <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.r}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lien historique */}
        <div className="mt-8 text-center">
          <a href="/grilles" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            Voir les grilles passées et leurs gagnants →
          </a>
        </div>

        {/* Mentions légales courtes */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
          L&apos;achat est définitif. Les pixels sont attribués aléatoirement. Une partie des recettes est reversée à un refuge animalier ou une association.
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Acheter des pixels</h2>
                <p className="text-gray-500 text-sm mt-0.5">Tes pixels seront placés aléatoirement.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAcheter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom affiché dans le classement</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  required
                  maxLength={50}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors text-sm"
                  placeholder="Ton prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (pour ton cadeau si tu gagnes)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors text-sm"
                  placeholder="ton@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de pixels</label>
                <div className="grid grid-cols-4 gap-2">
                  {PIXEL_OPTIONS.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNbPixels(n)}
                      className={`py-2.5 rounded-xl font-semibold text-sm transition-colors border ${
                        nbPixels === n
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {n} px
                    </button>
                  ))}
                </div>
                <p className="text-right font-bold text-orange-600 mt-2">{nbPixels} €</p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={e => setNewsletter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  Je souhaite recevoir la newsletter Mes Poilus (conseils, nouvelles grilles, gagnants). Désinscription en un clic à tout moment.
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Chargement…
                    </span>
                  ) : `Payer ${nbPixels} €`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
