import { gunzipSync } from 'zlib';
import type { AwinProduct } from '@/types';

const GPC_MAP: Record<string, string[]> = {
  chiens:   ['dog supplies', 'dog food', 'dog toys', 'dog beds', 'dog treat'],
  chats:    ['cat supplies', 'cat litter', 'cat furniture', 'cat toys', 'cat food', 'cat treat'],
  oiseaux:  ['bird supplies', 'bird food'],
  rongeurs: ['small animal', 'rabbit', 'hamster', 'guinea pig'],
  reptiles: ['reptile', 'turtle', 'lizard'],
  livres:   ['books', 'book', 'livre', 'livres', 'media > book', 'books & magazine', 'literatura'],
};

// Mots simples : titre uniquement, bornes de mot (évite "chat en direct", "catalogue", "pochette")
// Expressions multi-mots : titre ET description (phrase déjà spécifique, faux positifs rares)
function isAlphaChar(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 192 && c <= 255);
}

function keywordsMatchProduct(p: Record<string, string>, keywords: string[]): boolean {
  const title = (p['title'] ?? '').toLowerCase();
  const desc  = (p['description'] ?? '').toLowerCase();
  return keywords.some(kw => {
    const k = kw.toLowerCase();
    if (k.includes(' ')) return title.includes(k) || desc.includes(k);
    // Mot simple : titre uniquement + vérification bornes manuelle (pas de regex lookbehind)
    let i = title.indexOf(k);
    while (i !== -1) {
      const before = i > 0 ? title.charCodeAt(i - 1) : 0;
      const after  = i + k.length < title.length ? title.charCodeAt(i + k.length) : 0;
      if (!isAlphaChar(before) && !isAlphaChar(after)) return true;
      i = title.indexOf(k, i + 1);
    }
    return false;
  });
}

function matchesCategory(p: Record<string, string>, category: string): boolean {
  const gpc = (p['google_product_category'] ?? '').toLowerCase();

  if (GPC_MAP[category]?.some(k => gpc.includes(k))) return true;

  for (const [cat, keys] of Object.entries(GPC_MAP)) {
    if (cat !== category && keys.some(k => gpc.includes(k))) return false;
  }

  return keywordsMatchProduct(p, AWIN_CATEGORY_SEARCH[category] ?? []);
}

export const AWIN_CATEGORY_SEARCH: Record<string, string[]> = {
  chiens:   ['dog', 'chien', 'canin', 'chiot', 'puppy'],
  chats:    ['cat', 'chat', 'felin', 'chaton', 'kitten', 'litter', 'litière'],
  oiseaux:  ['bird', 'oiseau', 'perroquet', 'canari'],
  rongeurs: ['rabbit', 'hamster', 'rongeur', 'lapin', 'cobaye', 'guinea'],
  reptiles: ['reptile', 'serpent', 'lézard', 'tortue', 'turtle'],
  livres:   ['livre', 'book', 'broché', 'relié', 'poche', 'paperback', 'hardcover', 'isbn', 'éditions', 'auteur', 'encyclopédie', 'guide pratique animal', 'manuel vétérinaire'],
  general:  ['animaux de compagnie', 'animal domestique', 'pet food', 'pet supplies', 'animalerie', 'petshop', 'vétérinaire', 'aquarium', 'terrarium', 'accessoire animal'],
};

export type AwinSyncCategory = 'chiens' | 'chats' | 'oiseaux' | 'rongeurs' | 'reptiles' | 'livres' | 'general';
export const AWIN_SYNC_CATEGORIES: AwinSyncCategory[] = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles', 'livres', 'general'];

export interface AwinAdvertiser { id: number; name: string; }

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += c; }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^\uFEFF/, ''));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

/**
 * Parse le CSV ligne par ligne et flush via onFlush tous les `batchSize` produits.
 * Filtre uniquement les produits de la catégorie cible.
 */
async function parseCSVStreamingWithFlush(
  text: string,
  merchantName: string,
  targetCategory: AwinSyncCategory,
  seenIds: Set<string>,
  batchSize: number,
  onFlush: (batch: AwinProduct[]) => Promise<void>,
  onProgress?: (parsed: number) => void
): Promise<number> {
  const lines = text.split('\n');
  if (lines.length < 2) return 0;

  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^\uFEFF/, ''));
  let batch: AwinProduct[] = [];
  let totalFromFeed = 0;
  let parsedLines = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    parsedLines++;

    if (onProgress && parsedLines % 500 === 0) onProgress(parsedLines);

    const vals = parseCSVLine(line);
    const p: Record<string, string> = {};
    headers.forEach((h, idx) => { p[h] = (vals[idx] ?? '').trim(); });

    const id = p['id'] ?? p['aw_product_id'] ?? p['product_id'];
    const name = p['title'] ?? p['product_name'] ?? '';
    const deepLink = p['aw_deep_link'] ?? p['link'] ?? '';
    if (!id || !deepLink) continue;
    if (/\bparts?\b/i.test(name) || / \/ [A-Z0-9]{5,}$/.test(name)) continue;

    const pid = `awin_${id}`;
    if (seenIds.has(pid)) continue;

    const assigned = assignCategories(p);
    if (!assigned || assigned.primary !== targetCategory) continue;
    const { primary, all: cats } = assigned;

    const desc = p['description'] ?? '';
    const priceRaw = p['price'] ?? p['search_price'] ?? '0';
    const priceMatch = priceRaw.match(/^([\d.]+)\s*([A-Z]{3})?/);
    const price = parseFloat(priceMatch?.[1] ?? '0') || 0;
    const currency = priceMatch?.[2] ?? 'EUR';
    const availability = p['availability'] ?? p['in_stock'] ?? '';
    const inStock = ['in_stock', 'in stock', '1', 'true'].includes(availability);
    const imageUrl = p['image_link'] ?? p['aw_image_url'] ?? p['merchant_image_url'] ?? '';

    seenIds.add(pid);
    totalFromFeed++;

    batch.push({
      id: pid, name, description: desc.slice(0, 200),
      price, currency, image_url: imageUrl,
      affiliate_url: deepLink, merchant_name: merchantName ?? '',
      category: primary, categories: cats, in_stock: inStock,
      last_synced: new Date().toISOString(),
    });

    if (batch.length >= batchSize) {
      await onFlush(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await onFlush(batch);
  }

  return totalFromFeed;
}

async function fetchAndDecompress(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error(`[awin] Erreur HTTP ${res.status} sur ${url} :`, text.slice(0, 500));
    throw new Error(`HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
  try {
    return isGzip ? gunzipSync(buffer).toString('utf-8') : buffer.toString('utf-8');
  } catch (e) {
    const preview = buffer.toString('utf-8').slice(0, 500);
    console.error(`[awin] Erreur de décompression ou parsing sur ${url} :`, preview);
    throw e;
  }
}

let cachedFeeds: Record<string, string>[] | null = null;
let cacheTime = 0;

export async function getJoinedFeeds(publisherId: string, feedToken: string): Promise<Record<string, string>[]> {
  const now = Date.now();
  if (cachedFeeds && now - cacheTime < 3_600_000) return cachedFeeds;

  const url = `https://ui.awin.com/productdata-darwin-download/publisher/${publisherId}/${feedToken}/1/feedList`;
  const res = await fetch(url);
  if (!res.ok) { console.error('[awin] feedList error:', res.status); return []; }

  const all = parseCSV(await res.text());

  let joined = all.filter(f => f['Membership Status'] === 'active');

  const seenUrls = new Set<string>();
  joined = joined.filter(f => {
    const u = f['URL'];
    if (!u || seenUrls.has(u)) return false;
    seenUrls.add(u);
    return true;
  });

  // ─── DÉDUPLICATION PAR MARCHAND ───────────────────────────────────────────
  // Fnac FR a 62 flux → on garde 1 seul par marchand (l'URL la plus longue
  // correspond généralement au flux complet plutôt qu'un flux partiel)
  const byMerchant = new Map<string, Record<string, string>>();
  for (const f of joined) {
    const name = (f['Advertiser Name'] ?? '').trim().toLowerCase();
    if (!byMerchant.has(name)) {
      byMerchant.set(name, f);
    } else {
      const existing = byMerchant.get(name)!;
      if ((f['URL']?.length ?? 0) > (existing['URL']?.length ?? 0)) {
        byMerchant.set(name, f);
      }
    }
  }
  joined = Array.from(byMerchant.values());
  // ──────────────────────────────────────────────────────────────────────────

  console.log(`[awin] marchands actifs: ${joined.map(f => f['Advertiser Name']).join(', ') || 'aucun'} | flux uniques: ${joined.length}`);

  cachedFeeds = joined;
  cacheTime = now;
  return joined;
}

const ANIMAL_CATEGORIES = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'] as const;

function assignCategories(p: Record<string, string>): { primary: AwinProduct['category']; all: string[] } | null {
  const all: string[] = [];

  const isBook = matchesCategory(p, 'livres');
  if (isBook) all.push('livres');

  for (const cat of ANIMAL_CATEGORIES) {
    if (isBook) {
      // Pour les livres : bypass l'anti-match GPC, vérification directe par mots-clés
      if (keywordsMatchProduct(p, AWIN_CATEGORY_SEARCH[cat] ?? [])) all.push(cat);
    } else {
      if (matchesCategory(p, cat)) all.push(cat);
    }
  }

  if (all.length === 0) {
    // Pas de catch-all : general requiert un match explicite sur ses mots-clés
    // Les produits sans rapport avec les animaux (amplis, platines, etc.) sont ignorés
    if (!matchesCategory(p, 'general')) return null;
    all.push('general');
  }

  // Catégorie primaire = premier animal trouvé (cron qui prend ownership), sinon livres, sinon general
  const primary = (all.find(c => c !== 'livres') ?? all[0] ?? 'general') as AwinProduct['category'];
  return { primary, all };
}

/**
 * Sync d'UNE seule catégorie — appelée par chaque cron dédié.
 * Streaming pur, jamais plus de 100 produits en RAM à la fois.
 * onBatch est appelé pour chaque batch → upsert immédiat en BDD.
 * onProgress est appelé régulièrement avec le nb de produits trouvés.
 */
export async function fetchAwinProductsByCategory(
  publisherId: string,
  feedToken: string,
  targetCategory: AwinSyncCategory,
  onBatch: (products: AwinProduct[]) => Promise<void>,
  onProgress?: (synced: number, currentFeed: string) => Promise<void>,
  onFeedError?: (merchantName: string, error: string) => void
): Promise<number> {
  const feeds = await getJoinedFeeds(publisherId, feedToken);
  if (!feeds.length) {
    console.error(`[awin:${targetCategory}] Aucun feed actif trouvé — vérifie AWIN_PUBLISHER_ID / AWIN_FEED_TOKEN`);
    return 0;
  }

  const seenIds = new Set<string>();
  let grandTotal = 0;

  for (const feed of feeds) {
    const feedUrl = feed['URL'];
    const merchantName = feed['Advertiser Name'];
    if (!feedUrl) continue;

    if (onProgress) await onProgress(grandTotal, merchantName);

    try {
      const csvText = await fetchAndDecompress(feedUrl);

      const count = await parseCSVStreamingWithFlush(
        csvText,
        merchantName,
        targetCategory,
        seenIds,
        100,
        async (batch) => {
          await onBatch(batch);
          grandTotal += batch.length;
          if (onProgress) await onProgress(grandTotal, merchantName);
        }
      );

      console.log(`[awin:${targetCategory}] ${merchantName}: ${count} produits matchés`);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error(`[awin:${targetCategory}] feed ${merchantName} ERREUR: ${errMsg}`);
      if (onFeedError) onFeedError(merchantName, errMsg);
    }
  }

  console.log(`[awin:${targetCategory}] sync terminée — total: ${grandTotal}`);
  return grandTotal;
}

// ─── Fonctions conservées pour compatibilité ──────────────────────────────────

export async function fetchAllAwinProducts(
  publisherId: string,
  feedToken: string,
  _limitPerCategory = 0,
  onBatch?: (products: AwinProduct[]) => Promise<void>
): Promise<AwinProduct[]> {
  // Redirige vers la sync par catégorie pour chiens par défaut (usage legacy)
  if (onBatch) {
    await fetchAwinProductsByCategory(publisherId, feedToken, 'chiens', onBatch);
  }
  return [];
}

export async function fetchAwinProducts(
  publisherId: string,
  feedToken: string,
  category: AwinProduct['category'],
  limit = 30
): Promise<AwinProduct[]> {
  const feeds = await getJoinedFeeds(publisherId, feedToken);
  if (!feeds.length) return [];

  const allProducts: AwinProduct[] = [];

  for (const feed of feeds) {
    if (allProducts.length >= limit) break;
    const feedUrl = feed['URL'];
    const merchantName = feed['Advertiser Name'];
    if (!feedUrl) continue;

    try {
      const csvText = await fetchAndDecompress(feedUrl);
      const products = parseCSV(csvText);

      for (const p of products) {
        if (allProducts.length >= limit) break;

        const id = p['id'] ?? p['aw_product_id'] ?? p['product_id'];
        const name = p['title'] ?? p['product_name'] ?? '';
        const deepLink = p['aw_deep_link'] ?? p['link'] ?? '';
        const imageUrl = p['image_link'] ?? p['aw_image_url'] ?? p['merchant_image_url'] ?? '';
        const desc = p['description'] ?? '';
        const priceRaw = p['price'] ?? p['search_price'] ?? '0';
        const priceMatch = priceRaw.match(/^([\d.]+)\s*([A-Z]{3})?/);
        const price = parseFloat(priceMatch?.[1] ?? '0') || 0;
        const currency = priceMatch?.[2] ?? 'EUR';
        const availability = p['availability'] ?? p['in_stock'] ?? '';
        const inStock = ['in_stock', 'in stock', '1', 'true'].includes(availability);

        if (!id || !deepLink) continue;
        if (/\bparts?\b/i.test(name) || / \/ [A-Z0-9]{5,}$/.test(name)) continue;

        if (category !== 'general' && !matchesCategory(p, category)) continue;

        const pid = `awin_${id}`;
        if (allProducts.find(x => x.id === pid)) continue;

        allProducts.push({
          id: pid, name, description: desc.slice(0, 200),
          price, currency, image_url: imageUrl,
          affiliate_url: deepLink, merchant_name: merchantName ?? '',
          category, categories: [category], in_stock: inStock,
          last_synced: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(`[awin] feed ${merchantName} erreur:`, e);
    }
  }

  console.log(`[awin] Catégorie "${category}": ${allProducts.length} produits`);
  return allProducts;
}