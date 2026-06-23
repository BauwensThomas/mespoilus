import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { computeGrilleResults } from '@/lib/grille-finish';
import { Trophy, ArrowRight } from 'lucide-react';
import ClientWrapper from '@/components/animations/ClientWrapper';

export const metadata: Metadata = {
  title: 'Grilles passées - Grille Mystère | Mes Poilus',
  description: 'Découvrez les grilles mystères terminées de Mes Poilus : les animaux révélés, les gagnants et les sommes reversées aux refuges.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/grilles' },
};

export const revalidate = 3600;

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default async function GrillesHistoriquePage() {
  const supabase = createAdminClient();

  const { data: grilles } = await supabase
    .from('pixel_grilles')
    .select('id, animal, race_secrete, grille_taille, gagnant_devinette_id, created_at, ends_at, montant_reverse_cents, preuve_don_url')
    .eq('statut', 'completed')
    .order('ends_at', { ascending: false })
    .limit(24);

  const totalReverseCents = (grilles ?? []).reduce((s, g) => s + (g.montant_reverse_cents ?? 0), 0);

  const items = await Promise.all(
    (grilles ?? []).map(async (g) => {
      const { winners } = await computeGrilleResults(supabase, g);
      return { grille: g, winners };
    })
  );

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Header avec animations */}
        <div className="text-center mb-10 fade-up">
          <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">Historique</span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 glow-text">Les grilles passées</h1>
          <p className="text-gray-600 mt-3">Les animaux révélés et leurs gagnants. Merci à tous les participants !</p>
          <div className="mt-6 text-center space-y-3 text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            <p>
              Chaque Grille Mystère cache un animal secret derrière une grille de pixels. Les participants révèlent des cases une par une et tentent de deviner l&apos;espèce et la race avant que la grille soit complètement dévoilée. Plus vous révélez tôt, plus votre score est élevé. A chaque partie terminée, une partie des participations est reversée à un refuge partenaire : jouer, c&apos;est soutenir concrètement les animaux dans le besoin.
            </p>
            <p>
              Cette page rassemble l&apos;historique de toutes les grilles terminées : l&apos;animal révélé, les gagnants du jeu de devinette, et le montant reversé au refuge. Chaque grille met en scène une espèce différente : chien, chat, lapin, perroquet, reptile ou rongeur. Les races les plus rares et les moins connues font souvent les meilleures surprises.
            </p>
            <p>
              Vous pouvez participer à la grille en cours sur <Link href="/grille" className="text-orange-600 hover:underline">la page Grille Mystère</Link>. Une nouvelle grille est lancée régulièrement. Si vous avez manqué les dernières éditions, consultez cet historique pour voir les animaux révélés et les scores des participants. Les refuges partenaires sont sélectionnés pour leur sérieux et leur transparence sur l&apos;utilisation des fonds.
            </p>
            <p>
              Chaque euro reversé contribue directement aux soins vétérinaires, à l&apos;alimentation et à la stérilisation des animaux en attente d&apos;adoption. Jouer à la Grille Mystère, c&apos;est une façon ludique et gratuite de participer à cette chaine de solidarité.
            </p>
          </div>
          {totalReverseCents > 0 && (
            <p className="inline-block mt-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-full px-4 py-1.5 pulse-soft">
              ❤️ {(totalReverseCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} reversés aux refuges
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 fade-up">
            <p className="text-gray-500 mb-4">Aucune grille terminée pour le moment.</p>
            <Link href="/grille" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
              Jouer à la grille en cours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-container">
            {items.map(({ grille, winners }, idx) => (
              <div key={grille.id} className="stagger-child bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/grille/${grille.id}/image`}
                  alt={`Grille révélée - ${grille.race_secrete}`}
                  className="w-full aspect-square object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-1">
                    {grille.ends_at ? new Date(grille.ends_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </p>
                  <h2 className="font-bold text-gray-900 mb-3">{grille.race_secrete}</h2>
                  {winners.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucun participant.</p>
                  ) : (
                    <ul className="space-y-1.5 stagger-container">
                      {winners.map((w, i) => (
                        <li key={w.rang} className="stagger-child flex items-center gap-2 text-sm">
                          <span>{RANK_EMOJI[w.rang - 1]}</span>
                          <span className="font-medium text-gray-900">{w.prenom}</span>
                          <span className="text-gray-400 text-xs">· {w.raison}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(grille.montant_reverse_cents || grille.preuve_don_url) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs">
                      {grille.montant_reverse_cents != null && (
                        <span className="text-green-700 font-medium">
                          ❤️ {(grille.montant_reverse_cents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} reversés
                        </span>
                      )}
                      {grille.preuve_don_url && (
                        <a href={grille.preuve_don_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline ml-2 hover:text-orange-700 transition-colors">
                          voir la preuve
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton avec animation */}
        <div className="text-center mt-10 fade-up">
          <Link href="/grille" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-md">
            <Trophy className="w-4 h-4" /> Voir la grille en cours
          </Link>
        </div>
        
      </div>
      <ClientWrapper />
    </div>
  );
}