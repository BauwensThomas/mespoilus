import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { finishGrille, activateNextGrille } from '@/lib/grille-finish';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const actions: string[] = [];

  // 1. Terminer les grilles actives dont le compte à rebours est écoulé
  const { data: expired } = await supabase
    .from('pixel_grilles')
    .select('id, ends_at')
    .eq('statut', 'active')
    .not('ends_at', 'is', null)
    .lte('ends_at', new Date().toISOString());

  for (const g of expired ?? []) {
    const winners = await finishGrille(supabase, g.id, 'countdown');
    actions.push(`Grille ${g.id.slice(0, 8)} terminée (compte à rebours), ${winners?.length ?? 0} gagnants`);
  }

  // 2. Activer la prochaine grille si la phase de résultats (7j) est passée
  const activated = await activateNextGrille(supabase);
  if (activated) actions.push(`Grille ${activated.slice(0, 8)} activée`);

  return NextResponse.json({ success: true, actions });
}
