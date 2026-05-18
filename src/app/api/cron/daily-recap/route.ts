import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const maxDuration = 30;

const RECAP_EMAIL = 'contact@mespoilus.com';

const STATUS_COLOR: Record<string, string> = {
  success: '#16a34a',
  error:   '#dc2626',
  pending: '#d97706',
};
const STATUS_LABEL: Record<string, string> = {
  success: '✓',
  error:   '✗',
  pending: '...',
};

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('agent_name, action, status, created_at, tokens_used, duration_ms')
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[daily-recap] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = logs ?? [];
  const today = format(new Date(), 'd MMMM yyyy', { locale: fr });
  const successCount = entries.filter(l => l.status === 'success').length;
  const errorCount   = entries.filter(l => l.status === 'error').length;
  const totalTokens  = entries.reduce((sum, l) => sum + (l.tokens_used ?? 0), 0);

  const rows = entries.map(l => {
    const time = format(new Date(l.created_at), 'HH:mm');
    const color = STATUS_COLOR[l.status] ?? '#6b7280';
    const badge = STATUS_LABEL[l.status] ?? '?';
    const tokens = l.tokens_used ? `<span style="color:#9ca3af;font-size:11px"> — ${l.tokens_used} tok</span>` : '';
    return `
      <tr style="border-bottom:1px solid #f3f4f6">
        <td style="padding:8px 12px;color:#6b7280;font-size:12px;white-space:nowrap">${time}</td>
        <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap">${l.agent_name}</td>
        <td style="padding:8px 4px">
          <span style="background:${color}22;color:${color};font-size:11px;font-weight:700;padding:2px 6px;border-radius:99px">${badge}</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;color:#374151">${l.action}${tokens}</td>
      </tr>`;
  }).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:680px;margin:0 auto;color:#111;background:#f9fafb;padding:24px">
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#ea580c,#111827);padding:20px 24px">
          <p style="color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px">Recap quotidien</p>
          <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Mes Poilus — ${today}</h1>
        </div>

        <!-- Stats -->
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
          <div style="flex:1;padding:16px 20px;text-align:center">
            <p style="font-size:24px;font-weight:700;color:#f97316;margin:0">${totalTokens > 0 ? totalTokens.toLocaleString('fr') : '0'}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0">tokens</p>
          </div>
        </div>

        <!-- Logs table -->
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

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="font-size:11px;color:#9ca3af;margin:0">Mes Poilus — recap automatique envoye chaque soir a 20h UTC</p>
        </div>
      </div>
    </div>`;

  try {
    await sendEmail({
      to: RECAP_EMAIL,
      subject: `[Mes Poilus] Recap du ${today} — ${successCount} succes${errorCount > 0 ? `, ${errorCount} erreur${errorCount > 1 ? 's' : ''}` : ''}`,
      html,
    });
    console.log(`[daily-recap] email envoye pour ${today} (${entries.length} entrees)`);
  } catch (err) {
    console.error('[daily-recap] erreur envoi email:', err);
    return NextResponse.json({ error: 'Email failed' }, { status: 500 });
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Recap quotidien] Email envoye — ${entries.length} entrees du jour (${successCount} succes, ${errorCount} erreurs)`,
    details: { total: entries.length, success: successCount, errors: errorCount, tokens: totalTokens },
    status: 'success',
  });

  return NextResponse.json({ ok: true, sent: true, total: entries.length });
}
