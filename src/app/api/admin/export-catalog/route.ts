import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

function esc(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val).replace(/\r?\n/g, ' ').trim();
  return s.includes(';') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = createAdminClient();

  // 1. Tous les produits — pagination pour dépasser la limite max_rows Supabase (1000)
  const PAGE = 1000;
  const products: Array<{ id: string; name: string; name_fr: string | null; description: string | null; description_fr: string | null; category: string | null; brand: string | null; ean: string | null; created_at: string | null; updated_at: string | null }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products_catalog')
      .select('id, name, name_fr, description, description_fr, category, brand, ean, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    products.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
    from += PAGE;
  }

  const ids = (products ?? []).map(p => p.id);

  // 2. Offres en batches de 500 pour couvrir tous les produits
  const offersMap = new Map<string, { merchant_name: string; price: number; currency: string; in_stock: boolean }>();
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    const { data: offers } = await supabase
      .from('product_offers')
      .select('catalog_id, merchant_name, price, currency, in_stock')
      .in('catalog_id', batch);

    for (const o of offers ?? []) {
      if (!offersMap.has(o.catalog_id)) {
        offersMap.set(o.catalog_id, {
          merchant_name: o.merchant_name ?? '',
          price: o.price ?? 0,
          currency: o.currency ?? '',
          in_stock: o.in_stock ?? false,
        });
      }
    }
  }

  const rows = (products ?? []).map(p => {
    const offer = offersMap.get(p.id);
    const createdAt = p.created_at?.slice(0, 10) ?? '';
    const updatedAt = p.updated_at?.slice(0, 10) ?? '';
    return {
      statut:         createdAt === updatedAt ? 'nouveau' : 'mis_a_jour',
      categorie:      p.category ?? '',
      marque:         p.brand ?? '',
      ean:            p.ean ?? '',
      nom:            p.name ?? '',
      nom_fr:         p.name_fr ?? '',
      description:    p.description ?? '',
      description_fr: p.description_fr ?? '',
      marchand:       offer?.merchant_name ?? '',
      prix:           offer ? String(offer.price) : '',
      devise:         offer?.currency ?? '',
      en_stock:       offer ? (offer.in_stock ? 'oui' : 'non') : '',
      cree_le:        createdAt,
      mis_a_jour:     updatedAt,
      id:             p.id ?? '',
    };
  });

  const headers: (keyof typeof rows[0])[] = [
    'statut', 'categorie', 'marque', 'ean',
    'nom', 'nom_fr', 'description', 'description_fr',
    'marchand', 'prix', 'devise', 'en_stock',
    'cree_le', 'mis_a_jour', 'id',
  ];

  const csv = [
    '﻿' + headers.join(';'),
    ...rows.map(r => headers.map(h => esc(r[h])).join(';')),
  ].join('\r\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="catalogue-mespoilus-${date}.csv"`,
    },
  });
}
