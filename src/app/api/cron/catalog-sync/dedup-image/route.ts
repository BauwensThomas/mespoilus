import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

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

// Mots néerlandais dans les noms produits → version NL à éliminer
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

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Charger tous les produits actifs qui ont une image_url — pagination 1000/page
  //    (Supabase max_rows = 1000 tronque silencieusement les .limit() plus grands)
  const allProducts: { id: string; name: string; image_url: string | null; ean: string | null; category: string | null; created_at: string }[] = [];
  const PAGE = 1000;
  for (let start = 0; ; start += PAGE) {
    const { data: page, error } = await supabase
      .from('products_catalog')
      .select('id, name, image_url, ean, category, created_at')
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
  for (const p of products ?? []) {
    if (!p.image_url) continue;
    const key = innerImageKey(p.image_url);
    const group = imageGroups.get(key) ?? [];
    group.push(p);
    imageGroups.set(key, group);
  }

  const multiGroups = [...imageGroups.values()].filter(g => (g?.length ?? 0) >= 2).length;
  const dutchDetected = (products ?? []).filter(p => isDutch(p.name)).length;

  // Sample : quelques clés image pour vérifier le format (debug uniquement)
  const sampleKeys = multiGroups > 0
    ? [...imageGroups.entries()]
        .filter(([, g]) => (g?.length ?? 0) >= 2)
        .slice(0, 3)
        .map(([key, g]) => ({ key: key.slice(0, 80), names: (g ?? []).map(p => p.name) }))
    : (products ?? [])
        .filter(p => isDutch(p.name))
        .slice(0, 3)
        .map(p => ({ key: innerImageKey(p.image_url ?? '').slice(0, 80), names: [p.name] }));

  // 3. Trouver les groupes avec au moins un produit NL et un produit non-NL
  let totalDeleted = 0;
  let totalMerged = 0;
  let lastError: string | null = null;
  const pairs: Array<{ winner: string; winnerName: string; duplicate: string; duplicateName: string }> = [];

  for (const [, group] of imageGroups) {
    if (group.length < 2) continue;

    const dutch    = group.filter(p => isDutch(p.name));
    const nonDutch = group.filter(p => !isDutch(p.name));

    // Seulement fusionner si on peut identifier clairement quel est le doublon NL
    if (dutch.length === 0 || nonDutch.length === 0) continue;

    // Winner = le premier non-NL (ou le plus ancien)
    const winner = nonDutch.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];

    for (const dup of dutch) {
      pairs.push({ winner: winner.id, winnerName: winner.name, duplicate: dup.id, duplicateName: dup.name });
    }
  }

  // 4. Fusionner les paires NL/FR (même image)
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

  // 5. Supprimer les fiches NL orphelines (pas d'équivalent FR avec même image)
  //    → produits NL non traités à l'étape 4 ; on supprime aussi leurs offres
  const mergedDuplicateIds = new Set(pairs.map(p => p.duplicate));
  const orphanDutch = products.filter(p => isDutch(p.name) && !mergedDuplicateIds.has(p.id));
  let totalOrphanDeleted = 0;

  if (orphanDutch.length > 0) {
    const orphanIds = orphanDutch.map(p => p.id);
    // Récupérer ceux qui ont des offres actives (à ne pas supprimer à l'aveugle)
    const { data: withOffers } = await supabase
      .from('product_offers')
      .select('catalog_id')
      .in('catalog_id', orphanIds);
    const withOffersSet = new Set((withOffers ?? []).map(o => o.catalog_id));

    for (const p of orphanDutch) {
      try {
        // Supprimer les offres éventuelles d'abord
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
    action: `[Dedup image] ${totalDeleted} fiches NL supprimées (${pairs.length} paires + ${totalOrphanDeleted} orphelines)`,
    details: lastError ? { error: lastError } : { pairs: pairs.length, orphans: totalOrphanDeleted },
    status: lastError ? 'error' : 'success',
  });

  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Fusion doublons Image — ${totalDeleted} fiche${totalDeleted > 1 ? 's' : ''} NL supprimée${totalDeleted > 1 ? 's' : ''}`,
      html: cronEmailWrapper(
        'Fusion doublons Image (NL→FR) terminée',
        'Catalogue · Boutique',
        statsRow([
          { label: 'Paires NL/FR fusionnées',  value: pairs.length,         color: '#f97316' },
          { label: 'Orphelines NL supprimées', value: totalOrphanDeleted,   color: '#dc2626' },
          { label: 'Total supprimées',         value: totalDeleted,         color: '#7c3aed' },
        ]) + (lastError ? `<p style="color:#dc2626;font-size:13px;margin-top:12px">⚠ Erreur : ${lastError}</p>` : '')
          + (totalDeleted === 0 ? '<p style="color:#6b7280;font-size:14px">Aucune fiche NL détectée.</p>' : ''),
      ),
    });
  } catch (e) { console.error('[dedup-image] email erreur:', e); }

  return NextResponse.json({
    success: !lastError,
    pairs: pairs.length,
    orphans: totalOrphanDeleted,
    deleted: totalDeleted,
    details: pairs.map(p => ({ winner: p.winnerName, removed: p.duplicateName })),
    debug: { productsLoaded, multiGroups, dutchDetected, sampleKeys },
    ...(lastError ? { error: lastError } : {}),
  });
}
