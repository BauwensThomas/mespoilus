import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Charger TOUS les product_offers Amazon par affiliate_url
  const { data: amazonOffers, error: offersError } = await supabase
    .from('product_offers')
    .select('id, catalog_id, affiliate_url, price, source')
    .eq('source', 'amazon');

  if (offersError) {
    return NextResponse.json({ error: offersError.message }, { status: 500 });
  }

  if (!amazonOffers?.length) {
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas',
      agent_name: 'Thomas',
      action: '[Dedup Amazon] Aucun produit Amazon à dédupliquer',
      details: {},
      status: 'success',
    });
    return NextResponse.json({ success: true, merged: 0, deleted: 0 });
  }

  // 2. Charger les fiches produits pour les dates de création
  const catalogIds = [...new Set(amazonOffers.map(o => o.catalog_id))];
  const { data: products, error: productsError } = await supabase
    .from('products_catalog')
    .select('id, created_at')
    .in('id', catalogIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const productMap = new Map((products ?? []).map(p => [p.id, p]));

  // 3. Grouper par affiliate_url pour détecter les doublons
  const groupsByUrl = new Map<
    string,
    Array<{
      catalog_id: string;
      created_at: string;
    }>
  >();

  for (const offer of amazonOffers) {
    const product = productMap.get(offer.catalog_id);
    if (!product) continue;

    const url = offer.affiliate_url;
    const group = groupsByUrl.get(url) ?? [];
    group.push({
      catalog_id: offer.catalog_id,
      created_at: product.created_at,
    });
    groupsByUrl.set(url, group);
  }

  // 4. Fusionner les doublons : garder le plus ancien
  let totalMerged = 0;
  let totalDeleted = 0;
  let lastError: string | null = null;
  const pairs: Array<{ winner: string; duplicate: string }> = [];

  for (const [, group] of groupsByUrl) {
    if (group.length < 2) continue;

    // Trier par date de création (le plus ancien = winner)
    const sorted = group.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const winner = sorted[0];
    for (const dup of sorted.slice(1)) {
      pairs.push({
        winner: winner.catalog_id,
        duplicate: dup.catalog_id,
      });
    }
  }

  // 5. Exécuter les fusions
  for (const { winner, duplicate } of pairs) {
    try {
      // Déplacer les offers vers le winner
      await supabase
        .from('product_offers')
        .update({ catalog_id: winner })
        .eq('catalog_id', duplicate);

      // Supprimer la fiche dupliquée
      await supabase.from('products_catalog').delete().eq('id', duplicate);

      totalMerged++;
      totalDeleted++;
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas',
    agent_name: 'Thomas',
    action: `[Dedup Amazon] ${totalDeleted} fiches Amazon doublons supprimees`,
    details: lastError
      ? { error: lastError }
      : { pairs: pairs.length, merged: totalMerged },
    status: lastError ? 'error' : 'success',
  });

  return NextResponse.json({
    success: !lastError,
    merged: totalMerged,
    deleted: totalDeleted,
    groups: pairs.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
