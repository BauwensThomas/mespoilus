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
    await supabase.from('activity_logs').insert({
      agent_id: agentId, agent_name: agentName,
      action, status, duration_ms: durationMs, details,
    });
  } catch { /* non-bloquant */ }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const now = new Date();
  const supabase = createAdminClient();
  const errors: string[] = [];

  // Lire le dernier article prêt depuis cron_state
  const { data: stateRow } = await supabase
    .from('cron_state')
    .select('id, slug, title, excerpt, created_at')
    .eq('status', 'article_ready')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!stateRow?.slug) {
    console.log('[Cron2] Aucun article prêt dans cron_state, abandon.');
    await logActivity('thomas', 'Thomas', '[Cron social] abandon - aucun article_ready dans cron_state', 'error', Date.now() - globalStart);
    return NextResponse.json({ success: false, reason: 'no_article_ready' });
  }

  // Garde-fou fraîcheur : ne pas poster un article périmé (blog n'a pas tourné ce cycle)
  // Bypass si déclenchement manuel admin (?manual=true) — l'humain sait ce qu'il fait
  const isManual = new URL(req.url).searchParams.get('manual') === 'true';
  const ageMs = Date.now() - new Date(stateRow.created_at).getTime();
  if (!isManual && ageMs > 6 * 60 * 60 * 1000) {
    console.log(`[Cron2] Article prêt trop ancien (${Math.round(ageMs / 3600000)}h), abandon pour éviter un post périmé.`);
    await supabase.from('cron_state').update({ status: 'superseded' }).eq('id', stateRow.id);
    await logActivity('thomas', 'Thomas', `[Cron social] abandon - article_ready périmé (${Math.round(ageMs / 3600000)}h)`, 'error', Date.now() - globalStart);
    return NextResponse.json({ success: false, reason: 'article_too_old' });
  }

  const { id: stateId, slug, title, excerpt } = stateRow;
  console.log(`[Cron2] Article trouvé : slug=${slug}`);

  // Lire featured_partner et promo_codes depuis l'article
  let featuredPartner = '';
  let promoCodes = '';
  try {
    const { data: articleData } = await supabase
      .from('articles')
      .select('featured_partner, promo_codes')
      .eq('slug', slug)
      .maybeSingle();
    featuredPartner = articleData?.featured_partner ?? '';
    promoCodes = articleData?.promo_codes ?? '';
  } catch { /* non-bloquant */ }

  const partnerHashtag = featuredPartner
    ? `#${featuredPartner.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[ùûü]/g, 'u').replace(/[^a-z0-9]/g, '')}`
    : '';

  // ─── ÉTAPE 4 : Emma publie sur les réseaux ────────────────────────────────
  const step4Start = Date.now();
  try {
    const promoBlock = promoCodes
      ? `\nCodes promo à mettre en avant dans le post (obligatoire, rends-les visibles et accrocheurs) :\n${promoCodes}\n`
      : '';

    const partnerBlock = partnerHashtag
      ? `\nAjoute le hashtag ${partnerHashtag} dans la liste des hashtags.`
      : '';

    const emmaPrompt = `Crée un post Facebook et Instagram pour cet article de conseils :
Titre : ${title}
Résumé : ${excerpt || title}
${promoBlock}
Le post doit donner envie de lire l'article complet.
IMPORTANT : tu dois inclure ce lien EXACT à la fin du post, sans le modifier ni le raccourcir :
https://www.mespoilus.com/blog/${slug}${partnerBlock}`;

    const result = await executeAgentTask('emma', emmaPrompt);
    if (!result.success) throw new Error(result.error ?? 'Emma a échoué');

    console.log('[Cron2] Emma : post publié');
    await logActivity('thomas', 'Thomas',
      `Cron étape 4 : Emma → post réseaux sociaux pour ${slug}`,
      'success', Date.now() - step4Start, { article_slug: slug }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(`Étape 4: ${msg}`);
    console.error('[Cron2] Emma erreur:', msg);
    await logActivity('thomas', 'Thomas', `Cron étape 4 erreur: ${msg}`, 'error', Date.now() - step4Start);
  }

  // Marquer cron_state comme terminé
  await supabase.from('cron_state').update({ status: 'done' }).eq('id', stateId);

  // Log global
  const totalDuration = Date.now() - globalStart;
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  await logActivity('thomas', 'Thomas',
    `[Cron social du ${dateStr}] - Emma terminée`,
    errors.length === 0 ? 'success' : 'error',
    totalDuration, { slug, errors }
  );

  console.log(`[Cron2] Terminé en ${totalDuration}ms`);

  return NextResponse.json({
    success: errors.length === 0,
    duration_ms: totalDuration,
    slug,
    ...(errors.length ? { errors } : {}),
  });
}
