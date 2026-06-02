import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();

  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id, animal, statut, grille_taille, gagnant_devinette_id')
    .eq('statut', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!grille) return NextResponse.json({ grille: null, top3: [] });

  const { data: achats } = await supabase
    .from('pixel_achats')
    .select('id, acheteur_prenom, positions, confirmed_at')
    .eq('grille_id', grille.id)
    .not('confirmed_at', 'is', null);

  const buyerMap = new Map<string, number>();
  let totalVendus = 0;
  achats?.forEach(achat => {
    const n = achat.positions.length;
    totalVendus += n;
    buyerMap.set(achat.acheteur_prenom, (buyerMap.get(achat.acheteur_prenom) ?? 0) + n);
  });

  // Dernier achat confirmé (pour le toast "X vient d'acheter")
  const dernier = [...(achats ?? [])]
    .sort((a, b) => new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime())[0];
  const dernierAchat = dernier
    ? { prenom: dernier.acheteur_prenom, pixels: dernier.positions.length, at: dernier.confirmed_at }
    : null;

  const top3 = Array.from(buyerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([prenom, total], i) => ({ rang: i + 1, prenom, total }));

  const totalPixels = grille.grille_taille * grille.grille_taille;

  const gagnantPrenom = grille.gagnant_devinette_id
    ? achats?.find(a => a.id === grille.gagnant_devinette_id)?.acheteur_prenom ?? null
    : null;

  return NextResponse.json({
    grille: {
      id: grille.id,
      animal: grille.animal,
      pixels_vendus: totalVendus,
      total_pixels: totalPixels,
      pourcentage: Math.round((totalVendus / totalPixels) * 100),
      gagnant_trouve: !!grille.gagnant_devinette_id,
      gagnant_prenom: gagnantPrenom,
    },
    top3,
    dernier_achat: dernierAchat,
  });
}
