import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Lock, Zap } from 'lucide-react';

export default async function GrilleSection() {
  const supabase = createAdminClient();
  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id, grille_taille, statut')
    .eq('statut', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!grille) return null;

  const { data: achats } = await supabase
    .from('pixel_achats')
    .select('positions, acheteur_email')
    .eq('grille_id', grille.id)
    .not('confirmed_at', 'is', null);

  const total = grille.grille_taille * grille.grille_taille;
  const vendus = (achats ?? []).reduce((s, a) => s + (a.positions as number[]).length, 0);
  const pct = (vendus / total) * 100;
  const pctLabel = vendus > 0 && pct < 1 ? pct.toFixed(2).replace('.', ',') : String(Math.round(pct));
  const joueurs = new Set((achats ?? []).map(a => a.acheteur_email.toLowerCase().trim())).size;

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-orange-50 to-gray-50 reveal-color">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 fade-up">
          <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">Jeu en cours</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">Grille Mystère</h2>
          <p className="text-gray-600 mt-3 text-lg">Révélez l&apos;image, devinez la race, gagnez un cadeau</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-md border border-gray-100 stagger-container">
          {/* Image - zoom au scroll */}
          <div className="md:w-2/5 zoom-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/grille/${grille.id}/image`}
              alt="Grille mystère"
              className="w-full h-full object-cover aspect-square"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          {/* Texte - slide depuis la droite */}
          <div className="md:w-3/5 p-8 flex flex-col justify-center slide-right stagger-child">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-orange-600 text-xs font-medium mb-3 w-fit pulse-soft">
              <Lock className="w-3 h-3" /> Qui se cache derrière les pixels ?
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Achète des pixels pour révéler la photo mystère, devine la race en premier et gagne un cadeau surprise.
              Une partie des recettes est reversée à un refuge animalier ou une association.
            </p>
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-900">{pctLabel}% révélé</span>
                {joueurs > 0 && (
                  <span className="text-gray-500">{joueurs} joueur{joueurs > 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full glow-on-hover" style={{ width: `${Math.max(pct, 0.5)}%` }} />
              </div>
            </div>
            <Link
              href="/grille"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl w-full md:w-fit flex items-center justify-center gap-2 transition-colors glow-on-hover"
            >
              <Zap className="w-4 h-4 rotate-icon" /> Jouer maintenant
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}