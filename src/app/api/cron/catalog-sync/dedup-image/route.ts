import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

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
  /\bdroogvoer\b/i, /\bnatvoer\b/i, /\bgevogelte\b/i,
  /\bgraanvrij\b/i, /\bkonijn\b/i,
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

  // 1. Charger tous les produits sans EAN qui ont une image_url
  const { data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, image_url, ean, category, created_at')
    .is('ean', null)
    .not('image_url', 'is', null)
    .eq('status', 'active')
    .limit(20000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const productsLoaded = products?.length ?? 0;

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

  // 4. Fusionner
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

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Dedup image] ${totalDeleted} fiches NL fusionnées par image_url (${pairs.length} paires détectées)`,
    details: lastError ? { error: lastError } : { pairs: pairs.length },
    status: lastError ? 'error' : 'success',
  });

  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Fusion doublons Image — ${totalDeleted} fiche${totalDeleted > 1 ? 's' : ''} NL fusionnée${totalDeleted > 1 ? 's' : ''}`,
      html: cronEmailWrapper(
        'Fusion doublons Image (NL→FR) terminée',
        'Catalogue · Boutique',
        statsRow([
          { label: 'Paires NL/FR détectées', value: pairs.length,  color: '#f97316' },
          { label: 'Fiches NL supprimées',   value: totalDeleted,  color: '#dc2626' },
        ]) + (lastError ? `<p style="color:#dc2626;font-size:13px;margin-top:12px">⚠ Erreur : ${lastError}</p>` : '')
          + (pairs.length === 0 ? '<p style="color:#6b7280;font-size:14px">Aucune paire NL/FR détectée par image URL.</p>' : ''),
      ),
    });
  } catch (e) { console.error('[dedup-image] email erreur:', e); }

  return NextResponse.json({
    success: !lastError,
    pairs: pairs.length,
    deleted: totalDeleted,
    details: pairs.map(p => ({ winner: p.winnerName, removed: p.duplicateName })),
    debug: { productsLoaded, multiGroups, dutchDetected, sampleKeys },
    ...(lastError ? { error: lastError } : {}),
  });
}
