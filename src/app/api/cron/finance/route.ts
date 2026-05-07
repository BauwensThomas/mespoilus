import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEnrichedPrompt } from '@/lib/agents/context';

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

    console.log(`[Cron Finance] Terminé en ${duration}ms`);
    return NextResponse.json({ success: true, duration_ms: duration, period: month });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    await logActivity('thomas', 'Thomas', `Cron finance erreur: ${msg}`, 'error', Date.now() - globalStart);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
