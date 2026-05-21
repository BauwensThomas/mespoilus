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

function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
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

  // Chercher si cette offre Amazon existe déjà dans product_offers
  const { data: existingOffer } = await admin
    .from('product_offers')
    .select('catalog_id')
    .eq('affiliate_url', affiliateUrl)
    .maybeSingle();

  let catalogId: string;

  if (existingOffer) {
    catalogId = existingOffer.catalog_id;
    const { error } = await admin.from('products_catalog').update({
      name: body.name.trim(),
      description: body.description?.trim()?.slice(0, 500) || null,
      image_url: body.image_url.trim(),
      categories,
      status: 'active',
    }).eq('id', catalogId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: newEntry, error } = await admin.from('products_catalog').insert({
      ean: null, isbn: null,
      name: body.name.trim(),
      brand: null,
      category: 'livres',
      categories,
      image_url: body.image_url.trim(),
      description: body.description?.trim()?.slice(0, 500) || null,
      status: 'active',
    }).select('id').single();
    if (error || !newEntry) return NextResponse.json({ error: error?.message ?? 'Erreur création fiche' }, { status: 500 });
    catalogId = newEntry.id;
  }

  const { error: offerError } = await admin.from('product_offers').upsert({
    catalog_id: catalogId,
    source: 'amazon',
    merchant_name: 'Amazon FR',
    country: 'fr',
    price: body.price,
    currency: 'EUR',
    affiliate_url: affiliateUrl,
    in_stock: true,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'affiliate_url' });

  if (offerError) return NextResponse.json({ error: offerError.message }, { status: 500 });

  return NextResponse.json({ success: true, asin, affiliate_url: affiliateUrl, id: catalogId });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id, categories, name, price, description } = await req.json() as {
    id: string; categories: string[]; name?: string; price?: number; description?: string;
  };

  if (!id || !isValidUUID(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

  const cats = categories.length > 0 ? categories : ['livres'];
  if (!cats.includes('livres')) cats.unshift('livres');

  const admin = createAdminClient();
  const update: Record<string, unknown> = { categories: cats };
  if (name?.trim()) update.name = name.trim();
  if (price !== undefined) update.price = price;
  if (description !== undefined) update.description = description.trim();

  // Mettre à jour le prix dans product_offers si fourni
  if (price !== undefined) {
    await admin.from('product_offers')
      .update({ price })
      .eq('catalog_id', id)
      .eq('merchant_name', 'Amazon FR');
  }

  const { error } = await admin.from('products_catalog').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id || !isValidUUID(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

  const admin = createAdminClient();
  // product_offers supprimées en cascade via ON DELETE CASCADE
  const { error } = await admin.from('products_catalog').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
