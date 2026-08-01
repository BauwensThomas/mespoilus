import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = createAdminClient();

  const { data: scans, error } = await admin
    .from('qr_scans')
    .select('id, scanned_at, user_agent, city, country, region, language, campaign')
    .order('scanned_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = scans ?? [];
  const now = Date.now();
  const last30Days = rows.filter(r => now - new Date(r.scanned_at).getTime() <= 30 * 24 * 60 * 60 * 1000);

  const countBy = (key: 'city' | 'country') => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const value = r[key] || 'Inconnu';
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  };

  return NextResponse.json({
    total: rows.length,
    last30Days: last30Days.length,
    byCity: countBy('city'),
    byCountry: countBy('country'),
    recent: rows.slice(0, 100),
  });
}
