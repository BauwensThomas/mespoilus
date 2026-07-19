import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// scheduledDays : jours de la semaine UTC où le cron est programmé (0=dim, 1=lun, …, 6=sam).
// undefined = tous les jours. Le morning-retry ne relance que si hier était un jour schedulé.
const RETRYABLE: Array<{ label: string; pattern: string; route: string; scheduledDays?: number[] }> = [
  { label: 'Catalog sync chiens',          pattern: '[Catalog sync:chiens]',          route: '/api/cron/catalog-sync/chiens',       scheduledDays: [1] },
  { label: 'Catalog sync chats',           pattern: '[Catalog sync:chats]',           route: '/api/cron/catalog-sync/chats',        scheduledDays: [1] },
  { label: 'Catalog sync oiseaux',         pattern: '[Catalog sync:oiseaux]',         route: '/api/cron/catalog-sync/oiseaux',      scheduledDays: [1] },
  { label: 'Catalog sync rongeurs',        pattern: '[Catalog sync:rongeurs]',        route: '/api/cron/catalog-sync/rongeurs',     scheduledDays: [1] },
  { label: 'Catalog sync reptiles',        pattern: '[Catalog sync:reptiles]',        route: '/api/cron/catalog-sync/reptiles',     scheduledDays: [1] },
  { label: 'Catalog sync livres',          pattern: '[Catalog sync:livres]',          route: '/api/cron/catalog-sync/livres',       scheduledDays: [1] },
  { label: 'Catalog sync general',         pattern: '[Catalog sync:general]',         route: '/api/cron/catalog-sync/general',      scheduledDays: [1] },
  { label: 'Catalog sync canada-pet-care', pattern: '[Catalog sync:canada-pet-care]', route: '/api/cron/catalog-sync/canada-pet-care', scheduledDays: [1] },
  { label: 'Dedup EAN',                    pattern: '[Dedup EAN]',                    route: '/api/cron/catalog-sync/dedup-ean',    scheduledDays: [1] },
  { label: 'Dedup image',                  pattern: '[Dedup image]',                  route: '/api/cron/catalog-sync/dedup-image',  scheduledDays: [1] },
  { label: 'Dedup titre',                  pattern: '[Dedup titre]',                  route: '/api/cron/catalog-sync/dedup-title',  scheduledDays: [1] },
  { label: 'Traduction',                   pattern: '[Catalog translate]',            route: '/api/cron/catalog-sync/translate',    scheduledDays: [1] },
  { label: 'Classify products',            pattern: '[Classify products]',            route: '/api/cron/classify-products',         scheduledDays: [1] },
  { label: 'Adoption cleanup',             pattern: '[Adoption cleanup]',             route: '/api/cron/adoption-cleanup' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Retourne le début (00:00 UTC) du dernier jour schedulé avant aujourd'hui
function lastScheduledStart(scheduledDays: number[], todayStart: Date): Date {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(todayStart);
    d.setUTCDate(todayStart.getUTCDate() - i);
    if (scheduledDays.includes(d.getUTCDay())) return d;
  }
  return new Date(todayStart); // fallback (ne devrait pas arriver)
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // Pour les crons quotidiens : fenêtre = hier uniquement
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(todayStart.getUTCDate() - 1);

  // Pour les crons schedulés (ex : lundi) : on peut remonter jusqu'à 8 jours
  const windowStart = new Date(todayStart);
  windowStart.setUTCDate(todayStart.getUTCDate() - 8);

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('action, status, created_at')
    .gte('created_at', windowStart.toISOString());

  const entries = logs ?? [];

  // Identifier les crons à relancer :
  // - crons quotidiens : absent ou en erreur hier
  // - crons schedulés : aucun succès depuis le dernier jour schedulé
  const toRetry = RETRYABLE.filter(c => {
    const since = c.scheduledDays ? lastScheduledStart(c.scheduledDays, todayStart) : yesterdayStart;
    const relevant = entries.filter(l =>
      norm(l.action).includes(norm(c.pattern)) && new Date(l.created_at) >= since
    );
    // S'il y a eu au moins un succès depuis le dernier jour schedulé → pas de retry
    return !relevant.some(l => l.status === 'success');
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
