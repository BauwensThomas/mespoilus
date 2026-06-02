import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBulkNewsletter, sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow, sectionBlock } from '@/lib/cron-email';

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

  // Éviter les doublons sauf si bypass=true (envoi manuel depuis la page agent)
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

  // Récupérer les 3 derniers articles publiés
  const { data: articles } = await supabase
    .from('articles')
    .select('title, slug, excerpt, image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ success: false, reason: 'no_articles' });
  }

  const articlesStr = articles
    .map((a: { title: string; slug: string; excerpt: string | null; image_url: string | null }) => {
      const imgLine = a.image_url ? `\n  Image : ${a.image_url}` : '';
      return `- ${a.title}\n  Lien : https://www.mespoilus.com/blog/${a.slug}\n  Résumé : ${a.excerpt ?? ''}${imgLine}`;
    })
    .join('\n\n');

  // ── Bloc Grille Mystère (si une grille est active) ──────────────────────────
  let grilleBlock = '';
  try {
    const { data: grille } = await supabase
      .from('pixel_grilles')
      .select('id, grille_taille, ends_at, created_at')
      .eq('statut', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (grille) {
      const { data: achats } = await supabase
        .from('pixel_achats')
        .select('positions')
        .eq('grille_id', grille.id)
        .not('confirmed_at', 'is', null);
      const totalPixels = grille.grille_taille * grille.grille_taille;
      const vendus = (achats ?? []).reduce((s, a) => s + (a.positions as number[]).length, 0);
      const pct = (vendus / totalPixels) * 100;
      const pctLabel = vendus > 0 && pct < 1 ? pct.toFixed(2).replace('.', ',') : String(Math.round(pct));
      const end = grille.ends_at ? new Date(grille.ends_at) : new Date(new Date(grille.created_at).setMonth(new Date(grille.created_at).getMonth() + 3));
      const jours = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
      const imageUrl = `https://www.mespoilus.com/api/grille/${grille.id}/image?fmt=jpg`;

      grilleBlock = `

SECTION SPÉCIALE À INCLURE — "Grille Mystère" (mets-la en avant, c'est un jeu en cours) :
- Concept : un animal mystère caché derrière une grille de pixels, à révéler en achetant des pixels. Devine la race en premier pour gagner, 3 cadeaux, une partie reversée à un refuge.
- État actuel : ${pctLabel}% de l'image révélée, il reste ${jours} jours.
- Image à afficher dans cette section (balise <img> avec cette URL exacte, largeur 100%, coins arrondis) : ${imageUrl}
- Bouton/lien vers : https://www.mespoilus.com/grille
- ⚠️ CONTRASTE : le texte de cette section DOIT être foncé et lisible (couleur #1f2937 ou plus foncé) sur fond clair. N'utilise JAMAIS de gris clair (#9ca3af, #d1d5db…) sur fond blanc. Le titre en orange #ea580c, le corps en gris foncé #374151.
- ⚠️ NE révèle AUCUN indice sur l'animal (pas de race, type, couleur, "quatre pattes"…). Garde le mystère entier.`;
    }
  } catch { /* pas de grille active, on ignore */ }

  try {
    // ── Étape 1 : Sofia génère la newsletter ──────────────────────────────────
    const currentYear = new Date().getFullYear();
    const sofiaPrompt = `Crée la newsletter de Mes Poilus avec les meilleurs articles récents :

${articlesStr}
${grilleBlock}

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

    // ── Étape 3 : Destinataires selon target ─────────────────────────────────
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

    try {
      const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const articlesHtml = articles.map((a: { title: string; slug: string }) =>
        `<p style="margin:4px 0;font-size:13px">• <a href="https://www.mespoilus.com/blog/${a.slug}" style="color:#ea580c">${a.title}</a></p>`
      ).join('');
      const body = statsRow([
        { label: 'Envoyes', value: sent, color: '#16a34a' },
        { label: 'Echecs', value: failed, color: failed > 0 ? '#dc2626' : '#9ca3af' },
        { label: 'Total abonnes', value: emails.length },
      ]) +
      sectionBlock('Sujet de la newsletter', `<p style="margin:0;font-weight:600">${campaign.subject}</p>`, '#8b5cf6', '#faf5ff') +
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
