import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 30;

function esc(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val).replace(/\r?\n/g, ' ').trim();
  return s.includes(';') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = createAdminClient();

  const PAGE = 1000;
  const rows: Array<{ slug: string; name: string; animal: string; status: string | null; photo_url: string | null; generated_at: string | null }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('breeds')
      .select('slug, name, animal, status, photo_url, generated_at')
      .order('animal')
      .order('name')
      .range(from, from + PAGE - 1);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) break;
    from += PAGE;
  }
  const csv = [
    '﻿slug;nom;animal;statut;photo;date',
    ...rows.map(r => [
      esc(r.slug),
      esc(r.name),
      esc(r.animal),
      esc(r.status),
      r.photo_url ? 'oui' : 'non',
      esc(r.generated_at?.slice(0, 10)),
    ].join(';')),
  ].join('\r\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fiches-races-${date}.csv"`,
    },
  });
}
