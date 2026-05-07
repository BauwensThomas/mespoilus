import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBulkNewsletter } from '@/lib/resend';

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

  // Éviter les doublons : vérifier si une newsletter a déjà été envoyée dans les 5 derniers jours
  const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentSent } = await supabase
    .from('newsletter_campaigns')
    .select('id')
    .eq('status', 'sent')
    .gte('sent_at', since)
    .limit(1)
    .maybeSingle();

  if (recentSent) {
    console.log('[Cron Newsletter] Newsletter déjà envoyée cette semaine, abandon.');
    return NextResponse.json({ success: false, reason: 'already_sent_this_week' });
  }

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
    // ── Étape 1 : Sofia génère la newsletter ──────────────────────────────────
    const currentYear = new Date().getFullYear();
    const sofiaPrompt = `Crée la newsletter de Mes Poilus avec les meilleurs articles récents :

${articlesStr}

Année actuelle : ${currentYear} (utilise cette année dans le footer copyright).

Format JSON requis : { "subject": "...", "preview_text": "...", "content_html": "..." }`;

    const result = await executeAgentTask('sofia', sofiaPrompt);
    if (!result.success) throw new Error(result.error ?? 'Sofia a échoué');

    // ── Étape 2 : Récupérer le brouillon que Sofia vient de sauvegarder ───────
    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .select('id, subject, content_html')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!campaign?.content_html) throw new Error('Brouillon newsletter introuvable après génération');

    // ── Étape 3 : Récupérer les abonnés actifs ────────────────────────────────
    const { data: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'active');

    const emails = (subscribers ?? []).map((s: { email: string }) => s.email);

    if (emails.length === 0) {
      await logActivity('thomas', 'Thomas', 'Cron newsletter : aucun abonné actif', 'success', Date.now() - globalStart);
      return NextResponse.json({ success: true, reason: 'no_subscribers', draft_saved: true });
    }

    // ── Étape 4 : Envoi via Resend ────────────────────────────────────────────
    const { sent, failed } = await sendBulkNewsletter({
      subject: campaign.subject,
      html: campaign.content_html,
      subscribers: emails,
    });

    // Marquer la campagne comme envoyée
    await supabase
      .from('newsletter_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: emails.length,
        sent_count: sent,
        failed_count: failed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign.id);

    const duration = Date.now() - globalStart;
    await logActivity('thomas', 'Thomas',
      `Cron newsletter : envoyée à ${sent}/${emails.length} abonnés`,
      failed === emails.length ? 'error' : 'success',
      duration, { sent, failed, total: emails.length }, result.tokens_used ?? 0
    );
    console.log(`[Cron Newsletter] Envoyée à ${sent}/${emails.length} abonnés en ${duration}ms`);

    return NextResponse.json({ success: true, duration_ms: duration, sent, failed, total: emails.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    await logActivity('thomas', 'Thomas', `Cron newsletter erreur: ${msg}`, 'error', Date.now() - globalStart);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
