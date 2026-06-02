import { createAdminClient } from '@/lib/supabase/server';
import GrilleAdminClient from './GrilleAdminClient';

export const dynamic = 'force-dynamic';

export interface AchatRow {
  id: string;
  prenom: string;
  email: string;
  pixels: number;
  montant_cents: number;
  devinette: string | null;
  devinette_correcte: boolean;
  created_at: string;
}

export default async function GrilleAdminPage() {
  const supabase = createAdminClient();

  const COLS = 'id, animal, race_secrete, statut, grille_taille, pixels_vendus, gagnant_devinette_id, created_at, ends_at, montant_reverse_cents, preuve_don_url';

  // Priorité d'affichage : grille active > dernière terminée > (à défaut) la plus récente
  let { data: grille } = await supabase
    .from('pixel_grilles').select(COLS)
    .eq('statut', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (!grille) {
    ({ data: grille } = await supabase
      .from('pixel_grilles').select(COLS)
      .eq('statut', 'completed')
      .order('ends_at', { ascending: false }).limit(1).maybeSingle());
  }
  if (!grille) {
    ({ data: grille } = await supabase
      .from('pixel_grilles').select(COLS)
      .order('created_at', { ascending: false }).limit(1).maybeSingle());
  }

  if (!grille) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Aucune grille trouvée.</p>
      </div>
    );
  }

  const { data: achats } = await supabase
    .from('pixel_achats')
    .select('id, acheteur_prenom, acheteur_email, positions, montant_cents, devinette, devinette_correcte, confirmed_at, created_at')
    .eq('grille_id', grille.id)
    .not('confirmed_at', 'is', null)
    .order('created_at', { ascending: false });

  const rows: AchatRow[] = (achats ?? []).map(a => ({
    id: a.id,
    prenom: a.acheteur_prenom,
    email: a.acheteur_email,
    pixels: (a.positions as number[]).length,
    montant_cents: a.montant_cents,
    devinette: a.devinette,
    devinette_correcte: a.devinette_correcte,
    created_at: a.created_at,
  }));

  // Agrégation par acheteur (email) pour le classement
  const buyerMap = new Map<string, { prenom: string; email: string; pixels: number }>();
  rows.forEach(r => {
    const cur = buyerMap.get(r.email) ?? { prenom: r.prenom, email: r.email, pixels: 0 };
    cur.pixels += r.pixels;
    buyerMap.set(r.email, cur);
  });
  const classement = Array.from(buyerMap.values()).sort((a, b) => b.pixels - a.pixels);

  // Gagnant de la devinette
  const gagnantDevinette = grille.gagnant_devinette_id
    ? rows.find(r => r.id === grille.gagnant_devinette_id) ?? null
    : null;

  // File d'attente des grilles programmées
  const { data: scheduled } = await supabase
    .from('pixel_grilles')
    .select('id, animal, race_secrete, ordre')
    .eq('statut', 'scheduled')
    .order('ordre', { ascending: true });

  return (
    <GrilleAdminClient
      grille={{
        id: grille.id,
        animal: grille.animal,
        race_secrete: grille.race_secrete,
        statut: grille.statut,
        total_pixels: grille.grille_taille * grille.grille_taille,
        created_at: grille.created_at,
        ends_at: grille.ends_at ?? null,
        montant_reverse_cents: grille.montant_reverse_cents ?? null,
        preuve_don_url: grille.preuve_don_url ?? null,
      }}
      rows={rows}
      classement={classement}
      gagnantDevinette={gagnantDevinette ? { prenom: gagnantDevinette.prenom, email: gagnantDevinette.email } : null}
      scheduled={(scheduled ?? []).map(s => ({ id: s.id, animal: s.animal, race_secrete: s.race_secrete, ordre: s.ordre }))}
    />
  );
}
