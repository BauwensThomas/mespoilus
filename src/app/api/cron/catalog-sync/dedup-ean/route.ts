import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

function scoreEntry(entry: {
  image_url: string | null;
  description: string | null;
  brand: string | null;
  name_fr: string | null;
}): number {
  return (entry.image_url ? 3 : 0)
    + (entry.description ? 2 : 0)
    + (entry.brand ? 1 : 0)
    + (entry.name_fr ? 1 : 0);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Trouver les EANs en double dans products_catalog
  const { data: dupEans, error: dupError } = await supabase
    .rpc('get_duplicate_eans');

  if (dupError) {
    return NextResponse.json({ error: dupError.message }, { status: 500 });
  }

  if (!dupEans?.length) {
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: '[Dedup EAN] 0 doublon EAN trouve',
      details: {},
      status: 'success',
    });
    return NextResponse.json({ success: true, merged: 0, deleted: 0, message: 'Aucun doublon EAN trouve' });
  }

  const eans: string[] = dupEans.map((r: { ean: string }) => r.ean);

  // 2. Charger toutes les fiches concernées
  const { data: entries, error: entriesError } = await supabase
    .from('products_catalog')
    .select('id, ean, image_url, description, brand, name_fr, status')
    .in('ean', eans);

  if (entriesError) {
    return NextResponse.json({ error: entriesError.message }, { status: 500 });
  }

  // 3. Charger le nombre d'offres par catalog_id pour départager les ex-aequo
  const allIds = (entries ?? []).map(e => e.id);
  const { data: offerCounts } = await supabase
    .rpc('get_offer_counts', { catalog_ids: allIds });

  const countMap = new Map<string, number>();
  for (const row of offerCounts ?? []) {
    countMap.set(row.catalog_id, row.offer_count);
  }

  // 4. Grouper par EAN
  const groups = new Map<string, typeof entries>();
  for (const entry of entries ?? []) {
    if (!entry.ean) continue;
    const group = groups.get(entry.ean) ?? [];
    group.push(entry);
    groups.set(entry.ean, group);
  }

  let totalMerged = 0;
  let totalDeleted = 0;
  let lastError: string | null = null;

  // 5. Pour chaque groupe : garder le meilleur, migrer les offres, supprimer les doublons
  for (const [, group] of groups) {
    if (group.length < 2) continue;

    group.sort((a, b) => {
      const scoreDiff = scoreEntry(b) - scoreEntry(a);
      if (scoreDiff !== 0) return scoreDiff;
      return (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0);
    });

    const winner = group[0];
    const duplicates = group.slice(1);

    for (const dup of duplicates) {
      try {
        await supabase
          .from('product_offers')
          .update({ catalog_id: winner.id })
          .eq('catalog_id', dup.id);

        await supabase
          .from('products_catalog')
          .delete()
          .eq('id', dup.id);

        totalMerged++;
        totalDeleted++;
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      }
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Dedup EAN] ${totalMerged} offres migrées, ${totalDeleted} fiches doublons supprimées`,
    details: lastError ? { error: lastError } : { eans_dedupes: eans.length },
    status: lastError ? 'error' : 'success',
  });

  return NextResponse.json({
    success: !lastError,
    merged: totalMerged,
    deleted: totalDeleted,
    eanGroups: eans.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
