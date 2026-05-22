import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 30;

function esc(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val).replace(/\r?\n/g, ' ').trim();
  return s.includes(';') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'dedup';

  const supabase = createAdminClient();

  const patterns: Record<string, string> = {
    dedup:       '%dedup%',
    compression: '%compress%',
  };

  const pattern = patterns[type] ?? '%dedup%';

  const { data, error } = await supabase
    .from('activity_logs')
    .select('agent_name, action, status, created_at, details')
    .ilike('action', pattern)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const csv = [
    '﻿agent;action;statut;date;details',
    ...rows.map(r => [
      esc(r.agent_name),
      esc(r.action),
      esc(r.status),
      esc(r.created_at?.slice(0, 16).replace('T', ' ')),
      esc(r.details ? JSON.stringify(r.details) : ''),
    ].join(';')),
  ].join('\r\n');

  const date = new Date().toISOString().slice(0, 10);
  const label = type === 'compression' ? 'compression-images' : 'fusion-doublons';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${label}-${date}.csv"`,
    },
  });
}
