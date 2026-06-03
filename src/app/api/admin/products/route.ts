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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as {
    name: string;
    description: string;
    price: number;
    amazon_url: string;
    image_url: string;
    categories: string[];
    product_type?: string;
  };

  if (!body.name?.trim() || !body.amazon_url?.trim() || !body.image_url?.trim()) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const asin = extractAsin(body.amazon_url);
  if (!asin) return NextResponse.json({ error: 'ASIN introuvable dans l\'URL Amazon' }, { status: 400 });

  const affiliateUrl = buildAffiliateUrl(asin);

  const VALID_TYPES = ['nourriture', 'jouets', 'hygiene', 'sante', 'habitat', 'accessoires', 'livres'];
  const productType = body.product_type && VALID_TYPES.includes(body.product_type) ? body.product_type : 'accessoires';
  // Catégories animales choisies (chiens, chats…). Catégorie principale = la 1re, sinon 'general'
  // (sauf livres → catégorie 'livres' pour cohérence avec l'existant).
  const animalCats = Array.isArray(body.categories) ? body.categories.filter(Boolean) : [];
  const categories = animalCats;
  const primaryCategory = productType === 'livres' ? 'livres' : (animalCats[0] ?? 'general');

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
      description: body.description?.trim()?.slice(0, 2000) || null,
      image_url: body.image_url.trim(),
      category: primaryCategory,
      categories,
      product_type: productType,
      status: 'active',
    }).eq('id', catalogId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: newEntry, error } = await admin.from('products_catalog').insert({
      ean: null, isbn: null,
      name: body.name.trim(),
      brand: null,
      category: primaryCategory,
      categories,
      product_type: productType,
      image_url: body.image_url.trim(),
      description: body.description?.trim()?.slice(0, 2000) || null,
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id, categories, name, price, description, product_type, amazon_url } = await req.json() as {
    id: string; categories: string[]; name?: string; price?: number; description?: string; product_type?: string; amazon_url?: string;
  };

  if (!id || !isValidUUID(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

  const cats = Array.isArray(categories) ? categories.filter(Boolean) : [];

  const admin = createAdminClient();
  const update: Record<string, unknown> = { categories: cats };
  const VALID_TYPES = ['nourriture', 'jouets', 'hygiene', 'sante', 'habitat', 'accessoires', 'livres'];
  if (product_type && VALID_TYPES.includes(product_type)) update.product_type = product_type;
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

  // Nouvelle URL Amazon → ré-affiliation auto (tag mespoilus-21) sur l'offre
  if (amazon_url?.trim()) {
    const asin = extractAsin(amazon_url);
    if (!asin) return NextResponse.json({ error: 'ASIN introuvable dans l\'URL Amazon' }, { status: 400 });
    const { error: offErr } = await admin.from('product_offers')
      .update({ affiliate_url: buildAffiliateUrl(asin), in_stock: true })
      .eq('catalog_id', id)
      .eq('merchant_name', 'Amazon FR');
    if (offErr) return NextResponse.json({ error: offErr.message }, { status: 500 });
  }

  const { error } = await admin.from('products_catalog').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
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
