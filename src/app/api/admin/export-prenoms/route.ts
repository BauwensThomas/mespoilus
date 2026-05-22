import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 30;

function esc(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val).replace(/\r?\n/g, ' ').trim();
  return s.includes(';') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('prenoms')
    .select('animal, style, names, generated_at')
    .order('animal')
    .order('style')
    .limit(100000);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Expand: une ligne par prénom
  const rows: { animal: string; style: string; prenom: string; date: string }[] = [];
  for (const r of data ?? []) {
    const names: string[] = Array.isArray(r.names) ? r.names : [];
    const date = r.generated_at?.slice(0, 10) ?? '';
    for (const prenom of names) {
      rows.push({ animal: r.animal ?? '', style: r.style ?? '', prenom, date });
    }
  }

  const csv = [
    '﻿animal;style;prenom;date',
    ...rows.map(r => [esc(r.animal), esc(r.style), esc(r.prenom), esc(r.date)].join(';')),
  ].join('\r\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="prenoms-animaux-${date}.csv"`,
    },
  });
}
