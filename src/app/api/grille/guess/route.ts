import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { finishGrille } from '@/lib/grille-finish';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const normalize = (s: string) =>
  s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

export async function POST(req: NextRequest) {
  // Anti-abus : max 10 tentatives / minute / IP
  const ip = getClientIP(req);
  const rl = await checkRateLimit(`grille-guess:${ip}`, 60000, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans une minute.' }, { status: 429 });
  }

  const { sessionId, devinette } = await req.json();

  if (!sessionId || !devinette?.trim()) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: achat } = await supabase
    .from('pixel_achats')
    .select('id, grille_id, devinette')
    .eq('stripe_session_id', sessionId)
    .not('confirmed_at', 'is', null)
    .single();

  if (!achat) {
    return NextResponse.json({ error: 'Achat introuvable' }, { status: 404 });
  }

  if (achat.devinette) {
    return NextResponse.json({ error: 'Devinette déjà soumise' }, { status: 400 });
  }

  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('race_secrete, gagnant_devinette_id')
    .eq('id', achat.grille_id)
    .single();

  if (!grille) return NextResponse.json({ error: 'Grille introuvable' }, { status: 404 });

  const correct = normalize(devinette) === normalize(grille.race_secrete);

  await supabase
    .from('pixel_achats')
    .update({ devinette: devinette.trim(), devinette_correcte: correct })
    .eq('id', achat.id);

  // Premier à trouver la bonne réponse → devient le gagnant + termine la grille.
  // Update ATOMIQUE conditionné à `gagnant_devinette_id IS NULL` : si deux bonnes
  // réponses arrivent en même temps, une seule "revendique" le gagnant (Postgres
  // verrouille la ligne). Seul ce call déclenche finishGrille → pas de double email.
  if (correct && !grille.gagnant_devinette_id) {
    const { data: claimed } = await supabase
      .from('pixel_grilles')
      .update({ gagnant_devinette_id: achat.id })
      .eq('id', achat.grille_id)
      .is('gagnant_devinette_id', null)
      .select('id')
      .maybeSingle();
    if (claimed) {
      // Fin de grille : dates, CSV backup, emails (participants + gagnants + admin)
      await finishGrille(supabase, achat.grille_id, 'guessed');
    }
  }

  return NextResponse.json({ correct, race: correct ? grille.race_secrete : null });
}
