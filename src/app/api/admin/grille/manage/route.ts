import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { finishGrille } from '@/lib/grille-finish';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { action, grilleId, race, montantReverseCents, preuveUrl } = await req.json();
  if (!action || !grilleId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  const admin = createAdminClient();

  // Modifier la race secrète (seulement si pas encore devinée)
  if (action === 'set-race') {
    if (!race?.trim()) return NextResponse.json({ error: 'Race vide' }, { status: 400 });
    const { data: g } = await admin.from('pixel_grilles').select('gagnant_devinette_id').eq('id', grilleId).single();
    if (g?.gagnant_devinette_id) return NextResponse.json({ error: 'Race déjà devinée, modification impossible' }, { status: 400 });
    await admin.from('pixel_grilles').update({ race_secrete: race.trim() }).eq('id', grilleId);
    return NextResponse.json({ success: true });
  }

  // Terminer manuellement la grille (comme une fin par compte à rebours)
  if (action === 'terminate') {
    await admin.from('pixel_grilles').update({ ends_at: new Date().toISOString() }).eq('id', grilleId);
    const winners = await finishGrille(admin, grilleId, 'countdown');
    return NextResponse.json({ success: true, winners });
  }

  // Enregistrer le don (montant reversé + preuve)
  if (action === 'set-don') {
    await admin.from('pixel_grilles').update({
      montant_reverse_cents: montantReverseCents ?? null,
      preuve_don_url: preuveUrl ?? null,
    }).eq('id', grilleId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
