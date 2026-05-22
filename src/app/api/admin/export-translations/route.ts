import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value).replace(/\r?\n/g, ' ').trim();
  if (str.includes('"') || str.includes(',') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const supabase = createAdminClient();

  // 1. Produits traduits — pagination pour dépasser la limite max_rows Supabase (1000)
  const PAGE = 1000;
  const products: Array<{ id: string; name: string; name_fr: string | null; description: string | null; description_fr: string | null; category: string | null }> = [];
  let from = 0;
  while (true) {
    const { data, error: prodError } = await supabase
      .from('products_catalog')
      .select('id, name, name_fr, description, description_fr, category')
      .not('name_fr', 'is', null)
      .order('category')
      .range(from, from + PAGE - 1);
    if (prodError) return Response.json({ error: prodError.message }, { status: 500 });
    products.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
    from += PAGE;
  }

  const ids = (products ?? []).map(p => p.id);

  // 2. Marchands associés en batches de 500 pour couvrir tous les produits
  const merchantMap = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    const { data: offers } = await supabase
      .from('product_offers')
      .select('catalog_id, merchant_name')
      .in('catalog_id', batch);

    for (const o of offers ?? []) {
      const existing = merchantMap.get(o.catalog_id);
      if (!existing) merchantMap.set(o.catalog_id, o.merchant_name);
      else if (!existing.includes(o.merchant_name)) {
        merchantMap.set(o.catalog_id, `${existing} / ${o.merchant_name}`);
      }
    }
  }

  const rows = (products ?? []).map(p => {
    const nameChanged = p.name_fr && p.name_fr !== p.name;
    const descChanged = p.description_fr && p.description_fr !== p.description;
    return {
      id:                    p.id ?? '',
      categorie:             p.category ?? '',
      marchand:              merchantMap.get(p.id) ?? '',
      nom_original:          p.name ?? '',
      nom_traduit:           nameChanged ? (p.name_fr ?? '') : '',
      nom_statut:            nameChanged ? 'TRADUIT' : 'DEJA_FR',
      description_originale: p.description ?? '',
      description_traduite:  descChanged ? (p.description_fr ?? '') : '',
      description_statut:    p.description_fr ? (descChanged ? 'TRADUIT' : 'DEJA_FR') : 'NON_TRADUIT',
    };
  });

  const headers: (keyof typeof rows[0])[] = [
    'id', 'categorie', 'marchand',
    'nom_original', 'nom_traduit', 'nom_statut',
    'description_originale', 'description_traduite', 'description_statut',
  ];

  const csv = [
    '﻿' + headers.join(';'),
    ...rows.map(r => headers.map(h => escapeCsv(r[h])).join(';')),
  ].join('\r\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="traductions-mespoilus-${date}.csv"`,
    },
  });
}
