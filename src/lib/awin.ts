import { gunzipSync } from 'zlib';
import type { AwinProduct } from '@/types';

const GPC_MAP: Record<string, string[]> = {
  chiens:   ['dog supplies', 'dog food', 'dog toys', 'dog beds', 'dog treat'],
  chats:    ['cat supplies', 'cat litter', 'cat furniture', 'cat toys', 'cat food', 'cat treat'],
  oiseaux:  ['bird supplies', 'bird food'],
  rongeurs: ['small animal', 'rabbit', 'hamster', 'guinea pig'],
  reptiles: ['reptile', 'turtle', 'lizard'],
};

function matchesCategory(p: Record<string, string>, category: string): boolean {
  const gpc = (p['google_product_category'] ?? '').toLowerCase();

  // Si le GPC correspond à ce category → match
  if (GPC_MAP[category]?.some(k => gpc.includes(k))) return true;

  // Si le GPC correspond à un AUTRE category → pas un match
  for (const [cat, keys] of Object.entries(GPC_MAP)) {
    if (cat !== category && keys.some(k => gpc.includes(k))) return false;
  }

  // Fallback : mots-clés sur titre + description
  const keywords = AWIN_CATEGORY_SEARCH[category] ?? [];
  const text = `${p['title'] ?? ''} ${p['description'] ?? ''}`.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

export const AWIN_CATEGORY_SEARCH: Record<string, string[]> = {
  chiens:   ['dog', 'chien', 'canin', 'chiot', 'puppy'],
  chats:    ['cat', 'chat', 'felin', 'chaton', 'kitten', 'litter', 'litière'],
  oiseaux:  ['bird', 'oiseau', 'perroquet', 'canari'],
  rongeurs: ['rabbit', 'hamster', 'rongeur', 'lapin', 'cobaye', 'guinea'],
  reptiles: ['reptile', 'serpent', 'lézard', 'tortue', 'turtle'],
  general:  ['pet', 'animal', 'animaux'],
};

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
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^﻿/, ''));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

async function fetchAndDecompress(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  // Détecter gzip par magic bytes \x1F\x8B
  const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
  return isGzip ? gunzipSync(buffer).toString('utf-8') : buffer.toString('utf-8');
}

let cachedFeeds: Record<string, string>[] | null = null;
let cacheTime = 0;

async function getJoinedFeeds(publisherId: string, feedToken: string): Promise<Record<string, string>[]> {
  const now = Date.now();
  if (cachedFeeds && now - cacheTime < 3_600_000) return cachedFeeds;

  const url = `https://ui.awin.com/productdata-darwin-download/publisher/${publisherId}/${feedToken}/1/feedList`;
  const res = await fetch(url);
  if (!res.ok) { console.error('[awin] feedList error:', res.status); return []; }

  const all = parseCSV(await res.text());
  // Filtrer actifs
  let joined = all.filter(f => f['Membership Status'] === 'active');
  // Déduplication stricte sur URL (un flux = une URL)
  const seenUrls = new Set<string>();
  joined = joined.filter(f => {
    const url = f['URL'];
    if (!url || seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
  console.log(`[awin] marchands actifs: ${joined.map(f => f['Advertiser Name']).join(', ') || 'aucun'} | flux uniques: ${joined.length}`);

  cachedFeeds = joined;
  cacheTime = now;
  return joined;
}

const SPECIFIC_CATEGORIES = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'] as const;

function assignCategory(p: Record<string, string>): AwinProduct['category'] {
  for (const cat of SPECIFIC_CATEGORIES) {
    if (matchesCategory(p, cat)) return cat;
  }
  return 'general';
}

export async function fetchAllAwinProducts(
  publisherId: string,
  feedToken: string,
  limitPerCategory = 30
): Promise<AwinProduct[]> {
  const feeds = await getJoinedFeeds(publisherId, feedToken);
  if (!feeds.length) return [];

  const countPerCat: Record<string, number> = {};
  const seenIds = new Set<string>();
  const allProducts: AwinProduct[] = [];

  for (const feed of feeds) {
    const feedUrl = feed['URL'];
    const merchantName = feed['Advertiser Name'];
    if (!feedUrl) continue;

    try {
      const csvText = await fetchAndDecompress(feedUrl);
      const products = parseCSV(csvText);

      for (const p of products) {
        const id = p['id'] ?? p['aw_product_id'] ?? p['product_id'];
        const name = p['title'] ?? p['product_name'] ?? '';
        const deepLink = p['aw_deep_link'] ?? p['link'] ?? '';
        if (!id || !deepLink) continue;
        if (/\bparts?\b/i.test(name) || / \/ [A-Z0-9]{5,}$/.test(name)) continue;

        const pid = `awin_${id}`;
        if (seenIds.has(pid)) continue;

        const category = assignCategory(p);
        if ((countPerCat[category] ?? 0) >= limitPerCategory) continue;

        const desc = p['description'] ?? '';
        const priceRaw = p['price'] ?? p['search_price'] ?? '0';
        const priceMatch = priceRaw.match(/^([\d.]+)\s*([A-Z]{3})?/);
        const price = parseFloat(priceMatch?.[1] ?? '0') || 0;
        const currency = priceMatch?.[2] ?? 'EUR';
        const availability = p['availability'] ?? p['in_stock'] ?? '';
        const inStock = availability === 'in_stock' || availability === 'in stock' || availability === '1' || availability === 'true';
        const imageUrl = p['image_link'] ?? p['aw_image_url'] ?? p['merchant_image_url'] ?? '';

        seenIds.add(pid);
        countPerCat[category] = (countPerCat[category] ?? 0) + 1;

        allProducts.push({
          id: pid, name, description: desc.slice(0, 200),
          price, currency, image_url: imageUrl,
          affiliate_url: deepLink, merchant_name: merchantName ?? '',
          category, in_stock: inStock,
          last_synced: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(`[awin] feed ${merchantName} erreur:`, e);
    }
  }

  console.log('[awin] sync terminée:', Object.entries(countPerCat).map(([c, n]) => `${c}:${n}`).join(', '));
  return allProducts;
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
        const inStock = availability === 'in_stock' || availability === 'in stock' || availability === '1' || availability === 'true';

        if (!id || !deepLink) continue;
        if (/\bparts?\b/i.test(name) || / \/ [A-Z0-9]{5,}$/.test(name)) continue;

        if (category !== 'general' && !matchesCategory(p, category)) continue;

        const pid = `awin_${id}`;
        if (allProducts.find(x => x.id === pid)) continue;

        allProducts.push({
          id: pid, name, description: desc.slice(0, 200),
          price, currency, image_url: imageUrl,
          affiliate_url: deepLink, merchant_name: merchantName ?? '',
          category, in_stock: inStock,
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
