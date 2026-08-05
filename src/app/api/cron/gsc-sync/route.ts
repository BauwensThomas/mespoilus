import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAllPageQueryRows, classifyPageType, toPagePath } from '@/lib/gsc';

export const maxDuration = 300;

const GSC_LAG_DAYS = 3; // délai de traitement GSC avant qu'une journée soit fiable

function fmt(d: Date) {
  return d.toISOString().split('T')[0];
}

/** Dernier lundi-dimanche complet, avec une marge de GSC_LAG_DAYS avant "maintenant". */
function lastCompleteWeek(now: Date): { weekStart: Date; weekEnd: Date } {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  while (!(d.getUTCDay() === 0 && now.getTime() - d.getTime() >= GSC_LAG_DAYS * 86_400_000)) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  const weekEnd = new Date(d);
  const weekStart = new Date(d);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  return { weekStart, weekEnd };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const isBackfill = url.searchParams.get('backfill') === 'true';
  const weeks = Math.min(parseInt(url.searchParams.get('weeks') ?? '1', 10) || 1, isBackfill ? 70 : 1);

  const supabase = createAdminClient();
  const now = new Date();
  const { weekEnd: latestWeekEnd } = lastCompleteWeek(now);

  let weeksProcessed = 0;
  let rowsUpserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < weeks; i++) {
    const weekEnd = new Date(latestWeekEnd);
    weekEnd.setUTCDate(weekEnd.getUTCDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    try {
      const rows = await fetchAllPageQueryRows(fmt(weekStart), fmt(weekEnd));
      if (rows.length === 0) continue;

      const payload = rows.map(r => ({
        week_start: fmt(weekStart),
        page: toPagePath(r.page),
        query: r.query,
        page_type: classifyPageType(r.page),
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));

      // Upsert par lots de 1000 (limite pratique payload Supabase)
      for (let j = 0; j < payload.length; j += 1000) {
        const chunk = payload.slice(j, j + 1000);
        const { error } = await supabase
          .from('gsc_weekly_stats')
          .upsert(chunk, { onConflict: 'week_start,page,query' });
        if (error) throw error;
      }

      rowsUpserted += payload.length;
      weeksProcessed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[gsc-sync] semaine ${fmt(weekStart)} :`, msg);
      errors.push(`${fmt(weekStart)}: ${msg}`);
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'lucas', agent_name: 'Lucas',
    action: isBackfill
      ? `[GSC sync] Backfill : ${weeksProcessed}/${weeks} semaine(s), ${rowsUpserted} lignes`
      : `[GSC sync] Semaine du ${fmt(latestWeekEnd)} : ${rowsUpserted} lignes`,
    details: { weeksProcessed, rowsUpserted, errors },
    status: errors.length > 0 ? 'error' : 'success',
  });

  return NextResponse.json({ success: errors.length === 0, weeksProcessed, rowsUpserted, errors });
}
