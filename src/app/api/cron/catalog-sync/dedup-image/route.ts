import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Productserve wrappe l'image réelle dans un param ?url=ssl%3A...&feedId=XXXXX
// Le feedId diffère entre NL (89885) et FR (89886) → même image, URL différente
// On extrait le chemin interne pour matcher correctement
function innerImageKey(imageUrl: string): string {
  try {
    const m = imageUrl.match(/[?&]url=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
  } catch { /* */ }
  return imageUrl;
}

// Mots néerlandais dans les noms produits → version NL à éliminer en priorité
const DUTCH_PATTERNS = [
  /\bvoerbak\b/i, /\bdrinkbak\b/i, /\bkrabpaal\b/i, /\bkattenbak\b/i,
  /\bspeelgoed\b/i, /\bhalsband\b/i, /\bborstel\b/i, /\bvlooienkam\b/i,
  /\bkooitje\b/i, /\bknaagsteen\b/i, /\bstarterset\b/i, /\bstarter\s+set\b/i,
  /\bvoor\s+(honden|katten|konijnen|knaagdieren|vogels)\b/i,
  /\bvezel(respons|rijk|arm)?\b/i, /\bspijsvertering\b/i,
  /\bhuidgezondheid\b/i, /\bgewrichten\b/i, /\bsterilisatie\b/i,
  /\bkortharige?\b/i, /\blangharige?\b/i, /\buitgebalanceerd\b/i,
  /\bdroogvoeding\b/i, /\bdroogvoer\b/i, /\bnatvoeding\b/i, /\bnatvoer\b/i,
  /\bgevogelte\b/i, /\bgraanvrij\b/i, /\bkonijn\b/i,
  /\bzalm\b/i, /\bhonden\b/i, /\bkatten\b/i,
];

function isDutch(name: string): boolean {
  return DUTCH_PATTERNS.some(re => re.test(name));
}

// Plus le score est élevé, plus la fiche est complète → winner
function scoreProduct(p: { image_url: string | null; description: string | null; brand: string | null; name_fr: string | null }): number {
  return (p.image_url   ? 3 : 0)
       + (p.description ? 2 : 0)
       + (p.brand       ? 1 : 0)
       + (p.name_fr     ? 1 : 0);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Charger tous les produits actifs qui ont une image_url - pagination 1000/page
  const allProducts: { id: string; name: string; image_url: string | null; ean: string | null; category: string | null; created_at: string; description: string | null; brand: string | null; name_fr: string | null }[] = [];
  const PAGE = 1000;
  for (let start = 0; ; start += PAGE) {
    const { data: page, error } = await supabase
      .from('products_catalog')
      .select('id, name, image_url, ean, category, created_at, description, brand, name_fr')
      .not('image_url', 'is', null)
      .eq('status', 'active')
      .range(start, start + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!page || page.length === 0) break;
    allProducts.push(...page);
    if (page.length < PAGE) break;
  }

  const products = allProducts;
  const productsLoaded = products.length;

  // 2. Grouper par clé image interne (ignore feedId Productserve)
  const imageGroups = new Map<string, typeof products>();
  for (const p of products) {
    if (!p.image_url) continue;
    const key = innerImageKey(p.image_url);
    const group = imageGroups.get(key) ?? [];
    group.push(p);
    imageGroups.set(key, group);
  }

  const multiGroups = [...imageGroups.values()].filter(g => g.length >= 2).length;
  const dutchDetected = products.filter(p => isDutch(p.name)).length;

  const sampleKeys = multiGroups > 0
    ? [...imageGroups.entries()]
        .filter(([, g]) => g.length >= 2)
        .slice(0, 3)
        .map(([key, g]) => ({ key: key.slice(0, 80), names: g.map(p => p.name) }))
    : products
        .filter(p => isDutch(p.name))
        .slice(0, 3)
        .map(p => ({ key: innerImageKey(p.image_url ?? '').slice(0, 80), names: [p.name] }));

  // 3. Pour chaque groupe avec 2+ produits, deux règles de fusion :
  //
  //    Règle 1 — même image + même nom (insensible à la casse) :
  //      → vrais doublons (ex: Maxi Zoo BE + Maxi Zoo FR avec même nom FR)
  //      → on garde le plus ancien, offres déplacées
  //
  //    Règle 2 — même image + un nom néerlandais + un nom non-NL :
  //      → version NL d'un produit FR → fusion NL dans non-NL
  //
  //    PAS de fusion si : noms différents ET aucun n'est NL
  //    (ex: pack x1 vs pack x2 avec la même image générique du fabricant)
  let totalDeleted = 0;
  let totalMerged = 0;
  let lastError: string | null = null;
  const pairs: Array<{ winner: string; winnerName: string; duplicate: string; duplicateName: string }> = [];

  for (const [, group] of imageGroups) {
    if (group.length < 2) continue;

    const handledIds = new Set<string>();

    // Règle 1 : sous-grouper par nom normalisé et fusionner les noms identiques
    const nameGroups = new Map<string, typeof group>();
    for (const p of group) {
      const key = p.name.toLowerCase().trim();
      const ng = nameGroups.get(key) ?? [];
      ng.push(p);
      nameGroups.set(key, ng);
    }

    for (const [, ng] of nameGroups) {
      if (ng.length < 2) continue;
      // Winner = fiche la plus complète (score), ex-aequo → la plus récente
      const sorted = [...ng].sort((a, b) => {
        const diff = scoreProduct(b) - scoreProduct(a);
        return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      const winner = sorted[0];
      for (const dup of sorted.slice(1)) {
        pairs.push({ winner: winner.id, winnerName: winner.name, duplicate: dup.id, duplicateName: dup.name });
        handledIds.add(dup.id);
      }
      handledIds.add(winner.id);
    }

    // Règle 2 : NL + non-NL dans le même groupe image (noms différents mais même image)
    const dutch    = group.filter(p => isDutch(p.name) && !handledIds.has(p.id));
    const nonDutch = group.filter(p => !isDutch(p.name) && !handledIds.has(p.id));

    if (dutch.length > 0 && nonDutch.length > 0) {
      // Winner non-NL = fiche la plus complète
      const winner = nonDutch.sort((a, b) => {
        const diff = scoreProduct(b) - scoreProduct(a);
        return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })[0];
      for (const dup of dutch) {
        pairs.push({ winner: winner.id, winnerName: winner.name, duplicate: dup.id, duplicateName: dup.name });
        handledIds.add(dup.id);
      }
    }
  }

  // 4. Fusionner : déplacer les offres vers le winner, supprimer la fiche doublon
  for (const { winner, duplicate } of pairs) {
    try {
      await supabase
        .from('product_offers')
        .update({ catalog_id: winner })
        .eq('catalog_id', duplicate);

      await supabase
        .from('products_catalog')
        .delete()
        .eq('id', duplicate);

      totalMerged++;
      totalDeleted++;
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
    }
  }

  // 5. Nettoyer les offres dupliquées sur un même winner (même marchand + même URL)
  //    Après fusion, un winner peut avoir plusieurs offres du même marchand si
  //    le même produit était vendu avec des URLs différentes.
  const winnerIds = [...new Set(pairs.map(p => p.winner))];
  let offersDeduped = 0;

  for (const winnerId of winnerIds) {
    const { data: offers } = await supabase
      .from('product_offers')
      .select('id, merchant_name, affiliate_url, price')
      .eq('catalog_id', winnerId)
      .order('price', { ascending: true });

    if (!offers || offers.length < 2) continue;

    // Par marchand, garder seulement l'offre la moins chère (première après tri ASC)
    const seenMerchants = new Set<string>();
    for (const offer of offers) {
      if (seenMerchants.has(offer.merchant_name)) {
        await supabase.from('product_offers').delete().eq('id', offer.id);
        offersDeduped++;
      } else {
        seenMerchants.add(offer.merchant_name);
      }
    }
  }

  // 6. Supprimer les fiches NL orphelines (Dutch, pas d'équivalent avec même image)
  const mergedDuplicateIds = new Set(pairs.map(p => p.duplicate));
  const orphanDutch = products.filter(p => isDutch(p.name) && !mergedDuplicateIds.has(p.id));
  let totalOrphanDeleted = 0;

  if (orphanDutch.length > 0) {
    const orphanIds = orphanDutch.map(p => p.id);
    const { data: withOffers } = await supabase
      .from('product_offers')
      .select('catalog_id')
      .in('catalog_id', orphanIds);
    const withOffersSet = new Set((withOffers ?? []).map(o => o.catalog_id));

    for (const p of orphanDutch) {
      try {
        if (withOffersSet.has(p.id)) {
          await supabase.from('product_offers').delete().eq('catalog_id', p.id);
        }
        await supabase.from('products_catalog').delete().eq('id', p.id);
        totalOrphanDeleted++;
        totalDeleted++;
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      }
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Dedup image] ${totalDeleted} fiches doublons supprimees (${pairs.length} paires + ${totalOrphanDeleted} NL orphelines), ${offersDeduped} offres dedoublonnees`,
    details: lastError ? { error: lastError } : { pairs: pairs.length, orphans: totalOrphanDeleted, offersDeduped },
    status: lastError ? 'error' : 'success',
  });

  return NextResponse.json({
    success: !lastError,
    pairs: pairs.length,
    orphans: totalOrphanDeleted,
    deleted: totalDeleted,
    offersDeduped,
    details: pairs.map(p => ({ winner: p.winnerName, removed: p.duplicateName })),
    debug: { productsLoaded, multiGroups, dutchDetected, sampleKeys },
    ...(lastError ? { error: lastError } : {}),
  });
}
