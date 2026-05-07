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
  const errors: string[] = [];

  // ── Nathalie : audit de sécurité ─────────────────────────────────────────
  try {
    const nathaliePrompt = await buildEnrichedPrompt(
      'nathalie',
      'Effectue un audit de sécurité complet de l\'application. Analyse les incidents récents, évalue le niveau de risque global et donne les 5 actions prioritaires à entreprendre.',
      supabase
    );
    const nathalieResult = await executeAgentTask('nathalie', nathaliePrompt);
    if (!nathalieResult.success) throw new Error(nathalieResult.error ?? 'Nathalie a échoué');
    await logActivity('thomas', 'Thomas', 'Cron sécurité : audit Nathalie terminé', 'success', nathalieResult.duration_ms ?? 0, {}, nathalieResult.tokens_used ?? 0);
    console.log('[Cron Security] Nathalie OK');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(`Nathalie: ${msg}`);
    await logActivity('thomas', 'Thomas', `Cron sécurité erreur Nathalie: ${msg}`, 'error', 0);
    console.error('[Cron Security] Nathalie erreur:', msg);
  }

  // ── Maxime : audit technique ──────────────────────────────────────────────
  try {
    const maximePrompt = await buildEnrichedPrompt(
      'maxime',
      'Effectue un audit technique complet de l\'application. Analyse les erreurs dans les logs, identifie les problèmes de performance et propose les corrections prioritaires.',
      supabase
    );
    const maximeResult = await executeAgentTask('maxime', maximePrompt);
    if (!maximeResult.success) throw new Error(maximeResult.error ?? 'Maxime a échoué');
    await logActivity('thomas', 'Thomas', 'Cron sécurité : audit Maxime terminé', 'success', maximeResult.duration_ms ?? 0, {}, maximeResult.tokens_used ?? 0);
    console.log('[Cron Security] Maxime OK');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(`Maxime: ${msg}`);
    await logActivity('thomas', 'Thomas', `Cron sécurité erreur Maxime: ${msg}`, 'error', 0);
    console.error('[Cron Security] Maxime erreur:', msg);
  }

  const totalDuration = Date.now() - globalStart;
  console.log(`[Cron Security] Terminé en ${totalDuration}ms`);

  return NextResponse.json({
    success: errors.length === 0,
    duration_ms: totalDuration,
    ...(errors.length ? { errors } : {}),
  });
}
