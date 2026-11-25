import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { finishGrille } from '@/lib/grille-finish';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SITE_SETTINGS_TAG, setGrilleVisible } from '@/lib/site-settings';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { action, grilleId, race, montantReverseCents, preuveUrl, visible } = await req.json();

  // Interrupteur de visibilité du jeu (réglage global, pas lié à une grille)
  if (action === 'set-visibility') {
    if (typeof visible !== 'boolean') return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 });
    try {
      await setGrilleVisible(visible);
    } catch (e) {
      console.error('[grille] set-visibility:', e);
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 });
    }
    // Le menu est sur toutes les pages : on régénère tout le site
    revalidateTag(SITE_SETTINGS_TAG);
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    revalidatePath('/llms.txt');
    return NextResponse.json({ success: true, visible });
  }

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
