import { createAdminClient } from '@/lib/supabase/server';
import { fetchAwinProductsByCategory, type AwinSyncCategory } from '@/lib/awin';
import { NextResponse } from 'next/server';

export async function runAwinSyncForCategory(
  req: Request,
  category: AwinSyncCategory
): Promise<Response> {
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

  // Marquer comme "running" avec remise à zéro du compteur
  await supabase.from('awin_sync_progress').upsert({
    category,
    status: 'running',
    synced: 0,
    current_feed: null,
    error: null,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    finished_at: null,
  });

  // Vider les anciens produits de cette catégorie avant la sync
  await supabase.from('products').delete().eq('category', category);

  let lastError: string | null = null;
  let totalSynced = 0;

  try {
    totalSynced = await fetchAwinProductsByCategory(
      publisherId,
      feedToken,
      category,
      // onBatch : upsert immédiat, libère la RAM
      async (batch) => {
        const { error } = await supabase
          .from('products')
          .upsert(batch, { onConflict: 'id' });
        if (error) {
          console.error(`[awin:${category}] upsert error:`, error);
          lastError = error.message;
        }
      },
      // onProgress : mise à jour de la progression en BDD
      async (synced, currentFeed) => {
        await supabase.from('awin_sync_progress').update({
          synced,
          current_feed: currentFeed,
          updated_at: new Date().toISOString(),
        }).eq('category', category);
      }
    );
  } catch (e) {
    lastError = e instanceof Error ? e.message : 'Erreur inconnue';
  }

  // Marquer comme done ou error
  await supabase.from('awin_sync_progress').update({
    status: lastError ? 'error' : 'done',
    synced: totalSynced,
    current_feed: null,
    error: lastError,
    updated_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  }).eq('category', category);

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Awin sync:${category}] ${totalSynced} produits synchronisés`,
    status: lastError ? 'error' : 'success',
  });

  return NextResponse.json({ success: !lastError, category, synced: totalSynced });
}
