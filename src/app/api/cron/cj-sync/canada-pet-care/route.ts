import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const PUBLISHER_SID = '101746286';
const ADVERTISER_ID = '17287368';
const SITEMAP_URL = 'https://www.canadapetcare.com/sitemap.xml';

function buildAffiliateUrl(productUrl: string): string {
  return `https://www.jdoqocy.com/click-${PUBLISHER_SID}-${ADVERTISER_ID}?url=${encodeURIComponent(productUrl)}`;
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

function extractPrice(html: string): number {
  const m = html.match(/\$\s*([\d,]+\.?\d*)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, ''));
}

function detectCategories(title: string): string[] {
  const t = title.toLowerCase();
  const cats: string[] = [];
  if (/\b(dog|dogs|puppy|puppies|k9|canin)\b/.test(t)) cats.push('chiens');
  if (/\b(cat|cats|kitten|kittens|feline)\b/.test(t)) cats.push('chats');
  if (/\b(bird|birds|pigeon)\b/.test(t)) cats.push('oiseaux');
  return cats.length > 0 ? cats : ['chiens', 'chats'];
}

function extractProductId(url: string): string | null {
  const m = url.match(/-(\d+)\.aspx$/);
  return m ? m[1] : null;
}

async function scrapeProduct(url: string) {
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
    const price = extractPrice(html);

    if (!title || !image) return null;
    return { title, image, description, price };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sitemapRes = await fetch(SITEMAP_URL, { signal: AbortSignal.timeout(10000) });
  if (!sitemapRes.ok) return NextResponse.json({ error: 'Sitemap inaccessible' }, { status: 502 });
  const xml = await sitemapRes.text();

  const productUrls: string[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const priMatch = block.match(/<priority>([\d.]+)<\/priority>/);
    if (!locMatch || !priMatch) continue;
    const url = locMatch[1].trim();
    const priority = parseFloat(priMatch[1]);
    if (priority === 0.85 && url.endsWith('.aspx') && extractProductId(url)) {
      productUrls.push(url);
    }
  }

  const admin = createAdminClient();
  let synced = 0;
  let failed = 0;
  const BATCH = 8;

  for (let i = 0; i < productUrls.length; i += BATCH) {
    const batch = productUrls.slice(i, i + BATCH);
    await Promise.all(batch.map(async (url) => {
      const productId = extractProductId(url);
      if (!productId) return;

      const data = await scrapeProduct(url);
      if (!data) { failed++; return; }

      const categories = detectCategories(data.title);

      const { error } = await admin.from('products').upsert({
        id: `cj_${ADVERTISER_ID}_${productId}`,
        name: data.title,
        description: data.description,
        price: data.price,
        currency: 'USD',
        image_url: data.image,
        affiliate_url: buildAffiliateUrl(url),
        merchant_name: 'CanadaPetCare',
        category: categories[0],
        categories,
        product_type: 'sante',
        last_synced: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) { failed++; } else { synced++; }
    }));
  }

  revalidatePath('/boutique');
  return NextResponse.json({ success: true, synced, failed, total: productUrls.length });
}
