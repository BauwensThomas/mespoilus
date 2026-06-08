'use client';

import { useState, useEffect } from 'react';
import { Trophy, PartyPopper } from 'lucide-react';

interface PublicWinner { rang: number; prenom: string; raison: string; }

interface Props {
  grilleId: string;
  raceSecrete: string;
  winners: PublicWinner[];
  nextStartsAt: string | null;
}

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function GrilleResults({ grilleId, raceSecrete, winners, nextStartsAt }: Props) {
  const [left, setLeft] = useState({ jours: 0, heures: 0, minutes: 0 });

  useEffect(() => {
    if (!nextStartsAt) return;
    const end = new Date(nextStartsAt).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setLeft({ jours: 0, heures: 0, minutes: 0 }); return; }
      setLeft({
        jours: Math.floor(diff / 86400000),
        heures: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const i = setInterval(tick, 30000);
    return () => clearInterval(i);
  }, [nextStartsAt]);

  const dateProchaine = nextStartsAt
    ? new Date(nextStartsAt).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header avec animations */}
        <div className="text-center mb-6 fade-up">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-green-700 text-xs font-medium mb-3 pulse-soft">
            <PartyPopper className="w-3.5 h-3.5" /> Grille terminée
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5 glow-text">L&apos;image est révélée !</h1>
          <p className="text-gray-600 text-sm">
            La race cachée était <span className="font-bold text-orange-600">{raceSecrete}</span>.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Image complète avec animation */}
          <div className="w-full lg:max-w-[480px] shrink-0 fade-up">
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white hover:shadow-lg transition-all duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/grille/${grilleId}/image?v=final`}
                alt={`Grille révélée - ${raceSecrete}`}
                className="w-full aspect-square object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>

          {/* Gagnants + prochaine grille */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Section gagnants avec animations */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 fade-up hover:shadow-md transition-all duration-300">
              <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Les gagnants
              </h2>
              {winners.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun participant sur cette grille.</p>
              ) : (
                <ul className="space-y-3 stagger-container">
                  {winners.map((w, idx) => (
                    <li key={w.rang} className="stagger-child flex items-center gap-3">
                      <span className="text-xl w-7">{RANK_EMOJI[w.rang - 1]}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{w.prenom}</p>
                        <p className="text-xs text-orange-500">{w.raison}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Prochaine grille avec animation */}
            {dateProchaine && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 text-center fade-up hover:shadow-md transition-all duration-300">
                <p className="text-sm text-gray-600 mb-1">Prochaine grille mystère</p>
                <p className="text-lg font-bold text-orange-600">{dateProchaine}</p>
                {(left.jours > 0 || left.heures > 0 || left.minutes > 0) && (
                  <p className="text-xs text-gray-500 mt-1">
                    dans {left.jours}j {left.heures}h {left.minutes}min
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}