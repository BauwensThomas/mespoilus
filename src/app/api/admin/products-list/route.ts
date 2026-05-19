import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const NON_AWIN = ['Amazon FR', 'CanadaPetCare'];
const PAGE_SIZE = 60;

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const merchant  = searchParams.get('merchant') ?? 'Amazon FR';
  const type      = searchParams.get('type');
  const search    = searchParams.get('search');
  const category  = searchParams.get('category');
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
  const offset    = (page - 1) * PAGE_SIZE;

  const admin = createAdminClient();

  let dataQ = admin
    .from('products')
    .select('id, name, description, price, currency, image_url, affiliate_url, categories, merchant_name, product_type')
    .gt('price', 0)
    .order('merchant_name', { ascending: true })
    .order('name', { ascending: true });

  let countQ = admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .gt('price', 0);

  if (merchant === 'all') {
    // aucun filtre marchand
  } else if (merchant === 'awin') {
    dataQ  = dataQ.not('merchant_name', 'in', `(${NON_AWIN.map(m => `"${m}"`).join(',')})`);
    countQ = countQ.not('merchant_name', 'in', `(${NON_AWIN.map(m => `"${m}"`).join(',')})`);
  } else {
    dataQ  = dataQ.eq('merchant_name', merchant);
    countQ = countQ.eq('merchant_name', merchant);
  }

  if (type) {
    dataQ  = dataQ.eq('product_type', type);
    countQ = countQ.eq('product_type', type);
  }
  if (category) {
    dataQ  = dataQ.contains('categories', [category]);
    countQ = countQ.contains('categories', [category]);
  }
  if (search) {
    dataQ  = dataQ.ilike('name', `%${search}%`);
    countQ = countQ.ilike('name', `%${search}%`);
  }

  dataQ = dataQ.range(offset, offset + PAGE_SIZE - 1);

  const [dataRes, countRes] = await Promise.all([dataQ, countQ]);

  if (dataRes.error) return NextResponse.json({ error: dataRes.error.message }, { status: 500 });

  return NextResponse.json({
    products: dataRes.data ?? [],
    total: countRes.count ?? 0,
    page,
    totalPages: Math.ceil((countRes.count ?? 0) / PAGE_SIZE),
  });
}
