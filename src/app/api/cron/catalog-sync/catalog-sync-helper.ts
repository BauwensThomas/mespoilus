import { createAdminClient } from '@/lib/supabase/server';
import { fetchAwinProductsByCategory, type AwinSyncCategory } from '@/lib/awin';
import { NextResponse } from 'next/server';

export type CatalogSyncCategory =
  | 'chiens' | 'chats' | 'oiseaux' | 'rongeurs'
  | 'reptiles' | 'livres' | 'general' | 'canada-pet-care';

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
  if (merchantName === 'CanadaPetCare') return 'cj';
  if (merchantName.toLowerCase().includes('amazon')) return 'amazon';
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
      || /\buitgebalanceerd\b/i.test(name);
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
          ean:         p.ean ?? null,
          isbn:        p.isbn ?? null,
          name:        p.name,
          brand:       p.brand ?? null,
          category:    p.category,
          categories:  p.categories ?? [],
          image_url:   p.image_url || null,
          description: p.description?.slice(0, 500) || null,
          weight_g:    extractWeightG(p.name),
          status:      'active',
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
  }

  return { inserted, updated };
}

// ─── CPC Scraper ──────────────────────────────────────────────────────────────

const CPC_PUBLISHER_SID = '101746286';
const CPC_ADVERTISER_ID = '17287368';
const CPC_SITEMAP_URL = 'https://www.canadapetcare.com/sitemap.xml';

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

  if (category === 'canada-pet-care') {
    ({ totalInserted, totalUpdated, lastError } = await runCPCCatalogSync(supabase, syncTime));
  } else {
    const publisherId = process.env.AWIN_PUBLISHER_ID;
    const feedToken   = process.env.AWIN_FEED_TOKEN ?? process.env.AWIN_API_TOKEN;

    if (!publisherId || !feedToken) {
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
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Catalog sync:${category}] ${totalInserted} nouvelles fiches, ${totalUpdated} offres mises à jour`,
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
    ...(lastError ? { error: lastError } : {}),
  });
}
