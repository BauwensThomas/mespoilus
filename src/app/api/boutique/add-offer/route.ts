import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { catalog_id, affiliate_url, price, currency, merchant_name } = await req.json() as {
    catalog_id: string;
    affiliate_url: string;
    price: number;
    currency: string;
    merchant_name: string;
  };

  if (!catalog_id || !affiliate_url || !merchant_name) {
    return NextResponse.json({ error: 'catalog_id, affiliate_url et merchant_name requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error: offerError } = await admin.from('product_offers').upsert({
    catalog_id,
    affiliate_url,
    price: price || 0,
    currency: currency || 'EUR',
    merchant_name,
    in_stock: true,
    source: 'manual',
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'affiliate_url' });

  if (offerError) return NextResponse.json({ error: offerError.message }, { status: 500 });

  await admin.from('products_catalog').update({ status: 'pinned' }).eq('id', catalog_id);

  await admin.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Boutique V2] Offre manuelle ajoutée : ${catalog_id} → ${merchant_name}`,
    details: { catalog_id, affiliate_url, price, currency, merchant_name },
    status: 'success',
  });

  return NextResponse.json({ ok: true });
}
