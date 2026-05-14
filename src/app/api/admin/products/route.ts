import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function extractAsin(url: string): string | null {
  const m = url.match(/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function buildAffiliateUrl(asin: string): string {
  return `https://www.amazon.fr/dp/${asin}?tag=mespoilus-21`;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as {
    name: string;
    description: string;
    price: number;
    amazon_url: string;
    image_url: string;
    categories: string[];
  };

  if (!body.name?.trim() || !body.amazon_url?.trim() || !body.image_url?.trim()) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const asin = extractAsin(body.amazon_url);
  if (!asin) return NextResponse.json({ error: 'ASIN introuvable dans l\'URL Amazon' }, { status: 400 });

  const affiliateUrl = buildAffiliateUrl(asin);
  const categories = body.categories.length > 0 ? body.categories : ['livres'];
  if (!categories.includes('livres')) categories.unshift('livres');

  const admin = createAdminClient();
  const { error } = await admin.from('products').upsert({
    id: `amazon_${asin}`,
    name: body.name.trim(),
    description: body.description?.trim() ?? '',
    price: body.price,
    currency: 'EUR',
    image_url: body.image_url.trim(),
    affiliate_url: affiliateUrl,
    merchant_name: 'Amazon FR',
    category: 'livres',
    categories,
    last_synced: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, asin, affiliate_url: affiliateUrl });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id?.startsWith('amazon_')) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
