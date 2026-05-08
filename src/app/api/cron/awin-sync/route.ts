import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAllAwinProducts } from '@/lib/awin';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publisherId = process.env.AWIN_PUBLISHER_ID;
  const feedToken   = process.env.AWIN_FEED_TOKEN ?? process.env.AWIN_API_TOKEN;

  if (!publisherId || !feedToken) {
    return NextResponse.json({ error: 'Clés Awin manquantes' }, { status: 503 });
  }

  const supabase = createAdminClient();
  const products = await fetchAllAwinProducts(publisherId, feedToken, 30);

  const { error } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'id' });

  if (error) console.error('[awin-sync] Erreur upsert:', error);

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Awin sync] ${products.length} produits synchronisés`,
    status: error ? 'error' : 'success',
  });

  return NextResponse.json({ success: !error, synced: products.length });
}
