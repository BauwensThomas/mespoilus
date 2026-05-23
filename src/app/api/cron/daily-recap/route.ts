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
const DAILY_CRONS = [
  { label: 'Catalog sync chiens',          pattern: '[Catalog sync:chiens]',          hour: '02h' },
  { label: 'Catalog sync chats',           pattern: '[Catalog sync:chats]',           hour: '02h' },
  { label: 'Catalog sync oiseaux',         pattern: '[Catalog sync:oiseaux]',         hour: '02h' },
  { label: 'Catalog sync rongeurs',        pattern: '[Catalog sync:rongeurs]',        hour: '03h' },
  { label: 'Catalog sync reptiles',        pattern: '[Catalog sync:reptiles]',        hour: '03h' },
  { label: 'Catalog sync livres',          pattern: '[Catalog sync:livres]',          hour: '03h' },
  { label: 'Catalog sync general',         pattern: '[Catalog sync:general]',         hour: '04h' },
  { label: 'Catalog sync canada-pet-care', pattern: '[Catalog sync:canada-pet-care]', hour: '05h' },
  { label: 'Adoption cleanup',             pattern: '[Adoption cleanup]',             hour: '03h' },
];

const WEEKDAY_CRONS: Record<number, Array<{ label: string; pattern: string; hour: string }>> = {
  1: [ // Lundi
    { label: 'Blog (Lucas + Marie)', pattern: '[Cron blog]',     hour: '09h' },
    { label: 'Social (Emma)',        pattern: '[Cron social',     hour: '09h' },
  ],
  2: [ // Mardi
    { label: 'Adoption social',      pattern: '[Adoption social]', hour: '19h' },
  ],
  3: [ // Mercredi
    { label: 'Blog (Lucas + Marie)', pattern: '[Cron blog]',     hour: '09h' },
    { label: 'Social (Emma)',        pattern: '[Cron social',     hour: '09h' },
  ],
  5: [ // Vendredi
    { label: 'Blog (Lucas + Marie)', pattern: '[Cron blog]',     hour: '09h' },
    { label: 'Social (Emma)',        pattern: '[Cron social',     hour: '09h' },
    { label: 'Newsletter (Sofia)',   pattern: 'Cron newsletter',  hour: '10h' },
  ],
  6: [ // Samedi
    { label: 'Adoption followup',    pattern: '[Adoption followup]', hour: '19h' },
  ],
  0: [ // Dimanche
    { label: 'Fiches races (Haiku)', pattern: 'Cron races',      hour: '07h' },
  ],
};

function getExpectedCrons(now: Date) {
  const dow = now.getUTCDay();
  const dom = now.getUTCDate();
  const expected = [...DAILY_CRONS];
  if (WEEKDAY_CRONS[dow]) expected.push(...WEEKDAY_CRONS[dow]);
  if (dom === 1) {
    expected.push({ label: 'Finance (Antoine)',    pattern: 'Cron finance',    hour: '08h' });
    expected.push({ label: 'Securite (Nathalie)',  pattern: 'Cron securite',   hour: '08h' });
    expected.push({ label: 'Prenoms (Thomas)',     pattern: 'Cron prenoms',    hour: '07h' });
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

  // Crons attendus vs presents
  const expectedCrons = getExpectedCrons(now);
  const missing = expectedCrons.filter(
    ec => !entries.some(l => l.action.includes(ec.pattern))
  );

  // Lignes du tableau de logs
  const rows = entries.map(l => {
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
        <td style="padding:8px 4px">
          <span style="background:${color}22;color:${color};font-size:11px;font-weight:700;padding:2px 6px;border-radius:99px">${badge}</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;color:#374151">${l.action}${tokens}</td>
      </tr>`;
  }).join('');

  // Section crons manquants
  const missingSection = missing.length === 0 ? '' : `
    <div style="margin:0;padding:16px 24px;background:#fef2f2;border-top:1px solid #fecaca">
      <p style="font-size:12px;font-weight:700;color:#dc2626;margin:0 0 8px">Crons attendus non detectes (${missing.length})</p>
      ${missing.map(m => `
        <p style="margin:4px 0;font-size:12px;color:#374151">
          <span style="color:#dc2626;font-weight:700;margin-right:8px">!</span>
          <span style="font-weight:600;margin-right:8px">${m.label}</span>
          <span style="color:#9ca3af">prevu vers ${utcHourToBE(parseInt(m.hour), now)} heure belge (${m.hour} UTC)</span>
        </p>`).join('')}
    </div>`;

  const html = `
    <div style="font-family:sans-serif;max-width:680px;margin:0 auto;color:#111;background:#f9fafb;padding:24px">
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

        <div style="background:linear-gradient(135deg,#ea580c,#111827);padding:20px 24px">
          <p style="color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px">Recap quotidien</p>
          <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Mes Poilus - ${today}</h1>
        </div>

        <div style="display:flex;gap:0;border-bottom:1px solid #f3f4f6">
          <div style="flex:1;padding:16px 20px;text-align:center;border-right:1px solid #f3f4f6">
            <p style="font-size:24px;font-weight:700;color:#111827;margin:0">${entries.length}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0">crons executes</p>
          </div>
          <div style="flex:1;padding:16px 20px;text-align:center;border-right:1px solid #f3f4f6">
            <p style="font-size:24px;font-weight:700;color:#16a34a;margin:0">${successCount}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0">succes</p>
          </div>
          <div style="flex:1;padding:16px 20px;text-align:center;border-right:1px solid #f3f4f6">
            <p style="font-size:24px;font-weight:700;color:${errorCount > 0 ? '#dc2626' : '#9ca3af'};margin:0">${errorCount}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0">erreurs</p>
          </div>
          <div style="flex:1;padding:16px 20px;text-align:center;border-right:1px solid #f3f4f6">
            <p style="font-size:24px;font-weight:700;color:${missing.length > 0 ? '#dc2626' : '#9ca3af'};margin:0">${missing.length}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0">manquants</p>
          </div>
          <div style="flex:1;padding:16px 20px;text-align:center">
            <p style="font-size:24px;font-weight:700;color:#f97316;margin:0">${totalTokens > 0 ? totalTokens.toLocaleString('fr') : '0'}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0">tokens</p>
          </div>
        </div>

        ${missingSection}

        ${entries.length === 0
          ? `<p style="padding:24px;color:#6b7280;text-align:center">Aucune activite enregistree aujourd'hui.</p>`
          : `<table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f9fafb">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Heure</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Agent</th>
                  <th style="padding:8px 4px"></th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Action</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`
        }

        <div style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="font-size:11px;color:#9ca3af;margin:0">Mes Poilus - recap automatique envoye chaque soir à 22h heure belge (20h UTC)</p>
        </div>
      </div>
    </div>`;

  const subjectMissing = missing.length > 0 ? ` - ${missing.length} manquant${missing.length > 1 ? 's' : ''}` : '';
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
      action: `[Recap quotidien] ECHEC envoi email - ${errMsg}`,
      details: { error: errMsg },
      status: 'error',
    });
    return NextResponse.json({ error: 'Email failed', detail: errMsg }, { status: 500 });
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Recap quotidien] Email envoye - ${entries.length} entrees, ${missing.length} manquant${missing.length > 1 ? 's' : ''}`,
    details: { total: entries.length, success: successCount, errors: errorCount, missing: missing.map(m => m.label), tokens: totalTokens },
    status: 'success',
  });

  return NextResponse.json({ ok: true, total: entries.length, missing: missing.map(m => m.label) });
}
