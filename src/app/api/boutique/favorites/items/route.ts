import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { ids } = await req.json() as { ids: string[] };
  if (!ids?.length) return NextResponse.json({ items: [] });

  const supabase = createAdminClient();

  const { data } = await supabase
    .from('catalog_best_offer')
    .select('catalog_id, name, brand, category, image_url, weight_g, price, currency, merchant_name, country, affiliate_url')
    .in('catalog_id', ids);

  if (!data?.length) return NextResponse.json({ items: [] });

  const { data: nameFrData } = await supabase
    .from('products_catalog')
    .select('id, name_fr')
    .in('id', ids);

  const nameFrMap = new Map((nameFrData ?? []).filter(r => r.name_fr).map(r => [r.id, r.name_fr as string]));

  const { data: offerCounts } = await supabase
    .rpc('get_offer_counts', { catalog_ids: data.map(r => r.catalog_id) });

  const countMap = new Map(
    (offerCounts ?? []).map((r: { catalog_id: string; offer_count: number }) => [r.catalog_id, Number(r.offer_count)])
  );

  const items = data.map(r => ({
    catalog_id:   r.catalog_id as string,
    name:         r.name as string,
    name_fr:      nameFrMap.get(r.catalog_id as string) ?? null,
    image_url:    (r.image_url as string | null) ?? null,
    brand:        (r.brand as string | null) ?? null,
    category:     r.category as string,
    weight_g:     (r.weight_g as number | null) ?? null,
    price:        r.price as number,
    currency:     r.currency as string,
    merchant_name: r.merchant_name as string,
    country:      (r.country as string | null) ?? null,
    affiliate_url: r.affiliate_url as string,
    offer_count:  countMap.get(r.catalog_id as string) ?? 1,
  }));

  return NextResponse.json({ items });
}
