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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as { products?: any[] };

  if (!body.products || !Array.isArray(body.products)) {
    return NextResponse.json({ error: 'Données JSON requises' }, { status: 400 });
  }

  const data = body.products;

  if (!Array.isArray(data)) {
    return NextResponse.json({ error: 'Le fichier JSON doit contenir un tableau de produits' }, { status: 400 });
  }

  const admin = createAdminClient();
  let addedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  const categoryMap: { [key: string]: string } = {
    'chien': 'chiens',
    'chiens': 'chiens',
    'chat': 'chats',
    'chats': 'chats',
    'oiseau': 'oiseaux',
    'oiseaux': 'oiseaux',
    'rongeur': 'rongeurs',
    'rongeurs': 'rongeurs',
    'reptile': 'reptiles',
    'reptiles': 'reptiles',
  };

  const typeMap: { [key: string]: string } = {
    'nourriture': 'nourriture',
    'jouets': 'jouets',
    'jeux': 'jouets',
    'hygiene': 'hygiene',
    'hygiène': 'hygiene',
    'sante': 'sante',
    'santé': 'sante',
    'habitat': 'habitat',
    'accessoires': 'accessoires',
    'livres': 'livres',
  };

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    try {
      // Valider les champs obligatoires
      if (!item.titre?.trim() || !item.prix || !item.image?.trim()) {
        failedCount++;
        errors.push(`Produit ${i + 1}: Champs obligatoires manquants (titre, prix, image)`);
        continue;
      }

      // Construire l'URL affiliate
      let affiliateUrl = item.url_affiliee;
      if (!affiliateUrl) {
        const asin = extractAsin(item.asin || '');
        if (!asin) {
          failedCount++;
          errors.push(`Produit ${i + 1}: ASIN invalide`);
          continue;
        }
        affiliateUrl = buildAffiliateUrl(asin);
      }

      // Mapper les catégories
      const categories = item.categorie_animal
        ? item.categorie_animal
            .split(',')
            .map((c: string) => {
              const normalized = c.trim().toLowerCase();
              return categoryMap[normalized] || normalized;
            })
            .filter((c: string) => c && Object.values(categoryMap).includes(c))
        : [];

      // Mapper le type de produit
      const rawType = item.type_produit?.toLowerCase().trim() || 'accessoires';
      const productType = typeMap[rawType] || 'accessoires';

      // Note clients (étoiles) + nombre d'avis — optionnels
      const ratingRaw = parseFloat(String(item.note ?? '').replace(',', '.'));
      const rating = Number.isFinite(ratingRaw) && ratingRaw > 0 && ratingRaw <= 5 ? Math.round(ratingRaw * 10) / 10 : null;
      const countRaw = parseInt(String(item.nb_avis ?? '').replace(/[^\d]/g, ''), 10);
      const ratingCount = Number.isFinite(countRaw) && countRaw > 0 ? countRaw : null;

      // Chercher si l'offre existe déjà
      const { data: existingOffer } = await admin
        .from('product_offers')
        .select('catalog_id')
        .eq('affiliate_url', affiliateUrl)
        .maybeSingle();

      let catalogId: string;
      const primaryCategory = productType === 'livres' ? 'livres' : (categories[0] ?? 'general');

      if (existingOffer) {
        catalogId = existingOffer.catalog_id;
        const { error } = await admin.from('products_catalog').update({
          name: item.titre.trim(),
          description: item.description?.trim()?.slice(0, 2000) || null,
          image_url: item.image.trim(),
          category: primaryCategory,
          categories,
          product_type: productType,
          rating,
          rating_count: ratingCount,
          status: 'active',
        }).eq('id', catalogId);
        if (error) throw new Error(error.message);
      } else {
        const { data: newEntry, error } = await admin.from('products_catalog').insert({
          ean: null,
          isbn: null,
          name: item.titre.trim(),
          brand: null,
          category: primaryCategory,
          categories,
          product_type: productType,
          image_url: item.image.trim(),
          description: item.description?.trim()?.slice(0, 2000) || null,
          rating,
          rating_count: ratingCount,
          status: 'active',
          amazon_imported_json: true,
        }).select('id').single();

        if (error || !newEntry) throw new Error(error?.message ?? 'Erreur création fiche');
        catalogId = newEntry.id;
      }

      // Ajouter l'offre
      const { error: offerError } = await admin.from('product_offers').upsert({
        catalog_id: catalogId,
        source: 'amazon',
        merchant_name: 'Amazon FR',
        country: 'fr',
        price: parseFloat(item.prix),
        currency: 'EUR',
        affiliate_url: affiliateUrl,
        in_stock: true,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'affiliate_url' });

      if (offerError) throw new Error(offerError.message);

      addedCount++;
    } catch (error) {
      failedCount++;
      errors.push(`Produit ${i + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  return NextResponse.json({
    success: true,
    addedCount,
    failedCount,
    total: data.length,
    errors: errors.slice(0, 10), // Limiter à 10 erreurs
  });
}

