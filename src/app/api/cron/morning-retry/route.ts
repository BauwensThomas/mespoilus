import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Même liste que daily-recap — crons idempotents relançables sans risque
const RETRYABLE: Array<{ label: string; pattern: string; route: string }> = [
  { label: 'Catalog sync chiens',          pattern: '[Catalog sync:chiens]',          route: '/api/cron/catalog-sync/chiens' },
  { label: 'Catalog sync chats',           pattern: '[Catalog sync:chats]',           route: '/api/cron/catalog-sync/chats' },
  { label: 'Catalog sync oiseaux',         pattern: '[Catalog sync:oiseaux]',         route: '/api/cron/catalog-sync/oiseaux' },
  { label: 'Catalog sync rongeurs',        pattern: '[Catalog sync:rongeurs]',        route: '/api/cron/catalog-sync/rongeurs' },
  { label: 'Catalog sync reptiles',        pattern: '[Catalog sync:reptiles]',        route: '/api/cron/catalog-sync/reptiles' },
  { label: 'Catalog sync livres',          pattern: '[Catalog sync:livres]',          route: '/api/cron/catalog-sync/livres' },
  { label: 'Catalog sync general',         pattern: '[Catalog sync:general]',         route: '/api/cron/catalog-sync/general' },
  { label: 'Catalog sync canada-pet-care', pattern: '[Catalog sync:canada-pet-care]', route: '/api/cron/catalog-sync/canada-pet-care' },
  { label: 'Dedup EAN',                    pattern: '[Dedup EAN]',                    route: '/api/cron/catalog-sync/dedup-ean' },
  { label: 'Dedup image',                  pattern: '[Dedup image]',                  route: '/api/cron/catalog-sync/dedup-image' },
  { label: 'Dedup titre',                  pattern: '[Dedup titre]',                  route: '/api/cron/catalog-sync/dedup-title' },
  { label: 'Traduction',                   pattern: '[Catalog translate]',            route: '/api/cron/catalog-sync/translate' },
  { label: 'Classify products',            pattern: '[Classify products]',            route: '/api/cron/classify-products' },
  { label: 'Adoption cleanup',             pattern: '[Adoption cleanup]',             route: '/api/cron/adoption-cleanup' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Lire les logs d'hier (UTC)
  const now = new Date();
  const yesterdayStart = new Date(now);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
  yesterdayStart.setUTCHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setUTCHours(23, 59, 59, 999);

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('action, status')
    .gte('created_at', yesterdayStart.toISOString())
    .lte('created_at', yesterdayEnd.toISOString());

  const entries = logs ?? [];

  // Identifier les crons en erreur ou absents hier
  const toRetry = RETRYABLE.filter(c => {
    const match = entries.find(l => norm(l.action).includes(norm(c.pattern)));
    return !match || match.status === 'error';
  });

  if (toRetry.length === 0) {
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: '[Morning retry] Aucun cron à relancer - tout OK hier',
      details: {},
      status: 'success',
    });
    return NextResponse.json({ retried: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http://localhost')
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

  if (!appUrl) {
    return NextResponse.json({ error: 'APP_URL manquant' }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
  const routes = [...new Set(toRetry.map(c => c.route))];

  // Fire-and-forget : on déclenche sans attendre la fin (les crons durent jusqu'à 300s)
  for (const route of routes) {
    fetch(`${appUrl}${route}`, { headers }).catch(() => {});
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Morning retry] ${routes.length} cron(s) relancé(s) : ${toRetry.map(c => c.label).join(', ')}`,
    details: { routes, yesterday: yesterdayStart.toISOString().slice(0, 10) },
    status: 'success',
  });

  return NextResponse.json({ retried: routes.length, routes });
}
