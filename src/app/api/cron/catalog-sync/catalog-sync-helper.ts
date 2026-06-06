import { createAdminClient } from '@/lib/supabase/server';
import { fetchAwinProductsByCategory, type AwinSyncCategory } from '@/lib/awin';
import { fetchCJProductsForAdvertiser } from '@/lib/cj';
import { NextResponse } from 'next/server';

export type CatalogSyncCategory =
  | 'chiens' | 'chats' | 'oiseaux' | 'rongeurs'
  | 'reptiles' | 'livres' | 'general' | 'canada-pet-care' | 'entirelypets';

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  affiliate_url: string;
  merchant_name: string;
  category: string;
  categories: string[] | null;
  product_type?: string | null;
  ean: string | null;
  isbn: string | null;
  brand: string | null;
}

function extractWeightG(name: string): number | null {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(',', '.'));
  const unit = m[2].toLowerCase();
  if (unit === 'kg' || unit === 'l') return Math.round(val * 1000);
  return Math.round(val);
}

const MERCHANT_COUNTRY_OVERRIDES: Record<string, string> = {
  'tuft & paw': 'us',
  // EntirelyPets : pas d'override → extractCountry retombe sur 'us' via la devise USD (marchand américain).
};

const MERCHANT_CURRENCY_OVERRIDES: Record<string, string> = {
  'tuft & paw': 'USD',
  'canadapetcare': 'CAD',
};

function resolveCurrency(merchantName: string, currency: string | null): string {
  return MERCHANT_CURRENCY_OVERRIDES[merchantName.toLowerCase()] ?? currency ?? 'EUR';
}

function extractCountry(merchantName: string, currency: string): string {
  const n = merchantName.toLowerCase();
  if (MERCHANT_COUNTRY_OVERRIDES[n]) return MERCHANT_COUNTRY_OVERRIDES[n];
  if (n.includes(' be') || n.includes('belgi')) return 'be';
  if (n.includes(' ca') || n.includes('canada')) return 'ca';
  if (n.includes(' us') || n.includes('united states')) return 'us';
  if (n.includes(' de') || n.includes('deutsch')) return 'de';
  if (n.includes(' uk') || n.includes('united kingdom')) return 'gb';
  if (currency === 'USD') return 'us';
  if (currency === 'CAD') return 'ca';
  if (currency === 'GBP') return 'gb';
  return 'fr';
}

function resolveSource(merchantName: string): 'awin' | 'cj' | 'amazon' {
  const n = merchantName.toLowerCase();
  if (n === 'canadapetcare' || n.includes('entirelypets')) return 'cj';
  if (n.includes('amazon')) return 'amazon';
  return 'awin';
}

function isDutchUrl(url: string): boolean {
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* garder url brute */ }
  return /\/nl[-_]?be\//i.test(decoded)
      || /\/nl\//i.test(decoded)
      || /[?&]lang=nl/i.test(decoded)
      || /\/nl[-_]?be\//i.test(url)
      || /\/nl\//i.test(url);
}

function isDutchName(name: string): boolean {
  return /\bNieuw[-\s]Zeeland\b/i.test(name)
      || /\bNieuw[-\s]Caledon/i.test(name)
      || /\bvoor\s+(honden|katten|konijnen|knaagdieren|vogels|vissen|puppies|kittens)\b/i.test(name)
      || /\bpuppy['']s\b/i.test(name)
      || /\bvezel(respons|rijk|arm)?\b/i.test(name)
      || /\bnieren\b/i.test(name)
      || /\bgewrichten\b/i.test(name)
      || /\bspijsvertering\b/i.test(name)
      || /\bhuidgezondheid\b/i.test(name)
      || /\bbeweeglijkheid\b/i.test(name)
      || /\bdarmgezondheid\b/i.test(name)
      || /\bhartgezondheid\b/i.test(name)
      || /\bgewichtsbeheer\b/i.test(name)
      || /\bsterilisatie\b/i.test(name)
      || /\bkortharige?\b/i.test(name)
      || /\blangharige?\b/i.test(name)
      || /\buitgebalanceerd\b/i.test(name)
      // Mots courants neerlandais dans les produits Maxi Zoo BE
      || /\bvoerbak\b/i.test(name)       // bol alimentaire
      || /\bdrinkbak\b/i.test(name)      // bol à eau
      || /\bkrabpaal\b/i.test(name)      // griffoir
      || /\bkattenbak\b/i.test(name)     // bac à litière
      || /\bspeelgoed\b/i.test(name)     // jouets
      || /\bhalsband\b/i.test(name)      // collier
      || /\bborstel\b/i.test(name)       // brosse
      || /\bvlooienkam\b/i.test(name)    // peigne antipuces
      || /\bkooitje\b/i.test(name)       // petite cage
      || /\bknaagsteen\b/i.test(name)    // pierre à ronger
      || /\bstarterset\b/i.test(name);   // kit de démarrage (orthographe néerlandaise)
}

async function processBatch(
  supabase: ReturnType<typeof createAdminClient>,
  batch: ProductRow[],
  syncTime: string
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  const eans = [...new Set(batch.filter(p => p.ean).map(p => p.ean!))];
  const eanMap = new Map<string, string>();

  if (eans.length > 0) {
    const { data } = await supabase
      .from('products_catalog')
      .select('id, ean')
      .in('ean', eans);
    for (const row of data ?? []) {
      if (row.ean) eanMap.set(row.ean, row.id);
    }
  }

  const urls = batch.map(p => p.affiliate_url);
  const urlMap = new Map<string, string>();

  const { data: existingOffers } = await supabase
    .from('product_offers')
    .select('catalog_id, affiliate_url')
    .in('affiliate_url', urls);
  for (const row of existingOffers ?? []) {
    urlMap.set(row.affiliate_url, row.catalog_id);
  }

  const offerPairs: Array<{ catalog_id: string; product: ProductRow }> = [];
  const newProducts: ProductRow[] = [];

  for (const p of batch) {
    if (p.ean && eanMap.has(p.ean)) {
      offerPairs.push({ catalog_id: eanMap.get(p.ean)!, product: p });
      updated++;
    } else if (urlMap.has(p.affiliate_url)) {
      offerPairs.push({ catalog_id: urlMap.get(p.affiliate_url)!, product: p });
      updated++;
    } else {
      newProducts.push(p);
    }
  }

  if (newProducts.length > 0) {
    const { data: newEntries, error } = await supabase
      .from('products_catalog')
      .insert(
        newProducts.map(p => ({
          ean:          p.ean ?? null,
          isbn:         p.isbn ?? null,
          name:         p.name,
          brand:        p.brand ?? null,
          category:     p.category,
          categories:   p.categories ?? [],
          product_type: p.product_type ?? null,
          image_url:    p.image_url || null,
          description:  p.description?.slice(0, 2000) || null,
          weight_g:     extractWeightG(p.name),
          status:       'active',
        }))
      )
      .select('id');

    if (!error && newEntries) {
      newEntries.forEach((entry, i) => {
        const p = newProducts[i];
        offerPairs.push({ catalog_id: entry.id, product: p });
        if (p.ean) eanMap.set(p.ean, entry.id);
        inserted++;
      });
    }
  }

  if (offerPairs.length > 0) {
    const offers = offerPairs.map(({ catalog_id, product: p }) => ({
      catalog_id,
      source:         resolveSource(p.merchant_name),
      merchant_name:  p.merchant_name,
      country:        extractCountry(p.merchant_name, p.currency ?? 'EUR'),
      price:          p.price ?? 0,
      currency:       resolveCurrency(p.merchant_name, p.currency),
      affiliate_url:  p.affiliate_url,
      in_stock:       true,
      last_synced_at: syncTime,
    }));

    await supabase
      .from('product_offers')
      .upsert(offers, { onConflict: 'affiliate_url' });

    // Réactiver les fiches qui étaient cachées (produit revenu dans le feed)
    const uniqueCatalogIds = [...new Set(offerPairs.map(p => p.catalog_id))];
    for (let i = 0; i < uniqueCatalogIds.length; i += 200) {
      await supabase
        .from('products_catalog')
        .update({ status: 'active' })
        .in('id', uniqueCatalogIds.slice(i, i + 200))
        .in('status', ['hidden', 'deleted']);
    }

    // Auto-healing description : met à jour les fiches dont la description stockée est plus courte
    // que celle du feed (corrige les anciennes fiches coupées à 200 car.). Plafonné pour ne pas
    // alourdir le sync → se répare progressivement sur plusieurs runs. Non-bloquant.
    try {
      const descById = new Map<string, string>();
      for (const { catalog_id, product } of offerPairs) {
        const d = product.description?.slice(0, 2000);
        if (d && d.length > (descById.get(catalog_id)?.length ?? 0)) descById.set(catalog_id, d);
      }
      const ids = [...descById.keys()];
      let healed = 0;
      for (let i = 0; i < ids.length && healed < 200; i += 300) {
        const chunk = ids.slice(i, i + 300);
        const { data: current } = await supabase
          .from('products_catalog')
          .select('id, description')
          .in('id', chunk);
        for (const row of current ?? []) {
          if (healed >= 200) break;
          const newDesc = descById.get(row.id);
          if (newDesc && newDesc.length > (row.description?.length ?? 0) + 20) {
            await supabase.from('products_catalog').update({ description: newDesc }).eq('id', row.id);
            healed++;
          }
        }
      }
      if (healed > 0) console.log(`[catalog-sync] ${healed} descriptions rafraîchies`);
    } catch { /* non-bloquant */ }
  }

  return { inserted, updated };
}

// ─── Nettoyage offres périmées ────────────────────────────────────────────────

async function cleanupStaleOffersForCategory(
  supabase: ReturnType<typeof createAdminClient>,
  category: string,
  source: 'awin' | 'cj',
  syncTime: string,
  merchantName?: string
): Promise<{ deletedOffers: number; hiddenProducts: number }> {
  // Récupère tous les catalog_id de cette catégorie (actifs, hors pinned)
  const allCategoryIds: string[] = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('products_catalog')
      .select('id')
      .eq('category', category)
      .eq('status', 'active')
      .range(page * 500, page * 500 + 499);
    if (!data?.length) break;
    allCategoryIds.push(...data.map((r: { id: string }) => r.id));
    if (data.length < 500) break;
    page++;
  }

  if (allCategoryIds.length === 0) return { deletedOffers: 0, hiddenProducts: 0 };

  // Marque les offres périmées comme hors stock (soft-delete : préserve l'affiliate_url)
  let deletedOffers = 0;
  for (let i = 0; i < allCategoryIds.length; i += 200) {
    const batch = allCategoryIds.slice(i, i + 200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('product_offers')
      .update({ in_stock: false })
      .eq('source', source)
      .lt('last_synced_at', syncTime)
      .eq('in_stock', true)
      .in('catalog_id', batch);
    if (merchantName) q = q.eq('merchant_name', merchantName);
    const { count } = await q;
    deletedOffers += count ?? 0;
  }

  if (deletedOffers === 0) return { deletedOffers: 0, hiddenProducts: 0 };

  // Identifie les produits sans aucune offre en stock restante → masquer
  const withOfferIds = new Set<string>();
  for (let i = 0; i < allCategoryIds.length; i += 500) {
    const batch = allCategoryIds.slice(i, i + 500);
    const { data } = await supabase
      .from('product_offers')
      .select('catalog_id')
      .in('catalog_id', batch)
      .eq('in_stock', true)
      .gt('price', 0);
    for (const row of data ?? []) withOfferIds.add(row.catalog_id);
  }

  const noOfferIds = allCategoryIds.filter(id => !withOfferIds.has(id));
  let hiddenProducts = 0;
  for (let i = 0; i < noOfferIds.length; i += 200) {
    await supabase
      .from('products_catalog')
      .update({ status: 'hidden' })
      .in('id', noOfferIds.slice(i, i + 200));
    hiddenProducts += noOfferIds.slice(i, i + 200).length;
  }

  return { deletedOffers, hiddenProducts };
}

// ─── CPC Scraper ──────────────────────────────────────────────────────────────

const CPC_PUBLISHER_SID = '101746286';
const CPC_ADVERTISER_ID = '17287368';
const CPC_SITEMAP_URL = 'https://www.canadapetcare.com/sitemap.xml';

// EntirelyPets : base du deep link CJ (Link Generator) — publisher 101746286, AID 15524299, domaine dpbolvw.net.
const ENTIRELYPETS_AFFILIATE_BASE = `https://www.dpbolvw.net/click-${CPC_PUBLISHER_SID}-15524299`;

function buildCPCAffiliateUrl(productUrl: string): string {
  return `https://www.jdoqocy.com/click-${CPC_PUBLISHER_SID}-${CPC_ADVERTISER_ID}?url=${encodeURIComponent(productUrl)}`;
}

function extractMeta(html: string, prop: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function extractCPCPrice(html: string): number {
  const m = html.match(/\$\s*([\d,]+\.?\d*)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, ''));
}

function detectCPCCategories(title: string): string[] {
  const t = title.toLowerCase();
  const cats: string[] = [];
  if (/\b(dog|dogs|puppy|puppies|k9|canin)\b/.test(t)) cats.push('chiens');
  if (/\b(cat|cats|kitten|kittens|feline)\b/.test(t)) cats.push('chats');
  if (/\b(bird|birds|pigeon)\b/.test(t)) cats.push('oiseaux');
  return cats.length > 0 ? cats : ['chiens', 'chats'];
}

function extractCPCProductId(url: string): string | null {
  const m = url.match(/-(\d+)\.aspx$/);
  return m ? m[1] : null;
}

async function scrapeCPCProduct(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
    const image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description');
    const price = extractCPCPrice(html);

    if (!title || !image) return null;
    return { title, image, description, price };
  } catch {
    return null;
  }
}

async function runCPCCatalogSync(
  supabase: ReturnType<typeof createAdminClient>,
  syncTime: string
): Promise<{ totalInserted: number; totalUpdated: number; lastError: string | null }> {
  let totalInserted = 0;
  let totalUpdated = 0;
  let lastError: string | null = null;

  let xml: string;
  try {
    const sitemapRes = await fetch(CPC_SITEMAP_URL, { signal: AbortSignal.timeout(10000) });
    if (!sitemapRes.ok) return { totalInserted: 0, totalUpdated: 0, lastError: 'Sitemap CPC inaccessible' };
    xml = await sitemapRes.text();
  } catch (e) {
    return { totalInserted: 0, totalUpdated: 0, lastError: e instanceof Error ? e.message : 'Erreur fetch sitemap' };
  }

  const productUrls: string[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const priMatch = block.match(/<priority>([\d.]+)<\/priority>/);
    if (!locMatch || !priMatch) continue;
    const url = locMatch[1].trim();
    const priority = parseFloat(priMatch[1]);
    if (priority === 0.85 && url.endsWith('.aspx') && extractCPCProductId(url)) {
      productUrls.push(url);
    }
  }

  const BATCH = 8;
  for (let i = 0; i < productUrls.length; i += BATCH) {
    const batch = productUrls.slice(i, i + BATCH);
    const rows: ProductRow[] = [];

    await Promise.all(batch.map(async (url) => {
      const productId = extractCPCProductId(url);
      if (!productId) return;

      const data = await scrapeCPCProduct(url);
      if (!data) return;

      const categories = detectCPCCategories(data.title);
      rows.push({
        id: `cj_${CPC_ADVERTISER_ID}_${productId}`,
        name: data.title,
        description: data.description || null,
        price: data.price,
        currency: 'USD',
        image_url: data.image,
        affiliate_url: buildCPCAffiliateUrl(url),
        merchant_name: 'CanadaPetCare',
        category: categories[0],
        categories,
        product_type: 'sante',
        ean: null,
        isbn: null,
        brand: null,
      });
    }));

    if (rows.length > 0) {
      try {
        const { inserted, updated } = await processBatch(supabase, rows, syncTime);
        totalInserted += inserted;
        totalUpdated += updated;
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Erreur batch CPC';
      }
    }
  }

  return { totalInserted, totalUpdated, lastError };
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function runCatalogSyncForCategory(
  req: Request,
  category: CatalogSyncCategory
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const syncTime = new Date().toISOString();

  let totalInserted = 0;
  let totalUpdated = 0;
  let lastError: string | null = null;

  let cleanupStats = { deletedOffers: 0, hiddenProducts: 0 };

  if (category === 'canada-pet-care') {
    ({ totalInserted, totalUpdated, lastError } = await runCPCCatalogSync(supabase, syncTime));
    // Nettoyage offres CPC disparues du sitemap (garde : au moins 10 produits scrappés)
    if (totalInserted + totalUpdated >= 10) {
      try {
        cleanupStats = await cleanupStaleOffersForCategory(supabase, 'chiens', 'cj', syncTime, 'CanadaPetCare');
        const chatsCleanup = await cleanupStaleOffersForCategory(supabase, 'chats', 'cj', syncTime, 'CanadaPetCare');
        cleanupStats.deletedOffers += chatsCleanup.deletedOffers;
        cleanupStats.hiddenProducts += chatsCleanup.hiddenProducts;
      } catch { /* non bloquant */ }
    }
  } else if (category === 'entirelypets') {
    // EntirelyPets (CJ advertiser 1475632) : flux produits CJ propre via l'API GraphQL.
    // DÉSACTIVÉ par défaut : on évite d'importer ~10k produits US/CA tant que l'usage
    // Vercel/Supabase n'a pas baissé et qu'on n'a pas de trafic CA/US.
    // Pour activer l'import : définir ENTIRELYPETS_SYNC_ENABLED=true sur Vercel.
    if (process.env.ENTIRELYPETS_SYNC_ENABLED !== 'true') {
      await supabase.from('activity_logs').insert({
        agent_id: 'thomas', agent_name: 'Thomas',
        action: `[Catalog sync:entirelypets] desactive (ENTIRELYPETS_SYNC_ENABLED != true)`,
        details: {}, status: 'success',
      });
      return NextResponse.json({ success: true, category, disabled: true, inserted: 0, updated: 0 });
    }

    const token = process.env.CJ_API_TOKEN;
    const companyId = process.env.CJ_CID;
    const advertiserId = process.env.CJ_ADVERTISER_ENTIRELYPETS;

    if (!token || !companyId || !advertiserId) {
      await supabase.from('activity_logs').insert({
        agent_id: 'thomas', agent_name: 'Thomas',
        action: `[Catalog sync:entirelypets] ECHEC - cles CJ manquantes (CJ_API_TOKEN / CJ_CID / CJ_ADVERTISER_ENTIRELYPETS)`,
        details: {}, status: 'error',
      });
      return NextResponse.json({ error: 'Cles CJ manquantes' }, { status: 503 });
    }

    try {
      await fetchCJProductsForAdvertiser(companyId, token, advertiserId, async (batch) => {
        const rows: ProductRow[] = batch.map(p => ({
          id:           p.id,
          name:         p.name,
          description:  p.description || null,
          price:        p.price,
          currency:     p.currency,
          image_url:    p.image_url,
          // Le flux CJ renvoie l'URL brute entirelypets.com → on l'enveloppe dans le
          // lien de tracking CJ (sinon clics non comptabilisés = pas de commission).
          affiliate_url: `${ENTIRELYPETS_AFFILIATE_BASE}?url=${encodeURIComponent(p.affiliate_url)}`,
          merchant_name: p.merchant_name,
          category:     p.category,
          categories:   p.categories,
          product_type: null, // type laissé à classify-products (catalogue généraliste, pas que santé)
          ean:          null,
          isbn:         null,
          brand:        null,
        }));
        const { inserted, updated } = await processBatch(supabase, rows, syncTime);
        totalInserted += inserted;
        totalUpdated += updated;
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur sync EntirelyPets';
      console.error('[catalog-sync:entirelypets]', lastError);
    }

    // Nettoyage offres disparues du flux — UNIQUEMENT si le sync a abouti sans erreur
    // (sinon un sync partiel masquerait à tort la moitié du catalogue).
    if (!lastError && totalInserted + totalUpdated >= 100) {
      try {
        for (const cat of ['chiens', 'chats']) {
          const r = await cleanupStaleOffersForCategory(supabase, cat, 'cj', syncTime, 'EntirelyPets');
          cleanupStats.deletedOffers += r.deletedOffers;
          cleanupStats.hiddenProducts += r.hiddenProducts;
        }
      } catch { /* non bloquant */ }
    }
  } else {
    const publisherId = process.env.AWIN_PUBLISHER_ID;
    const feedToken   = process.env.AWIN_FEED_TOKEN ?? process.env.AWIN_API_TOKEN;

    if (!publisherId || !feedToken) {
      await supabase.from('activity_logs').insert({
        agent_id: 'thomas', agent_name: 'Thomas',
        action: `[Catalog sync:${category}] ECHEC - clés Awin manquantes (AWIN_PUBLISHER_ID ou AWIN_FEED_TOKEN)`,
        details: {},
        status: 'error',
      });
      return NextResponse.json({ error: 'Clés Awin manquantes' }, { status: 503 });
    }

    const BATCH_SIZE = 50;

    await fetchAwinProductsByCategory(
      publisherId,
      feedToken,
      category as AwinSyncCategory,
      async (batch) => {
        const filtered = batch.filter(p => !isDutchUrl(p.affiliate_url) && !isDutchName(p.name));
        for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
          try {
            const { inserted, updated } = await processBatch(
              supabase,
              filtered.slice(i, i + BATCH_SIZE) as unknown as ProductRow[],
              syncTime
            );
            totalInserted += inserted;
            totalUpdated += updated;
          } catch (e) {
            lastError = e instanceof Error ? e.message : 'Erreur inconnue';
            console.error(`[catalog-sync:${category}] batch erreur:`, lastError);
          }
        }
      },
      undefined,
      (merchantName, errMsg) => {
        lastError = errMsg;
        console.error(`[catalog-sync:${category}] feed ${merchantName}:`, errMsg);
      }
    );

    // Nettoyage offres Awin disparues du feed
    // Garde de sécurité : ne nettoyer que si le feed a retourné au moins 100 produits
    // (évite de tout masquer si le feed Awin est temporairement vide/partiel/en erreur)
    if (totalInserted + totalUpdated >= 100) {
      try {
        cleanupStats = await cleanupStaleOffersForCategory(supabase, category, 'awin', syncTime);
      } catch { /* non bloquant */ }
    }
  }

  const cleanupMsg = cleanupStats.deletedOffers > 0
    ? `, ${cleanupStats.deletedOffers} offres périmées supprimées, ${cleanupStats.hiddenProducts} fiches masquées`
    : '';

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Catalog sync:${category}] ${totalInserted} nouvelles fiches, ${totalUpdated} offres mises à jour${cleanupMsg}`,
    details: lastError ? { error: lastError } : {},
    status: lastError ? 'error' : 'success',
  });

  if (totalInserted > 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http://localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    if (appUrl) {
      const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
      fetch(`${appUrl}/api/cron/catalog-sync/dedup-ean`, { headers })
        .then(() => fetch(`${appUrl}/api/cron/catalog-sync/dedup-title`, { headers }))
        .then(() => fetch(`${appUrl}/api/cron/catalog-sync/dedup-image`, { headers }))
        .then(() => fetch(`${appUrl}/api/cron/catalog-sync/translate`, { headers }))
        .catch(() => {});
    }
  }

  return NextResponse.json({
    success: !lastError,
    category,
    inserted: totalInserted,
    updated: totalUpdated,
    total: totalInserted + totalUpdated,
    deletedOffers: cleanupStats.deletedOffers,
    hiddenProducts: cleanupStats.hiddenProducts,
    ...(lastError ? { error: lastError } : {}),
  });
}
