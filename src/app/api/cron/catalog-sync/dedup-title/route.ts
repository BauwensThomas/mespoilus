import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Trouver les paires winner/doublon via SQL (gestion Unicode fiable)
  const { data: pairs, error } = await supabase
    .rpc('get_duplicate_titles');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pairs?.length) {
    try {
      await sendEmail({
        to: 'contact@mespoilus.com',
        subject: '[Mes Poilus] Fusion doublons Titre — Aucun doublon trouvé',
        html: cronEmailWrapper('Fusion doublons Titre terminée', 'Catalogue · Boutique',
          '<p style="color:#6b7280;font-size:14px">Aucun doublon titre détecté dans le catalogue.</p>'),
      });
    } catch (e) { console.error('[dedup-title] email erreur:', e); }
    return NextResponse.json({ success: true, merged: 0, deleted: 0, message: 'Aucun doublon titre trouve' });
  }

  let totalDeleted = 0;
  let lastError: string | null = null;

  for (const { winner_id, duplicate_id } of pairs) {
    try {
      // Migrer les offres du doublon vers le gagnant
      await supabase
        .from('product_offers')
        .update({ catalog_id: winner_id })
        .eq('catalog_id', duplicate_id);

      // Supprimer la fiche doublon
      await supabase
        .from('products_catalog')
        .delete()
        .eq('id', duplicate_id);

      totalDeleted++;
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Dedup titre] ${totalDeleted} fiches doublons supprimees`,
    details: lastError ? { error: lastError } : { pairs: pairs.length },
    status: lastError ? 'error' : 'success',
  });

  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Fusion doublons Titre — ${totalDeleted} fiche${totalDeleted > 1 ? 's' : ''} fusionnée${totalDeleted > 1 ? 's' : ''}`,
      html: cronEmailWrapper(
        'Fusion doublons Titre terminée',
        'Catalogue · Boutique',
        statsRow([
          { label: 'Groupes détectés',  value: pairs.length, color: '#f97316' },
          { label: 'Fiches supprimées', value: totalDeleted,  color: '#dc2626' },
        ]) + (lastError ? `<p style="color:#dc2626;font-size:13px;margin-top:12px">⚠ Erreur : ${lastError}</p>` : ''),
      ),
    });
  } catch (e) { console.error('[dedup-title] email erreur:', e); }

  return NextResponse.json({
    success: !lastError,
    merged: totalDeleted,
    deleted: totalDeleted,
    groups: pairs.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
