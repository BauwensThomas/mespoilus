import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import GrilleView from './_components/GrilleView';
import GrilleResults from './_components/GrilleResults';
import { computeGrilleResults } from '@/lib/grille-finish';

const DESCRIPTION = 'Achète des pixels pour révéler une photo mystère, devine la race de l\'animal en premier et gagne un cadeau. Une partie des recettes est reversée à un refuge animalier ou une association.';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: g } = await supabase
    .from('pixel_grilles')
    .select('id')
    .in('statut', ['active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mespoilus.com';
  const ogImage = g ? `${siteUrl}/api/grille/${g.id}/image?fmt=jpg` : `${siteUrl}/icon.svg`;

  return {
    title: 'Grille Mystère - Mes Poilus',
    description: DESCRIPTION,
    robots: { index: true, follow: true },
    alternates: { canonical: '/grille' },
    openGraph: {
      title: 'Grille Mystère - Qui se cache derrière les pixels ?',
      description: DESCRIPTION,
      url: '/grille',
      type: 'website',
      images: [{ url: ogImage, width: 750, height: 750, alt: 'Grille Mystère Mes Poilus' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Grille Mystère - Mes Poilus',
      description: DESCRIPTION,
      images: [ogImage],
    },
  };
}

export const revalidate = 0;

export default async function GrillePage() {
  const supabase = createAdminClient();

  // ── 1. Grille active ───────────────────────────────────
  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id, animal, grille_taille, gagnant_devinette_id, ends_at')
    .eq('statut', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (grille) {
    const { data: achats } = await supabase
      .from('pixel_achats')
      .select('acheteur_prenom, positions')
      .eq('grille_id', grille.id)
      .not('confirmed_at', 'is', null);

    const buyerMap = new Map<string, number>();
    let totalVendus = 0;
    achats?.forEach(achat => {
      const n = (achat.positions as number[]).length;
      totalVendus += n;
      buyerMap.set(achat.acheteur_prenom, (buyerMap.get(achat.acheteur_prenom) ?? 0) + n);
    });

    const top3 = Array.from(buyerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([prenom, total], i) => ({ rang: i + 1, prenom, total }));

    return (
      <GrilleView
        grilleId={grille.id}
        animal={grille.animal}
        pixelsVendus={totalVendus}
        totalPixels={grille.grille_taille * grille.grille_taille}
        top3Initial={top3}
        gagnantTrouve={!!grille.gagnant_devinette_id}
        endsAt={grille.ends_at ?? null}
      />
    );
  }

  // ── 2. Grille terminée encore dans la phase résultats (7j) ──
  const { data: completed } = await supabase
    .from('pixel_grilles')
    .select('id, animal, race_secrete, grille_taille, gagnant_devinette_id, created_at, ends_at, next_starts_at')
    .eq('statut', 'completed')
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (completed && completed.next_starts_at && new Date(completed.next_starts_at) > new Date()) {
    const { winners } = await computeGrilleResults(supabase, completed);
    return (
      <GrilleResults
        grilleId={completed.id}
        raceSecrete={completed.race_secrete}
        winners={winners.map(w => ({ rang: w.rang, prenom: w.prenom, raison: w.raison }))}
        nextStartsAt={completed.next_starts_at}
      />
    );
  }

  // ── 3. Aucune grille en cours ──────────────────────────
  const dateProchaine = completed?.next_starts_at
    ? new Date(completed.next_starts_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aucune grille en cours</h1>
        <p className="text-gray-600">
          {dateProchaine
            ? <>La prochaine grille mystère démarre le <span className="font-semibold text-orange-600">{dateProchaine}</span>.</>
            : 'Reviens bientôt pour la prochaine grille mystère !'}
        </p>
      </div>
    </div>
  );
}
