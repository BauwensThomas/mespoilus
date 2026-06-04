import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { computeGrilleResults } from '@/lib/grille-finish';
import { Trophy, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">Historique</span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Les grilles passées</h1>
          <p className="text-gray-600 mt-3">Les animaux révélés et leurs gagnants. Merci à tous les participants !</p>
          {totalReverseCents > 0 && (
            <p className="inline-block mt-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-full px-4 py-1.5">
              ❤️ {(totalReverseCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })} reversés aux refuges
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Aucune grille terminée pour le moment.</p>
            <Link href="/grille" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Jouer à la grille en cours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(({ grille, winners }) => (
              <div key={grille.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/grille/${grille.id}/image`}
                  alt={`Grille révélée - ${grille.race_secrete}`}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-1">
                    {grille.ends_at ? new Date(grille.ends_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </p>
                  <h2 className="font-bold text-gray-900 mb-3">{grille.race_secrete}</h2>
                  {winners.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucun participant.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {winners.map((w) => (
                        <li key={w.rang} className="flex items-center gap-2 text-sm">
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
                        <a href={grille.preuve_don_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline ml-2">
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

        <div className="text-center mt-10">
          <Link href="/grille" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            <Trophy className="w-4 h-4" /> Voir la grille en cours
          </Link>
        </div>
      </div>
    </div>
  );
}
