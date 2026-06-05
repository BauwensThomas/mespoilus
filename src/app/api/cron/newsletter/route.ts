import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBulkNewsletter, sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow, sectionBlock } from '@/lib/cron-email';
import { buildNewsletterHtml, type NlArticle, type NlGrille } from '@/lib/newsletter-template';

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

  const urlParams = new URL(req.url).searchParams;
  const bypass = urlParams.get('bypass') === 'true';
  const target = urlParams.get('target') ?? 'all'; // 'admin' | 'all'

  // Éviter les doublons sauf si bypass=true (envoi manuel)
  if (!bypass) {
    const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSent } = await supabase
      .from('newsletter_campaigns')
      .select('id')
      .eq('status', 'sent')
      .gte('sent_at', since)
      .gt('recipients_count', 1)
      .limit(1)
      .maybeSingle();

    if (recentSent) {
      console.log('[Cron Newsletter] Newsletter déjà envoyée cette semaine, abandon.');
      return NextResponse.json({ success: false, reason: 'already_sent_this_week' });
    }
  }

  // Les 3 derniers articles publiés
  const { data: articlesData } = await supabase
    .from('articles')
    .select('title, slug, excerpt, image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);

  if (!articlesData || articlesData.length === 0) {
    return NextResponse.json({ success: false, reason: 'no_articles' });
  }
  const articles = articlesData as NlArticle[];

  const articlesStr = articles
    .map(a => `- ${a.title}\n  Résumé : ${a.excerpt ?? ''}`)
    .join('\n\n');

  // ── Grille Mystère active (pour la section fixe du template) ─────────────────
  let grille: NlGrille | null = null;
  try {
    const { data: g } = await supabase
      .from('pixel_grilles')
      .select('id, grille_taille, ends_at, created_at')
      .eq('statut', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (g) {
      const { data: achats } = await supabase
        .from('pixel_achats')
        .select('positions')
        .eq('grille_id', g.id)
        .not('confirmed_at', 'is', null);
      const totalPixels = g.grille_taille * g.grille_taille;
      const vendus = (achats ?? []).reduce((s, a) => s + (a.positions as number[]).length, 0);
      const pct = (vendus / totalPixels) * 100;
      const pctLabel = vendus > 0 && pct < 1 ? pct.toFixed(2).replace('.', ',') : String(Math.round(pct));
      const end = g.ends_at ? new Date(g.ends_at) : new Date(new Date(g.created_at).setMonth(new Date(g.created_at).getMonth() + 3));
      const jours = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
      grille = { imageUrl: `https://www.mespoilus.com/api/grille/${g.id}/image?fmt=jpg`, pctLabel, jours };
    }
  } catch { /* pas de grille active */ }

  try {
    // ── Étape 1 : Sofia génère UNIQUEMENT le texte (le HTML est fixe en code) ──
    const currentYear = new Date().getFullYear();
    const sofiaPrompt = `Rédige le TEXTE d'une newsletter Mes Poilus. IMPORTANT : tu ne fournis QUE le texte, le HTML (header, articles, footer) est mis en forme automatiquement.

Articles de la semaine (pour inspirer l'intro, ne les réécris pas) :
${articlesStr}

Réponds UNIQUEMENT avec ce JSON (sans balises code, texte simple sans HTML) :
{
  "subject": "Objet accrocheur, max 60 caractères",
  "preview_text": "Texte de prévisualisation, max 90 caractères",
  "intro": "2-3 phrases d'introduction chaleureuses et personnelles",
  "conseil": "Un conseil pratique et concret sur les animaux, 2-4 phrases"
}`;

    const result = await executeAgentTask('sofia', sofiaPrompt);
    if (!result.success) throw new Error(result.error ?? 'Sofia a échoué');

    // Parse direct de la sortie de Sofia (le HTML n'est plus généré par l'IA)
    let parsed: { subject?: string; preview_text?: string; intro?: string; conseil?: string } = {};
    try {
      const cleaned = result.content.replace(/```json|```/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    } catch { parsed = {}; }

    const subject = parsed.subject?.trim() || 'Les conseils Mes Poilus de la semaine';
    const previewText = parsed.preview_text?.trim() || '';
    const intro = parsed.intro?.trim() || 'Voici nos derniers conseils pour prendre soin de tes compagnons à poils, à plumes et à écailles.';
    const conseil = parsed.conseil?.trim() || '';

    // ── Étape 2 : Assemblage du HTML (template fixe, déterministe) ────────────
    const html = buildNewsletterHtml({ intro, conseil, articles, grille, year: currentYear });

    const { data: campaign } = await supabase
      .from('newsletter_campaigns')
      .insert({ subject, preview_text: previewText || null, content_html: html, status: 'draft' })
      .select('id')
      .single();
    const campaignId = campaign?.id;

    // ── Étape 3 : Destinataires ──────────────────────────────────────────────
    let emails: string[] = [];
    if (target === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL ?? 'contact@mespoilus.com';
      emails = [adminEmail];
      console.log(`[Cron Newsletter] Envoi test → admin (${adminEmail})`);
    } else {
      const { data: subscribers } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('status', 'active');
      emails = (subscribers ?? []).map((s: { email: string }) => s.email);
    }

    if (emails.length === 0) {
      await logActivity('thomas', 'Thomas', 'Cron newsletter : aucun abonné actif', 'success', Date.now() - globalStart);
      return NextResponse.json({ success: true, reason: 'no_subscribers', draft_saved: true });
    }

    // ── Étape 4 : Envoi via Resend ───────────────────────────────────────────
    const { sent, failed } = await sendBulkNewsletter({ subject, html, subscribers: emails });

    if (campaignId) {
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
        .eq('id', campaignId);
    }

    const duration = Date.now() - globalStart;
    await logActivity('thomas', 'Thomas',
      `Cron newsletter : envoyée à ${sent}/${emails.length} abonnés`,
      failed === emails.length ? 'error' : 'success',
      duration, { sent, failed, total: emails.length }, result.tokens_used ?? 0
    );
    console.log(`[Cron Newsletter] Envoyée à ${sent}/${emails.length} abonnés en ${duration}ms`);

    // Email de confirmation à l'admin
    try {
      const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const articlesHtml = articles.map(a =>
        `<p style="margin:4px 0;font-size:13px">• <a href="https://www.mespoilus.com/blog/${a.slug}" style="color:#ea580c">${a.title}</a></p>`
      ).join('');
      const body = statsRow([
        { label: 'Envoyes', value: sent, color: '#16a34a' },
        { label: 'Echecs', value: failed, color: failed > 0 ? '#dc2626' : '#9ca3af' },
        { label: 'Total abonnes', value: emails.length },
      ]) +
      sectionBlock('Sujet de la newsletter', `<p style="margin:0;font-weight:600">${subject}</p>`, '#8b5cf6', '#faf5ff') +
      sectionBlock('Articles inclus', articlesHtml, '#ea580c', '#fff7ed');

      await sendEmail({
        to: 'contact@mespoilus.com',
        subject: `[Mes Poilus] Newsletter envoyee - ${sent}/${emails.length} abonnes`,
        html: cronEmailWrapper(`Newsletter - ${date}`, 'Newsletter Sofia', body),
      });
      console.log('[Cron Newsletter] Email confirmation envoye');
    } catch (emailErr) {
      console.error('[Cron Newsletter] Email erreur:', emailErr instanceof Error ? emailErr.message : emailErr);
    }

    return NextResponse.json({ success: true, duration_ms: duration, sent, failed, total: emails.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    await logActivity('thomas', 'Thomas', `Cron newsletter erreur: ${msg}`, 'error', Date.now() - globalStart);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
