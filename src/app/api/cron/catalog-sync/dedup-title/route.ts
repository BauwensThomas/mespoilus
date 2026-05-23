import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pairs, error } = await supabase
    .rpc('get_duplicate_titles');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pairs?.length) {
    return NextResponse.json({ success: true, merged: 0, deleted: 0, message: 'Aucun doublon titre trouve' });
  }

  let totalDeleted = 0;
  let lastError: string | null = null;

  for (const { winner_id, duplicate_id } of pairs) {
    try {
      await supabase
        .from('product_offers')
        .update({ catalog_id: winner_id })
        .eq('catalog_id', duplicate_id);

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

  return NextResponse.json({
    success: !lastError,
    merged: totalDeleted,
    deleted: totalDeleted,
    groups: pairs.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
