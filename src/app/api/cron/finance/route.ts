import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEnrichedPrompt } from '@/lib/agents/context';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, mdToHtml, sectionBlock } from '@/lib/cron-email';

export const runtime = 'nodejs';
export const maxDuration = 120;

async function logActivity(
  agentId: string, agentName: string, action: string,
  status: 'success' | 'error', durationMs: number,
  details: Record<string, unknown> = {},
  tokensUsed = 0
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('activity_logs').insert({ agent_id: agentId, agent_name: agentName, action, status, duration_ms: durationMs, details, tokens_used: tokensUsed });
  } catch { /* non-bloquant */ }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const supabase = createAdminClient();
  const now = new Date();
  const month = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Éviter les doublons : vérifier si un rapport existe déjà ce mois-ci
  const { data: existing } = await supabase
    .from('financial_reports')
    .select('id')
    .eq('period', month)
    .limit(1)
    .maybeSingle();

  if (existing) {
    console.log(`[Cron Finance] Rapport ${month} déjà existant, abandon.`);
    return NextResponse.json({ success: false, reason: 'already_done', period: month });
  }

  try {
    const prompt = await buildEnrichedPrompt(
      'antoine',
      `Génère le rapport financier mensuel complet pour ${month}. Analyse les revenus par source, les dépenses opérationnelles, les marges, et donne 3 recommandations prioritaires pour améliorer la rentabilité.`,
      supabase
    );

    const result = await executeAgentTask('antoine', prompt);
    if (!result.success) throw new Error(result.error ?? 'Antoine a échoué');

    const duration = Date.now() - globalStart;
    await logActivity('thomas', 'Thomas', `Cron finance : rapport ${month} généré`, 'success', duration, { period: month }, result.tokens_used ?? 0);

    try {
      const body = sectionBlock('Rapport Antoine', mdToHtml(result.content), '#0d9488', '#f0fdfa');
      await sendEmail({
        to: 'contact@mespoilus.com',
        subject: `[Mes Poilus] Rapport financier — ${month}`,
        html: cronEmailWrapper(`Rapport financier — ${month}`, 'Finance Antoine', body),
      });
      console.log('[Cron Finance] Email rapport envoye');
    } catch (emailErr) {
      console.error('[Cron Finance] Email erreur:', emailErr instanceof Error ? emailErr.message : emailErr);
    }

    console.log(`[Cron Finance] Terminé en ${duration}ms`);
    return NextResponse.json({ success: true, duration_ms: duration, period: month });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    await logActivity('thomas', 'Thomas', `Cron finance erreur: ${msg}`, 'error', Date.now() - globalStart);
    try {
      const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      await sendEmail({
        to: 'contact@mespoilus.com',
        subject: `[Mes Poilus] Rapport financier ECHEC — ${month}`,
        html: cronEmailWrapper(`Echec finance — ${date}`, 'Finance Antoine',
          `<div style="padding:16px;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:13px">Antoine n'a pas pu generer le rapport : ${msg}</div>`),
      });
    } catch { /* non-bloquant */ }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
