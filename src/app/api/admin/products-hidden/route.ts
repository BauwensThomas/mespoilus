import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const admin = createAdminClient();
  const { data: hiddenData } = await admin
    .from('products_hidden')
    .select('affiliate_url, hidden_at')
    .order('hidden_at', { ascending: false });

  const hiddenUrls = hiddenData?.map(h => h.affiliate_url) ?? [];

  if (hiddenUrls.length === 0) return NextResponse.json({ hidden: [] });

  const { data: productData } = await admin
    .from('products')
    .select('id, name, price, currency, image_url, affiliate_url, merchant_name, product_type, categories')
    .in('affiliate_url', hiddenUrls);

  const productMap = new Map(productData?.map(p => [p.affiliate_url, p]) ?? []);

  const hidden = (hiddenData ?? []).map(h => ({
    affiliate_url: h.affiliate_url,
    hidden_at: h.hidden_at,
    product: productMap.get(h.affiliate_url) ?? null,
  }));

  return NextResponse.json({ hidden });
}

export async function POST(req: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { affiliate_url } = await req.json();
  if (!affiliate_url) return NextResponse.json({ error: 'affiliate_url requis' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('products_hidden').upsert({ affiliate_url });
  revalidatePath('/boutique');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { affiliate_url } = await req.json();
  if (!affiliate_url) return NextResponse.json({ error: 'affiliate_url requis' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('products_hidden').delete().eq('affiliate_url', affiliate_url);
  revalidatePath('/boutique');
  return NextResponse.json({ success: true });
}
