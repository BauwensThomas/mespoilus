import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const maxDuration = 30;

const RECAP_EMAIL = 'contact@mespoilus.com';

const BE_TZ = 'Europe/Brussels';

function formatBE(date: Date) {
  return new Intl.DateTimeFormat('fr-BE', { timeZone: BE_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function utcHourToBE(utcHour: number, ref: Date): string {
  const d = new Date(ref);
  d.setUTCHours(utcHour, 0, 0, 0);
  const hour = new Intl.DateTimeFormat('en', { timeZone: BE_TZ, hour: '2-digit', hour12: false }).format(d);
  return `${hour}h`;
}

const STATUS_COLOR: Record<string, string> = {
  success: '#16a34a',
  error:   '#dc2626',
  pending: '#d97706',
};
const STATUS_LABEL: Record<string, string> = {
  success: 'OK',
  error:   'ERR',
  pending: '...',
};

// Crons attendus selon le jour - pattern de detection dans action log

// Crons catalogue : tournent 1×/SEMAINE le LUNDI (vercel.json `* * 1`) pour réduire le CPU Fluid.
// → attendus uniquement le lundi (sinon faux "manquants" 6 jours sur 7).
const CATALOG_CRONS = [
  { label: 'Catalog sync chiens',          pattern: '[Catalog sync:chiens]',          hour: '02h', agent: 'Thomas' },
  { label: 'Catalog sync chats',           pattern: '[Catalog sync:chats]',           hour: '02h', agent: 'Thomas' },
  { label: 'Catalog sync oiseaux',         pattern: '[Catalog sync:oiseaux]',         hour: '02h', agent: 'Thomas' },
  { label: 'Catalog sync rongeurs',        pattern: '[Catalog sync:rongeurs]',        hour: '03h', agent: 'Thomas' },
  { label: 'Catalog sync reptiles',        pattern: '[Catalog sync:reptiles]',        hour: '03h', agent: 'Thomas' },
  { label: 'Catalog sync livres',          pattern: '[Catalog sync:livres]',          hour: '03h', agent: 'Thomas' },
  { label: 'Catalog sync general',         pattern: '[Catalog sync:general]',         hour: '04h', agent: 'Thomas' },
  { label: 'Catalog sync canada-pet-care', pattern: '[Catalog sync:canada-pet-care]', hour: '04h', agent: 'Thomas' },
  { label: 'Catalog sync entirelypets',    pattern: '[Catalog sync:entirelypets]',    hour: '01h', agent: 'Thomas' },
  { label: 'Dedup EAN',                    pattern: '[Dedup EAN]',                    hour: '05h', agent: 'Thomas' },
  { label: 'Dedup image',                  pattern: '[Dedup image]',                  hour: '05h', agent: 'Thomas' },
  { label: 'Traduction pass 1',            pattern: '[Catalog translate]',            hour: '05h', agent: 'Thomas' },
  { label: 'Traduction pass 2',            pattern: '[Catalog translate]',            hour: '06h', agent: 'Thomas' },
  { label: 'Dedup titre',                  pattern: '[Dedup titre]',                  hour: '06h', agent: 'Thomas' },
  { label: 'Classify products',            pattern: '[Classify products]',            hour: '07h', agent: 'Thomas' },
];

// Crons réellement quotidiens
const DAILY_CRONS = [
  { label: 'Adoption cleanup',             pattern: '[Adoption cleanup]',             hour: '03h', agent: 'Thomas' },
  { label: 'Morning retry',                pattern: '[Morning retry]',                hour: '03h', agent: 'Thomas' },
];

// Crons RELANÇABLES en cas d'erreur/absence : uniquement les crons IDEMPOTENTS (upsert/dedup).
// On EXCLUT volontairement blog / social / newsletter / races / finance / securite / prenoms /
// adoption-social : les relancer générerait des doublons d'articles/posts ou serait inutile.
const RETRYABLE_ROUTES: Record<string, string> = {
  'Catalog sync chiens':          '/api/cron/catalog-sync/chiens',
  'Catalog sync chats':           '/api/cron/catalog-sync/chats',
  'Catalog sync oiseaux':         '/api/cron/catalog-sync/oiseaux',
  'Catalog sync rongeurs':        '/api/cron/catalog-sync/rongeurs',
  'Catalog sync reptiles':        '/api/cron/catalog-sync/reptiles',
  'Catalog sync livres':          '/api/cron/catalog-sync/livres',
  'Catalog sync general':         '/api/cron/catalog-sync/general',
  'Catalog sync canada-pet-care': '/api/cron/catalog-sync/canada-pet-care',
  'Dedup EAN':                    '/api/cron/catalog-sync/dedup-ean',
  'Dedup image':                  '/api/cron/catalog-sync/dedup-image',
  'Dedup titre':                  '/api/cron/catalog-sync/dedup-title',
  'Traduction pass 1':            '/api/cron/catalog-sync/translate',
  'Classify products':            '/api/cron/classify-products',
  'Adoption cleanup':             '/api/cron/adoption-cleanup',
};

// Le catalogue tourne le lundi (dow === 1)
const isCatalogDay = (dow: number) => dow === 1;

const WEEKDAY_CRONS: Record<number, Array<{ label: string; pattern: string; hour: string; agent: string }>> = {
  1: [ // Lundi
    { label: 'Blog (Lucas + Marie)', pattern: '[Cron blog]',        hour: '09h', agent: 'Lucas' },
    { label: 'Social (Emma)',        pattern: '[Cron social',        hour: '09h', agent: 'Emma'  },
  ],
  2: [ // Mardi
    { label: 'Adoption social',      pattern: '[Adoption social]',  hour: '19h', agent: 'Thomas' },
  ],
  3: [ // Mercredi
    { label: 'Blog (Lucas + Marie)', pattern: '[Cron blog]',        hour: '09h', agent: 'Lucas' },
    { label: 'Social (Emma)',        pattern: '[Cron social',        hour: '09h', agent: 'Emma'  },
  ],
  5: [ // Vendredi
    { label: 'Blog (Lucas + Marie)', pattern: '[Cron blog]',        hour: '09h', agent: 'Lucas'  },
    { label: 'Social (Emma)',        pattern: '[Cron social',        hour: '09h', agent: 'Emma'   },
    { label: 'Newsletter (Sofia)',   pattern: 'Cron newsletter',     hour: '10h', agent: 'Sofia'  },
  ],
  6: [ // Samedi
    { label: 'Adoption followup',    pattern: '[Adoption followup]', hour: '19h', agent: 'Thomas' },
  ],
  0: [ // Dimanche
    { label: 'Fiches races (Haiku)', pattern: 'Cron races',          hour: '07h', agent: 'Thomas' },
    { label: 'Backup base',          pattern: 'Cron backup',         hour: '03h30', agent: 'Thomas' },
  ],
};

// Comparaison insensible aux accents et à la casse (les logs écrivent "Cron prénoms"/"Cron sécurité"
// alors que les patterns sont sans accent → évite les faux négatifs "manquant")
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const cronMatches = (action: string, pattern: string) => norm(action).includes(norm(pattern));

function getExpectedCrons(now: Date) {
  const dow = now.getUTCDay();
  const dom = now.getUTCDate();
  const expected = [...DAILY_CRONS];
  if (isCatalogDay(dow)) expected.push(...CATALOG_CRONS); // catalogue : 1×/semaine (lundi)
  if (WEEKDAY_CRONS[dow]) expected.push(...WEEKDAY_CRONS[dow]);
  if (dom === 1) {
    expected.push({ label: 'Finance (Antoine)',   pattern: 'Cron finance',   hour: '08h', agent: 'Antoine'  });
    expected.push({ label: 'Securite (Nathalie)', pattern: 'Cron securite',  hour: '08h', agent: 'Nathalie' });
    expected.push({ label: 'Prenoms (Thomas)',    pattern: 'Cron prenoms',   hour: '07h', agent: 'Thomas'   });
  }
  return expected;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('agent_name, action, status, created_at, tokens_used')
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[daily-recap] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = logs ?? [];
  const today = format(now, 'd MMMM yyyy', { locale: fr });
  const successCount = entries.filter(l => l.status === 'success').length;
  const errorCount   = entries.filter(l => l.status === 'error').length;
  const totalTokens  = entries.reduce((sum, l) => sum + (l.tokens_used ?? 0), 0);

  const expectedCrons = getExpectedCrons(now);
  const missingList   = expectedCrons.filter(ec => !entries.some(l => cronMatches(l.action, ec.pattern)));
  const missingCount  = missingList.length;

  // Crons prévus demain
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowCrons = getExpectedCrons(tomorrow);
  const tomorrowLabel = format(tomorrow, 'EEEE d MMMM', { locale: fr });
  const tomorrowRows = tomorrowCrons.map(ec => {
    const beTime = utcHourToBE(parseInt(ec.hour, 10), tomorrow);
    return `
      <tr style="border-bottom:1px solid #f3f4f6">
        <td style="padding:8px 12px;color:#6b7280;font-size:12px;white-space:nowrap">${beTime}</td>
        <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap">${ec.agent}</td>
        <td style="padding:8px 12px;font-size:12px;color:#374151">${ec.label}</td>
      </tr>`;
  }).join('');

  // Entrées non attendues aujourd'hui (pattern ne correspond à aucun cron prévu ce jour)
  const unexpectedEntries = entries.filter(
    l => !expectedCrons.some(ec => cronMatches(l.action, ec.pattern))
  );

  // Tableau "Crons attendus" - tous les crons (trouvés ou non)
  const expectedCronRows = expectedCrons.map(ec => {
    const match = entries.find(l => cronMatches(l.action, ec.pattern));
    const beTime = utcHourToBE(parseInt(ec.hour, 10), now);
    if (match) {
      const d = new Date(match.created_at);
      const actualTimeBE = formatBE(d);
      const color = STATUS_COLOR[match.status] ?? '#6b7280';
      const badge = STATUS_LABEL[match.status] ?? '?';
      const tokens = match.tokens_used
        ? ` <span style="color:#9ca3af;font-size:11px">(${match.tokens_used} tok)</span>` : '';
      return `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:8px 12px;color:#6b7280;font-size:12px;white-space:nowrap">${actualTimeBE} <span style="color:#d1d5db;font-size:10px">(pr&#233;vu ${beTime})</span></td>
          <td style="padding:8px 6px;white-space:nowrap">
            <span style="background:${color}22;color:${color};font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px">&#10003; ${badge}</span>
          </td>
          <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap">${ec.label}</td>
          <td style="padding:8px 12px;font-size:12px;color:#6b7280">${match.action}${tokens}</td>
        </tr>`;
    } else {
      return `
        <tr style="border-bottom:1px solid #f3f4f6;background:#fff9f9">
          <td style="padding:8px 12px;color:#9ca3af;font-size:12px;white-space:nowrap">${beTime} <span style="color:#d1d5db;font-size:10px">(pr&#233;vu)</span></td>
          <td style="padding:8px 6px;white-space:nowrap">
            <span style="background:#dc262622;color:#dc2626;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px">&#10007; -</span>
          </td>
          <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap">${ec.label}</td>
          <td style="padding:8px 12px;font-size:12px;color:#9ca3af">Non détecté dans les logs - Cron Vercel non déclenché ou bloqué (anti-doublon, quota...)</td>
        </tr>`;
    }
  }).join('');

  // Lignes crons non attendus ce jour
  const unexpectedRows = unexpectedEntries.map(l => {
    const d = new Date(l.created_at);
    const timeUTC = format(d, 'HH:mm');
    const timeBE  = formatBE(d);
    const color = STATUS_COLOR[l.status] ?? '#6b7280';
    const badge = STATUS_LABEL[l.status] ?? '?';
    const tokens = l.tokens_used ? `<span style="color:#9ca3af;font-size:11px"> (${l.tokens_used} tok)</span>` : '';
    return `
      <tr style="border-bottom:1px solid #f3f4f6">
        <td style="padding:8px 12px;color:#6b7280;font-size:12px;white-space:nowrap">
          ${timeBE} <span style="color:#d1d5db;font-size:10px">(${timeUTC} UTC)</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap">${l.agent_name}</td>
        <td style="padding:8px 4px;white-space:nowrap">
          <span style="background:${color}22;color:${color};font-size:11px;font-weight:700;padding:2px 6px;border-radius:99px">${badge}</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;color:#374151">${l.action}${tokens}</td>
      </tr>`;
  }).join('');

  // Tableau activités détaillées (chronologique)
  const allActivityRows = entries.map(l => {
    const d = new Date(l.created_at);
    const timeUTC = format(d, 'HH:mm');
    const timeBE  = formatBE(d);
    const color = STATUS_COLOR[l.status] ?? '#6b7280';
    const badge = STATUS_LABEL[l.status] ?? '?';
    const tokens = l.tokens_used ? `<span style="color:#9ca3af;font-size:11px"> (${l.tokens_used} tok)</span>` : '';
    return `
      <tr style="border-bottom:1px solid #f3f4f6">
        <td style="padding:8px 12px;color:#6b7280;font-size:12px;white-space:nowrap">
          ${timeBE} <span style="color:#d1d5db;font-size:10px">(${timeUTC} UTC)</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap">${l.agent_name}</td>
        <td style="padding:8px 4px;white-space:nowrap">
          <span style="background:${color}22;color:${color};font-size:11px;font-weight:700;padding:2px 6px;border-radius:99px">${badge}</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;color:#374151">${l.action}${tokens}</td>
      </tr>`;
  }).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#111827;background:#f9fafb;padding:24px">
      <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

        <div style="background-color:#ea580c;padding:20px 24px">
          <p style="color:#ffffff;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px">Récap quotidien</p>
          <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0">Mes Poilus - ${today}</h1>
        </div>

        <table style="width:100%;border-collapse:collapse;border-bottom:2px solid #f3f4f6">
          <tr>
            <td style="padding:16px 12px;text-align:center;border-right:1px solid #f3f4f6">
              <p style="font-size:22px;font-weight:700;color:#111827;margin:0">${entries.length}</p>
              <p style="font-size:11px;color:#6b7280;margin:4px 0 0">activit&#233;s</p>
            </td>
            <td style="padding:16px 12px;text-align:center;border-right:1px solid #f3f4f6">
              <p style="font-size:22px;font-weight:700;color:#16a34a;margin:0">${successCount}</p>
              <p style="font-size:11px;color:#6b7280;margin:4px 0 0">succ&#232;s</p>
            </td>
            <td style="padding:16px 12px;text-align:center;border-right:1px solid #f3f4f6">
              <p style="font-size:22px;font-weight:700;color:${errorCount > 0 ? '#dc2626' : '#9ca3af'};margin:0">${errorCount}</p>
              <p style="font-size:11px;color:#6b7280;margin:4px 0 0">erreurs</p>
            </td>
            <td style="padding:16px 12px;text-align:center;border-right:1px solid #f3f4f6">
              <p style="font-size:22px;font-weight:700;color:${missingCount > 0 ? '#dc2626' : '#9ca3af'};margin:0">${missingCount}</p>
              <p style="font-size:11px;color:#6b7280;margin:4px 0 0">manquants</p>
            </td>
            <td style="padding:16px 12px;text-align:center">
              <p style="font-size:22px;font-weight:700;color:#f97316;margin:0">${totalTokens > 0 ? totalTokens.toLocaleString('fr') : '0'}</p>
              <p style="font-size:11px;color:#6b7280;margin:4px 0 0">tokens</p>
            </td>
          </tr>
        </table>

        <div style="padding:14px 24px 6px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
          <p style="font-size:12px;font-weight:700;color:#374151;margin:0;text-transform:uppercase;letter-spacing:.05em">Crons automatiques Vercel - aujourd'hui (${expectedCrons.length})</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Heure BE</th>
              <th style="padding:8px 6px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Statut</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Cron</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">D&#233;tail</th>
            </tr>
          </thead>
          <tbody>${expectedCronRows}</tbody>
        </table>

        ${unexpectedEntries.length > 0 ? `
        <div style="padding:14px 24px 6px;background:#fffbeb;border-top:2px solid #e5e7eb;border-bottom:1px solid #fde68a;margin-top:4px">
          <p style="font-size:12px;font-weight:700;color:#92400e;margin:0;text-transform:uppercase;letter-spacing:.05em">Crons non pr&#233;vus ce jour (${unexpectedEntries.length})</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#fffbeb">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Heure</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Agent</th>
              <th style="padding:8px 4px"></th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Action</th>
            </tr>
          </thead>
          <tbody>${unexpectedRows}</tbody>
        </table>` : ''}

        <div style="padding:14px 24px 6px;background:#f9fafb;border-top:2px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin-top:4px">
          <p style="font-size:12px;font-weight:700;color:#374151;margin:0;text-transform:uppercase;letter-spacing:.05em">Toutes les activit&#233;s (${entries.length})</p>
        </div>
        ${entries.length === 0
          ? `<p style="padding:24px;color:#6b7280;text-align:center">Aucune activit&#233; enregistr&#233;e aujourd'hui.</p>`
          : `<table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f9fafb">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Heure</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Agent</th>
                  <th style="padding:8px 4px"></th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Action</th>
                </tr>
              </thead>
              <tbody>${allActivityRows}</tbody>
            </table>`
        }

        <div style="padding:14px 24px 6px;background:#f0f9ff;border-top:2px solid #e5e7eb;border-bottom:1px solid #bae6fd;margin-top:4px">
          <p style="font-size:12px;font-weight:700;color:#0369a1;margin:0;text-transform:uppercase;letter-spacing:.05em">Crons automatiques Vercel - demain ${tomorrowLabel} (${tomorrowCrons.length})</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f0f9ff">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:80px">Heure BE</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:100px">Agent</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Cron</th>
            </tr>
          </thead>
          <tbody>${tomorrowRows}</tbody>
        </table>

        <div style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="font-size:11px;color:#9ca3af;margin:0">Mes Poilus - Récap automatique envoyé chaque soir à 22h heure belge (20h UTC)</p>
        </div>
      </div>
    </div>`;

  const subjectMissing = missingCount > 0 ? ` - ${missingCount} manquant${missingCount > 1 ? 's' : ''}` : '';
  const subjectErrors  = errorCount  > 0 ? ` - ${errorCount} erreur${errorCount > 1 ? 's' : ''}` : '';

  try {
    await sendEmail({
      to: RECAP_EMAIL,
      subject: `[Mes Poilus] Recap ${today}${subjectErrors}${subjectMissing}`,
      html,
    });
    console.log(`[daily-recap] email envoye pour ${today}`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[daily-recap] erreur envoi email:', errMsg);
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: `[Récap quotidien] ECHEC envoi email - ${errMsg}`,
      details: { error: errMsg },
      status: 'error',
    });
    return NextResponse.json({ error: 'Email failed', detail: errMsg }, { status: 500 });
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Récap quotidien] Email envoye - ${entries.length} entrees, ${missingCount} manquant${missingCount > 1 ? 's' : ''}`,
    details: { total: entries.length, success: successCount, errors: errorCount, missing: missingList.map(m => m.label), tokens: totalTokens },
    status: 'success',
  });

  // ─── Relance auto des crons idempotents en erreur ou manquants ────────────
  // 2e chance le soir même aux crons attendus aujourd'hui qui ont échoué ou n'ont
  // pas tourné (sync/dedup/traduction/classify/adoption-cleanup). Chaque relance
  // tourne dans sa propre invocation Vercel ; on n'attend pas sa fin.
  const retryRoutes = [...new Set(
    expectedCrons
      .filter(ec => {
        const match = entries.find(l => cronMatches(l.action, ec.pattern));
        const failed = !match || match.status === 'error';
        return failed && RETRYABLE_ROUTES[ec.label];
      })
      .map(ec => RETRYABLE_ROUTES[ec.label])
  )];

  if (retryRoutes.length > 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http://localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    if (appUrl) {
      const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
      // Fire-and-forget : pas d'AbortSignal, les crons longs (300s) continuent après la réponse
      for (const route of retryRoutes) {
        fetch(`${appUrl}${route}`, { headers }).catch(() => {});
      }
      await supabase.from('activity_logs').insert({
        agent_id: 'thomas', agent_name: 'Thomas',
        action: `[Récap quotidien] Relance auto de ${retryRoutes.length} cron(s) en erreur/manquant`,
        details: { retried: retryRoutes },
        status: 'success',
      });
      console.log('[daily-recap] relance auto:', retryRoutes.join(', '));
    }
  }

  return NextResponse.json({ ok: true, total: entries.length, missing: missingList.map(m => m.label), retried: retryRoutes });
}
