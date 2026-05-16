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
  const syncStart = new Date().toISOString();

  await supabase.from('awin_sync_progress').upsert({
    category,
    status: 'running',
    synced: 0,
    current_feed: null,
    error: null,
    started_at: syncStart,
    updated_at: syncStart,
    finished_at: null,
  });

  // NE PAS supprimer les produits avant la sync — si les feeds échouent,
  // on conserve les anciens produits. Nettoyage post-sync uniquement si succès.

  let lastError: string | null = null;
  let totalSynced = 0;
  const feedErrors: string[] = [];

  try {
    totalSynced = await fetchAwinProductsByCategory(
      publisherId,
      feedToken,
      category,
      async (batch) => {
        const { error } = await supabase
          .from('products')
          .upsert(batch, { onConflict: 'id' });
        if (error) {
          const msg = `upsert error: ${error.message}`;
          console.error(`[awin:${category}] ${msg}`);
          feedErrors.push(msg);
          lastError = error.message;
        }
      },
      async (synced, currentFeed) => {
        await supabase.from('awin_sync_progress').update({
          synced,
          current_feed: currentFeed,
          updated_at: new Date().toISOString(),
        }).eq('category', category);
      },
      (merchantName, errMsg) => {
        feedErrors.push(`${merchantName}: ${errMsg}`);
        lastError = errMsg;
      }
    );
  } catch (e) {
    lastError = e instanceof Error ? e.message : 'Erreur inconnue';
    feedErrors.push(lastError);
  }

  if (totalSynced > 0 && !lastError) {
    // Supprimer les produits Awin de cette catégorie qui n'ont PAS été mis à jour lors de ce sync
    // Exclure les produits ajoutés manuellement (Amazon FR, CanadaPetCare) pour ne pas les écraser
    await supabase.from('products')
      .delete()
      .eq('category', category)
      .lt('last_synced', syncStart)
      .not('merchant_name', 'in', '("Amazon FR","CanadaPetCare")');
  }

  const finalError = feedErrors.length > 0 ? feedErrors.join(' | ') : null;

  await supabase.from('awin_sync_progress').update({
    status: finalError ? 'error' : (totalSynced === 0 ? 'done' : 'done'),
    synced: totalSynced,
    current_feed: null,
    error: finalError,
    updated_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  }).eq('category', category);

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Awin sync:${category}] ${totalSynced} produits synchronisés`,
    details: feedErrors.length > 0 ? { feedErrors } : {},
    status: finalError ? 'error' : 'success',
  });

  return NextResponse.json({ success: !finalError, category, synced: totalSynced, feedErrors });
}
