import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function logActivity(
  agentId: string, agentName: string, action: string,
  status: 'success' | 'error', durationMs: number,
  details: Record<string, unknown> = {}
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('activity_logs').insert({ agent_id: agentId, agent_name: agentName, action, status, duration_ms: durationMs, details });
  } catch { /* non-bloquant */ }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const supabase = createAdminClient();

  // Récupérer les 3 derniers articles publiés
  const { data: articles } = await supabase
    .from('articles')
    .select('title, slug, excerpt')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ success: false, reason: 'no_articles' });
  }

  const articlesStr = articles
    .map((a: { title: string; slug: string; excerpt: string | null }) =>
      `- ${a.title}\n  Lien : https://mespoilus.com/blog/${a.slug}\n  Résumé : ${a.excerpt ?? ''}`
    )
    .join('\n\n');

  try {
    const sofiaPrompt = `Crée la newsletter de Mes Poilus avec les meilleurs articles récents :

${articlesStr}

Format JSON requis : { "subject": "...", "preview_text": "...", "content_html": "..." }`;

    const result = await executeAgentTask('sofia', sofiaPrompt);
    if (!result.success) throw new Error(result.error ?? 'Sofia a échoué');

    const duration = Date.now() - globalStart;
    await logActivity('sofia', 'Sofia', `Newsletter créée — ${articles.length} articles`, 'success', duration);
    console.log(`[Cron Newsletter] Terminé en ${duration}ms`);

    return NextResponse.json({ success: true, duration_ms: duration, articles_count: articles.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    await logActivity('sofia', 'Sofia', `Newsletter erreur: ${msg}`, 'error', Date.now() - globalStart);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
