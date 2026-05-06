import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAwinProducts, AWIN_CATEGORY_SEARCH } from '@/lib/awin';
import type { AwinProduct } from '@/types';

// Déclenché toutes les 24h par Vercel Cron (vercel.json)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publisherId = process.env.AWIN_PUBLISHER_ID;
  const apiToken    = process.env.AWIN_API_TOKEN;

  if (!publisherId || !apiToken) {
    return NextResponse.json({ error: 'Clés Awin manquantes' }, { status: 503 });
  }

  const categories = Object.keys(AWIN_CATEGORY_SEARCH) as AwinProduct['category'][];
  const supabase = createAdminClient();
  let totalSynced = 0;

  for (const category of categories) {
    const products = await fetchAwinProducts(publisherId, apiToken, category, 30);
    if (!products.length) continue;

    const { error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' });

    if (error) {
      console.error(`[awin-sync] Erreur upsert ${category}:`, error);
    } else {
      totalSynced += products.length;
    }
  }

  return NextResponse.json({ success: true, synced: totalSynced });
}
