import type { AwinProduct } from '@/types';

export const AWIN_CATEGORY_SEARCH: Record<string, string[]> = {
  chiens:   ['dog', 'chien', 'canin', 'chiot', 'puppy'],
  chats:    ['cat', 'chat', 'felin', 'chaton', 'kitten', 'litter', 'litière'],
  oiseaux:  ['bird', 'oiseau', 'perroquet', 'canari'],
  rongeurs: ['rabbit', 'hamster', 'rongeur', 'lapin', 'cobaye', 'guinea'],
  reptiles: ['reptile', 'serpent', 'lézard', 'tortue', 'turtle'],
  general:  ['pet', 'animal', 'animaux'],
};

export interface AwinAdvertiser {
  id: number;
  name: string;
}

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

export async function fetchAwinProducts(
  publisherId: string,
  feedToken: string,
  category: AwinProduct['category'],
  limit = 30
): Promise<AwinProduct[]> {
  const base = `https://ui.awin.com/productdata-darwin-download/publisher/${publisherId}/${feedToken}/1`;

  let feeds: Record<string, string>[] = [];
  try {
    const res = await fetch(`${base}/feedList`, { next: { revalidate: 86400 } });
    if (!res.ok) { console.error('[awin] feedList error:', res.status); return []; }
    feeds = parseCSV(await res.text());
    console.log(`[awin] ${feeds.length} feed(s) disponibles:`, feeds.map(f => f.merchant_name ?? f.advertiser_name ?? f.aw_feed_id));
  } catch (e) {
    console.error('[awin] feedList exception:', e);
    return [];
  }

  const keywords = AWIN_CATEGORY_SEARCH[category] ?? ['pet'];
  const allProducts: AwinProduct[] = [];

  for (const feed of feeds) {
    if (allProducts.length >= limit) break;
    const feedId = feed.aw_feed_id ?? feed.feed_id ?? feed.id;
    if (!feedId) continue;

    try {
      const res = await fetch(`${base}/${feedId}`, { next: { revalidate: 86400 } });
      console.log(`[awin] feed ${feedId}: HTTP ${res.status}`);
      if (!res.ok) continue;

      const products = parseCSV(await res.text());

      for (const p of products) {
        if (allProducts.length >= limit) break;
        if (!p.aw_product_id || !p.aw_deep_link) continue;

        const text = `${p.product_name} ${p.description ?? ''} ${p.category_name ?? ''}`.toLowerCase();
        if (category !== 'general' && !keywords.some(kw => text.includes(kw.toLowerCase()))) continue;

        const id = `awin_${p.aw_product_id}`;
        if (allProducts.find(x => x.id === id)) continue;

        allProducts.push({
          id,
          name: p.product_name ?? '',
          description: (p.description ?? '').slice(0, 200),
          price: parseFloat(p.search_price ?? '0') || 0,
          currency: p.currency_symbol ?? 'EUR',
          image_url: p.aw_image_url ?? p.merchant_image_url ?? '',
          affiliate_url: p.aw_deep_link,
          merchant_name: p.merchant_name ?? '',
          category,
          in_stock: p.in_stock === '1' || p.in_stock === 'true',
          last_synced: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(`[awin] feed ${feedId} exception:`, e);
    }
  }

  console.log(`[awin] Catégorie "${category}": ${allProducts.length} produits`);
  return allProducts;
}
