import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const PAGE_SIZE = 60;

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const merchant  = searchParams.get('merchant') ?? 'Amazon FR';
  const search    = searchParams.get('search');
  const category  = searchParams.get('category');
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
  const offset    = (page - 1) * PAGE_SIZE;

  const admin = createAdminClient();

  // Construire la query sur products_catalog avec join !inner sur product_offers
  const selectStr = 'id, name, description, image_url, categories, product_offers!inner(price, currency, affiliate_url, merchant_name)';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataQ: any = admin
    .from('products_catalog')
    .select(selectStr, { count: 'exact' })
    .in('status', ['active', 'hidden'])
    .order('name', { ascending: true });

  if (merchant !== 'all') {
    dataQ = dataQ.eq('product_offers.merchant_name', merchant);
  }

  if (category) {
    dataQ = dataQ.or(`category.eq.${category},categories.cs.{${category}}`);
  }
  if (search) {
    dataQ = dataQ.ilike('name', `%${search}%`);
  }

  dataQ = dataQ.range(offset, offset + PAGE_SIZE - 1);

  const { data, error, count } = await dataQ;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aplatir : prendre la première offre du join
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (data ?? []).map((pc: any) => {
    const offer = Array.isArray(pc.product_offers) ? pc.product_offers[0] : pc.product_offers;
    return {
      id: pc.id,
      name: pc.name,
      description: pc.description ?? '',
      price: offer?.price ?? 0,
      currency: offer?.currency ?? 'EUR',
      image_url: pc.image_url ?? '',
      affiliate_url: offer?.affiliate_url ?? '',
      categories: pc.categories ?? [],
      merchant_name: offer?.merchant_name ?? merchant,
    };
  });

  return NextResponse.json({
    products,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
}
