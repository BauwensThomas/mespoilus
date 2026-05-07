import type { AwinProduct } from '@/types';

const AWIN_API_BASE = 'https://api.awin.com';

// Mapping catégories internes → termes de recherche Awin
export const AWIN_CATEGORY_SEARCH: Record<string, string> = {
  chiens:   'dog',
  chats:    'cat',
  oiseaux:  'bird',
  rongeurs: 'rabbit hamster',
  reptiles: 'reptile',
  general:  'pet',
};

export interface AwinRawProduct {
  id: string;
  productName: string;
  description: string;
  price: { amount: string; currency: string };
  imgUrl: string;
  merchantProductId: string;
  merchantName: string;
  aw_deep_link: string;
  inStock: boolean;
}

function mapAwinProduct(raw: AwinRawProduct, category: AwinProduct['category']): AwinProduct {
  return {
    id: raw.id,
    name: raw.productName,
    description: raw.description?.slice(0, 200) ?? '',
    price: parseFloat(raw.price?.amount ?? '0'),
    currency: raw.price?.currency ?? 'EUR',
    image_url: raw.imgUrl,
    affiliate_url: raw.aw_deep_link,
    merchant_name: raw.merchantName,
    category,
    in_stock: raw.inStock ?? true,
    last_synced: new Date().toISOString(),
  };
}

export async function fetchAwinProducts(
  publisherId: string,
  apiToken: string,
  category: AwinProduct['category'],
  limit = 20
): Promise<AwinProduct[]> {
  const search = AWIN_CATEGORY_SEARCH[category] ?? 'pet';

  try {
    const res = await fetch(
      `${AWIN_API_BASE}/publishers/${publisherId}/product-search?` +
        new URLSearchParams({
          searchPhrase: search,
          minPrice: '0',
          maxPrice: '999',
          pageSize: String(limit),
          page: '1',
        }),
      {
        headers: {
          Authorization: `Bearer ${apiToken}`, // ✅ token en header
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      console.error('Awin API error:', res.status, await res.text());
      return [];
    }

    const json = await res.json();
    const products: AwinRawProduct[] = json.products ?? [];
    return products.map((p) => mapAwinProduct(p, category));
  } catch (err) {
    console.error('Awin fetch failed:', err);
    return [];
  }
}
