import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const CRON_PATHS: Record<string, string> = {
  blog:                 '/api/cron/blog',
  social:               '/api/cron/social',
  finance:              '/api/cron/finance',
  security:             '/api/cron/security',
  newsletter:           '/api/cron/newsletter',
  prenoms:              '/api/cron/prenoms',
  'catalog-sync-chiens':         '/api/cron/catalog-sync/chiens',
  'catalog-sync-chats':          '/api/cron/catalog-sync/chats',
  'catalog-sync-oiseaux':        '/api/cron/catalog-sync/oiseaux',
  'catalog-sync-rongeurs':       '/api/cron/catalog-sync/rongeurs',
  'catalog-sync-reptiles':       '/api/cron/catalog-sync/reptiles',
  'catalog-sync-livres':         '/api/cron/catalog-sync/livres',
  'catalog-sync-general':        '/api/cron/catalog-sync/general',
  'catalog-sync-canada-pet-care':'/api/cron/catalog-sync/canada-pet-care',
  'catalog-sync-translate':      '/api/cron/catalog-sync/translate',
  'catalog-dedup-ean':           '/api/cron/catalog-sync/dedup-ean',
  'catalog-dedup-title':         '/api/cron/catalog-sync/dedup-title',
  'catalog-dedup-image':         '/api/cron/catalog-sync/dedup-image',
  'adoption-social':         '/api/cron/adoption-social',
  'breeds':                  '/api/cron/breeds',
  'daily-recap':             '/api/cron/daily-recap',
};

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { step, animal, type, auto, target, bypass, partner, promo, productName, productUrl, forcedImage } = await req.json() as {
    step: string;
    animal?: string;
    type?: string;
    auto?: string;
    target?: string;
    bypass?: string;
    partner?: string;
    promo?: string;
    productName?: string;
    productUrl?: string;
    forcedImage?: string;
  };

  // ─── Produits par partenaire (depuis catalog_best_offer) ──────────────────
  if (step === 'partner-products') {
    const keyword = partner ?? '';
    if (!keyword) return NextResponse.json({ products: [] });
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('catalog_best_offer')
      .select('name, affiliate_url, image_url, price, category, merchant_name')
      .ilike('merchant_name', `%${keyword}%`)
      .gt('price', 0)
      .order('price', { ascending: true })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [] });
  }

  const cronPath = CRON_PATHS[step];
  if (!cronPath) return NextResponse.json({ error: 'Étape inconnue' }, { status: 400 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http://localhost'))
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  const VALID_ANIMALS = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'];
  const VALID_TYPES = ['trending', 'affiliation', 'pratique', 'race', 'best_of'];
  const params = new URLSearchParams();
  if (step === 'blog' && auto === 'true') params.set('auto', 'true');
  else if (step === 'blog' && animal && VALID_ANIMALS.includes(animal)) params.set('animal', animal);
  if (step === 'blog' && type && VALID_TYPES.includes(type)) params.set('type', type);
  if (step === 'blog' && partner) params.set('partner', partner);
  if (step === 'blog' && promo) params.set('promo', promo);
  if (step === 'blog' && productName) params.set('productName', productName);
  if (step === 'blog' && productUrl) params.set('productUrl', productUrl);
  if (step === 'blog' && forcedImage) params.set('forcedImage', forcedImage);
  if (step === 'newsletter' && bypass === 'true') params.set('bypass', 'true');
  if (step === 'newsletter' && target) params.set('target', target);
  const queryParams = params.toString() ? `?${params.toString()}` : '';

  try {
    const r = await fetch(`${appUrl}${cronPath}${queryParams}`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 });
  }
}
