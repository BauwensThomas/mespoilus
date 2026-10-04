import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runDbBackup, pruneOldBackups } from '@/lib/db-backup';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, errorBlock } from '@/lib/cron-email';

export const runtime = 'nodejs';
export const maxDuration = 300;

const ALERT_EMAIL = 'contact@mespoilus.com';

/**
 * Sauvegarde hebdomadaire des données (plan Supabase Free = pas de PITR).
 * Exporte toutes les tables public en JSON gzippé dans le bucket privé db-backups,
 * conserve les 4 dernières. Email uniquement en cas d'échec.
 * Restauration : scripts/restore-backup.mjs (voir MD/INCIDENT.md).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const start = Date.now();

  try {
    const manifest = await runDbBackup(supabase);
    const pruned = await pruneOldBackups(supabase);
    const durationMs = Date.now() - start;
    const sizeMb = (manifest.total_bytes / 1024 / 1024).toFixed(1);

    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: `Cron backup : ${manifest.tables.length} tables, ${manifest.total_rows} lignes (${sizeMb} MB)`,
      status: 'success', duration_ms: durationMs,
      details: { folder: manifest.folder, pruned },
    });

    return NextResponse.json({ ok: true, folder: manifest.folder, tables: manifest.tables.length, rows: manifest.total_rows, sizeMb, pruned, durationMs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[db-backup] erreur:', msg);

    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: `Cron backup erreur: ${msg}`.slice(0, 500),
      status: 'error', duration_ms: Date.now() - start,
    });

    try {
      await sendEmail({
        to: ALERT_EMAIL,
        subject: '[Mes Poilus] Echec de la sauvegarde hebdomadaire',
        html: cronEmailWrapper(
          'Echec de la sauvegarde de la base',
          'Backup hebdomadaire',
          `<p style="font-size:14px;color:#374151">La sauvegarde de cette semaine n'a pas abouti. Les sauvegardes précédentes sont conservées. Relancer manuellement depuis le Dashboard ou via /api/cron/db-backup.</p>${errorBlock([msg])}`,
        ),
      });
    } catch { /* non-bloquant */ }

    return NextResponse.json({ error: 'Echec de la sauvegarde' }, { status: 500 });
  }
}
