import type { AwinProduct } from '@/types';

const AWIN_API_BASE = 'https://api.awin.com';

export const AWIN_CATEGORY_SEARCH: Record<string, string[]> = {
  chiens:   ['dog', 'chien', 'canin'],
  chats:    ['cat', 'chat', 'felin'],
  oiseaux:  ['bird', 'oiseau'],
  rongeurs: ['rabbit', 'hamster', 'rongeur'],
  reptiles: ['reptile'],
  general:  ['pet', 'animal'],
};

export interface AwinAdvertiser {
  id: number;
  name: string;
}

export interface AwinRawProduct {
  id: string;
  title: string;
  description: string;
  price: string;           // format: "12.99 EUR"
  image_link: string;
  link: string;            // lien affilié
  brand?: string;
  availability: string;
  google_product_category?: string;
}

function mapAwinProduct(raw: AwinRawProduct, category: AwinProduct['category'], merchantName: string): AwinProduct {
  const [amount, currency] = raw.price?.split(' ') ?? ['0', 'EUR'];
  return {
    id: raw.id,
    name: raw.title,
    description: raw.description?.slice(0, 200) ?? '',
    price: parseFloat(amount ?? '0'),
    currency: currency ?? 'EUR',
    image_url: raw.image_link,
    affiliate_url: raw.link,
    merchant_name: merchantName,
    category,
    in_stock: raw.availability === 'in_stock',
    last_synced: new Date().toISOString(),
  };
}

// 1. Récupérer les advertisers approuvés
export async function fetchApprovedAdvertisers(
  publisherId: string,
  apiToken: string
): Promise<AwinAdvertiser[]> {
  const res = await fetch(
    `${AWIN_API_BASE}/publishers/${publisherId}/programmes?relationship=joined`,
    {
      headers: { Authorization: `Bearer ${apiToken}` },
    }
  );
  if (!res.ok) {
    console.error('Awin advertisers error:', res.status, await res.text());
    return [];
  }
  const json = await res.json();
  console.log('Advertisers trouvés:', json.length, json.map((p: any) => p.name));
  return (json ?? []).map((p: any) => ({ id: p.id, name: p.name }));
}

// 2. Télécharger le feed d'un advertiser et filtrer par mots-clés
export async function fetchAwinProducts(
  publisherId: string,
  apiToken: string,
  category: AwinProduct['category'],
  limit = 30
): Promise<AwinProduct[]> {
  const keywords = AWIN_CATEGORY_SEARCH[category] ?? ['pet'];
  const advertisers = await fetchApprovedAdvertisers(publisherId, apiToken);
  console.log('Nombre advertisers:', advertisers.length);

  if (!advertisers.length) {
    console.error('Aucun advertiser approuvé trouvé');
    return [];
  }

  const allProducts: AwinProduct[] = [];

  for (const advertiser of advertisers.slice(0, 5)) { // max 5 advertisers par run
    try {
      const res = await fetch(
        `${AWIN_API_BASE}/publishers/${publisherId}/awinfeeds/download/${advertiser.id}-retail-fr_FR.jsonl`,
        {
          headers: { Authorization: `Bearer ${apiToken}` },
          next: { revalidate: 86400 },
        }
      );

      if (!res.ok) continue;

      const text = await res.text();
      const lines = text.trim().split('\n');

      for (const line of lines) {
        if (allProducts.length >= limit) break;
        try {
          const product: AwinRawProduct = JSON.parse(line);
          const titleLower = (product.title ?? '').toLowerCase();
          const descLower = (product.description ?? '').toLowerCase();
          const matches = keywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
          if (matches) {
            allProducts.push(mapAwinProduct(product, category, advertiser.name));
          }
        } catch { continue; }
      }
    } catch (err) {
      console.error(`Feed error for advertiser ${advertiser.id}:`, err);
    }

    if (allProducts.length >= limit) break;
  }

  return allProducts;
}