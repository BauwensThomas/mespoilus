const CJ_GRAPHQL_URL = 'https://ads.api.cj.com/query';

interface AmountWithCurrency {
  amount: string;
  currency: string;
}

export interface CJShoppingProduct {
  id: string;
  title: string;
  description?: string;
  price?: AmountWithCurrency;
  salePrice?: AmountWithCurrency;
  imageLink?: string;
  link?: string;
  brand?: string;
  advertiserId: string;
  advertiserName: string;
}

export interface DBProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  merchant_name: string;
  category: string;
  categories: string[];
  product_type: string;
  last_synced: string;
}

const SHOPPING_PRODUCTS_QUERY = `
  query Products($companyId: ID!, $partnerIds: [ID!], $limit: Int!, $offset: Int!) {
    products(
      companyId: $companyId
      partnerIds: $partnerIds
      partnerStatus: JOINED
      limit: $limit
      offset: $offset
    ) {
      totalCount
      resultList {
        id
        title
        description
        price {
          amount
          currency
        }
        salePrice {
          amount
          currency
        }
        imageLink
        link
        brand
        advertiserId
        advertiserName
      }
    }
  }
`;

async function queryCJ<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(CJ_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`CJ API HTTP error: ${res.status} - ${body.slice(0, 500)}`);
  }

  const json = await res.json();
  if (json.errors?.length) throw new Error(`CJ GraphQL error: ${json.errors[0].message}`);

  return json.data;
}

function detectCategories(title: string, desc: string): string[] {
  const text = `${title} ${desc}`.toLowerCase();
  const cats: string[] = [];
  if (/\b(dog|chien|hond|hunde)\b/.test(text)) cats.push('chiens');
  if (/\b(cat|chat|kat|katze)\b/.test(text)) cats.push('chats');
  return cats.length > 0 ? cats : ['chiens', 'chats'];
}

function mapToDB(p: CJShoppingProduct): DBProduct | null {
  if (!p.imageLink || !p.link) return null;

  const priceObj = p.salePrice ?? p.price;
  const price = priceObj ? parseFloat(priceObj.amount) : 0;
  const currency = priceObj?.currency ?? 'USD';
  const categories = detectCategories(p.title, p.description ?? '');

  return {
    id: `cj_${p.advertiserId}_${p.id}`,
    name: p.title,
    description: p.description ?? '',
    price: isNaN(price) ? 0 : price,
    currency,
    image_url: p.imageLink,
    affiliate_url: p.link,
    merchant_name: p.advertiserName,
    category: categories[0],
    categories,
    product_type: 'sante',
    last_synced: new Date().toISOString(),
  };
}

export async function fetchCJProductsForAdvertiser(
  companyId: string,
  token: string,
  advertiserId: string,
  onBatch: (batch: DBProduct[]) => Promise<void>
): Promise<number> {
  const LIMIT = 100;
  let offset = 0;
  let totalSynced = 0;
  let totalCount = Infinity;

  while (offset < totalCount) {
    const data = await queryCJ<{
      products: { totalCount: number; resultList: CJShoppingProduct[] };
    }>(token, SHOPPING_PRODUCTS_QUERY, {
      companyId,
      partnerIds: [advertiserId],
      limit: LIMIT,
      offset,
    });

    const { resultList, totalCount: count } = data.products;
    totalCount = count;

    if (!resultList.length) break;

    const batch = resultList.map(mapToDB).filter((p): p is DBProduct => p !== null);
    if (batch.length > 0) {
      await onBatch(batch);
      totalSynced += batch.length;
    }

    offset += resultList.length;
    if (resultList.length < LIMIT) break;
  }

  return totalSynced;
}
