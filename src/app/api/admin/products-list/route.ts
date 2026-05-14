import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const merchant = searchParams.get('merchant') ?? 'Amazon FR';

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .select('id, name, description, price, currency, image_url, affiliate_url, categories, merchant_name')
    .eq('merchant_name', merchant)
    .order('last_synced', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}
