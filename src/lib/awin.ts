import type { AwinProduct } from '@/types';

const AWIN_API_BASE = 'https://api.awin.com';

// Mots-clés par catégorie pour filtrer les produits
export const AWIN_CATEGORY_SEARCH: Record<string, string[]> = {
  chiens:   ['dog', 'chien', 'canin', 'chiot', 'puppy'],
  chats:    ['cat', 'chat', 'felin', 'chaton', 'kitten'],
  oiseaux:  ['bird', 'oiseau', 'perroquet', 'canari'],
  rongeurs: ['rabbit', 'hamster', 'rongeur', 'lapin', 'cobaye', 'guinea'],
  reptiles: ['reptile', 'serpent', 'lézard', 'tortue', 'turtle'],
  general:  ['pet', 'animal', 'animaux'],
};

export interface AwinAdvertiser {
  id: number;
  name: string;
}

// Structure réelle retournée par l'API Product Feeds Awin
interface AwinFeedProduct {
  product_id: string;
  product_name: string;
  description?: string;
  search_price: string;         // "12.99"
  currency_symbol?: string;     // "EUR"
  aw_image_url?: string;
  merchant_image_url?: string;
  aw_deep_link: string;
  merchant_name: string;
  in_stock?: string;            // "1" ou "0"
  stock_quantity?: string;
  brand_name?: string;
  category_name?: string;
}

function mapFeedProduct(
  raw: AwinFeedProduct,
  category: AwinProduct['category']
): AwinProduct {
  return {
    id: `awin_${raw.product_id}`,
    name: raw.product_name ?? '',
    description: (raw.description ?? '').slice(0, 200),
    price: parseFloat(raw.search_price ?? '0') || 0,
    currency: raw.currency_symbol ?? 'EUR',
    image_url: raw.aw_image_url ?? raw.merchant_image_url ?? '',
    affiliate_url: raw.aw_deep_link ?? '',
    merchant_name: raw.merchant_name ?? '',
    category,
    in_stock: raw.in_stock === '1' || raw.in_stock === 'true',
    last_synced: new Date().toISOString(),
  };
}

// Récupère la liste des marchands approuvés (programmes joints)
export async function fetchApprovedAdvertisers(
  publisherId: string,
  apiToken: string
): Promise<AwinAdvertiser[]> {
  try {
    const res = await fetch(
      `${AWIN_API_BASE}/publishers/${publisherId}/programmes?relationship=joined`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error('[awin] fetchAdvertisers error:', res.status, await res.text());
      return [];
    }

    const json = await res.json();
    const advertisers = (json ?? []).map((p: any) => ({
      id: p.id,
      name: p.name ?? p.primaryRegion?.name ?? String(p.id),
    }));

    console.log(`[awin] ${advertisers.length} marchands approuvés:`, advertisers.map((a: AwinAdvertiser) => a.name));
    return advertisers;
  } catch (err) {
    console.error('[awin] fetchAdvertisers exception:', err);
    return [];
  }
}

// Récupère les produits via l'API Product Feeds Awin
// Endpoint : GET /publishers/{publisherId}/products
// Docs : https://wiki.awin.com/index.php/Product_Feeds_for_Publishers
export async function fetchAwinProducts(
  publisherId: string,
  apiToken: string,
  category: AwinProduct['category'],
  limit = 30
): Promise<AwinProduct[]> {
  const keywords = AWIN_CATEGORY_SEARCH[category] ?? ['pet'];
  const advertisers = await fetchApprovedAdvertisers(publisherId, apiToken);

  if (!advertisers.length) {
    console.warn('[awin] Aucun marchand approuvé — en attente d\'affiliation');
    return [];
  }

  const allProducts: AwinProduct[] = [];

  // On interroge chaque marchand avec chaque mot-clé jusqu'à atteindre la limite
  for (const advertiser of advertisers) {
    if (allProducts.length >= limit) break;

    for (const keyword of keywords) {
      if (allProducts.length >= limit) break;

      try {
        // Endpoint officiel Product Feeds
        const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/products`);
        url.searchParams.set('advertiserId', String(advertiser.id));
        url.searchParams.set('keyword', keyword);
        url.searchParams.set('pageSize', String(Math.min(20, limit - allProducts.length)));
        url.searchParams.set('page', '1');

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${apiToken}` },
          next: { revalidate: 86400 },
        });

        console.log(`[awin] ${advertiser.name} / "${keyword}": HTTP ${res.status}`);

        if (!res.ok) continue;

        const json = await res.json();

        // L'API retourne { products: [...] } ou directement un tableau
        const rawProducts: AwinFeedProduct[] = Array.isArray(json)
          ? json
          : (json?.products ?? json?.data ?? []);

        for (const raw of rawProducts) {
          if (allProducts.length >= limit) break;
          if (!raw.product_id || !raw.aw_deep_link) continue;

          // Déduplique par id
          const mapped = mapFeedProduct(raw, category);
          if (!allProducts.find(p => p.id === mapped.id)) {
            allProducts.push(mapped);
          }
        }
      } catch (err) {
        console.error(`[awin] Erreur ${advertiser.name} / "${keyword}":`, err);
      }
    }
  }

  console.log(`[awin] Catégorie "${category}": ${allProducts.length} produits récupérés`);
  return allProducts;
}