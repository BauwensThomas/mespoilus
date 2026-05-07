import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { getPhotoForCategory } from '@/lib/pexels';
import { downloadAndStorePhoto } from '@/lib/unsplash-storage';

const ANIMAL_CATEGORIES = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'];

const GENERIC_PRODUCTS: Record<string, string[]> = {
  chiens:   ['tapis rafraîchissant', 'gamelle inox', 'laisse rétractable'],
  chats:    ['griffoir', 'litière végétale', 'jouet interactif'],
  oiseaux:  ['cage spacieuse', 'perchoir naturel', 'graines premium'],
  rongeurs: ['roue d\'exercice', 'tunnel de jeu', 'foin de qualité'],
  reptiles: ['lampe UV', 'thermomètre digital', 'substrat naturel'],
};

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

function getISOWeek(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

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

  let animal = 'chiens';
  let season = 'printemps';
  let sujet = '';
  let motsCles: string[] = [];
  let articleSlug = '';
  let articleTitle = '';
  let articleExcerpt = '';
  let pipelineTokens = 0;
  const errors: string[] = [];

  // ─── ÉTAPE 1 : Thomas prépare le contexte ────────────────────────────────
  const step1Start = Date.now();
  try {
    const month = now.getMonth() + 1;
    season = getSeason(month);
    const week = getISOWeek(now);
    animal = ANIMAL_CATEGORIES[week % 5];

    const { data: articles } = await supabase
      .from('articles')
      .select('title')
      .order('published_at', { ascending: false })
      .limit(20);
    const recentTitles = (articles ?? []).map((a: { title: string }) => a.title);

    const { data: productRows } = await supabase
      .from('products')
      .select('name')
      .eq('category', animal)
      .eq('in_stock', true)
      .limit(3);
    const products = (productRows && productRows.length > 0)
      ? productRows.map((p: { name: string }) => p.name)
      : GENERIC_PRODUCTS[animal];

    console.log(`[Cron1] Thomas : animal=${animal}, saison=${season}`);
    await logActivity('thomas', 'Thomas',
      `Cron étape 1 : contexte préparé — ${animal} en ${season}`,
      'success', Date.now() - step1Start,
      { animal, season, products, recent_count: recentTitles.length }
    );

    // ─── ÉTAPE 2 : Lucas analyse le SEO ──────────────────────────────────
    const step2Start = Date.now();
    const recentContext = recentTitles.length
      ? recentTitles.slice(0, 15).map(t => `- ${t}`).join('\n')
      : 'Aucun article récent.';
    const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const productsForLucas = products.map(p => `- ${p}`).join('\n');

    const lucasPrompt = `Trouve le meilleur sujet d'article pour les propriétaires de ${animal} en ce moment (${monthName}, ${season}).

PRIORITÉ 1 — Sujet EN VOGUE cette saison : qu'est-ce que les propriétaires de ${animal} recherchent activement sur Google en ${season} ? Pense aux préoccupations concrètes du moment (parasites, chaleurs, comportements saisonniers, maladies de saison, soins spécifiques...).

PRIORITÉ 2 — Sujet lié à nos produits disponibles (affiliation) :
${productsForLucas}
Si un sujet permet de recommander naturellement ces produits, c'est idéal pour notre monétisation.

PRIORITÉ 3 — Si aucun sujet ne semble vraiment en vogue ou pertinent : propose un conseil pratique utile de saison pour les propriétaires de ${animal}.

Articles déjà publiés (à ne pas dupliquer) :
${recentContext}

Retourne UNIQUEMENT :
SUJET: [le sujet choisi]
MOTS_CLES: [mot1, mot2, mot3, mot4, mot5]
INTENTION: [ce que cherche l'internaute]
RAISON: [pourquoi ce sujet est pertinent maintenant]`;

    const lucasResult = await executeAgentTask('lucas', lucasPrompt);
    pipelineTokens += lucasResult.tokens_used ?? 0;
    if (lucasResult.success) {
      const subjectMatch = lucasResult.content.match(/SUJET:\s*(.+)/i);
      const keywordsMatch = lucasResult.content.match(/MOTS_CLES:\s*(.+)/i);
      sujet = subjectMatch?.[1]?.trim() ?? '';
      motsCles = keywordsMatch?.[1]?.split(',').map(k => k.trim()).filter(Boolean) ?? [];
      console.log(`[Cron1] Lucas : sujet=${sujet}`);
      await logActivity('thomas', 'Thomas',
        `Cron étape 2 : Lucas → ${sujet}`,
        'success', Date.now() - step2Start, { sujet, mots_cles: motsCles }
      );
    } else {
      sujet = `Conseils pratiques pour votre ${animal.replace(/s$/, '')} en ${season}`;
      motsCles = [animal, season, 'conseils', 'bien-être', 'santé'];
      errors.push(`Étape 2: ${lucasResult.error}`);
      await logActivity('thomas', 'Thomas',
        `Cron étape 2 erreur Lucas — fallback sujet utilisé`,
        'error', Date.now() - step2Start
      );
    }

    // ─── ÉTAPE 3 : Marie écrit l'article ─────────────────────────────────
    const step3Start = Date.now();
    const productsStr = products.map(p => `- ${p}`).join('\n');
    const mariePrompt = `Écris un article de conseil pratique sur : ${sujet}
Mots-clés à intégrer naturellement : ${motsCles.join(', ')}
Saison : ${season} — adapte les conseils à la saison
Animal : ${animal}

Intègre naturellement 2-3 recommandations de produits dans le texte :
${productsStr}
Formule ainsi : 'Un [type produit] de qualité peut vraiment aider...' puis renvoie vers mespoilus.com/boutique

C'est un article de CONSEILS PRATIQUES destiné aux propriétaires francophones. Ton bienveillant, accessible, utile.`;

    const marieResult = await executeAgentTask('marie', mariePrompt);
    pipelineTokens += marieResult.tokens_used ?? 0;
    if (!marieResult.success) throw new Error(marieResult.error ?? 'Marie a échoué');

    const slugMatch = marieResult.content.match(/^slug:\s*(.+)/m);
    const titleMatch = marieResult.content.match(/^title:\s*(.+)/m);
    const excerptMatch = marieResult.content.match(/^excerpt:\s*(.+)/m);
    articleSlug = slugMatch?.[1]?.trim() ?? '';
    articleTitle = titleMatch?.[1]?.trim() ?? sujet;
    articleExcerpt = excerptMatch?.[1]?.trim() ?? '';

    // Fallback : fetch depuis Supabase si slug non parsé du frontmatter
    if (!articleSlug) {
      await new Promise(r => setTimeout(r, 3000));
      const { data } = await supabase
        .from('articles')
        .select('slug, title, excerpt')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        articleSlug = data.slug ?? '';
        articleTitle = data.title ?? articleTitle;
        articleExcerpt = data.excerpt ?? articleExcerpt;
      }
    }

    console.log(`[Cron1] Marie : slug=${articleSlug}`);

    // ─── IMAGE : télécharger pour l'animal + stocker dans Supabase Storage ───
    let imageUrl: string | null = null;
    if (articleSlug) {
      try {
        // Vérifier si l'article a déjà une image (runner.ts peut l'avoir ajoutée)
        const { data: imgCheck } = await supabase
          .from('articles').select('image_url').eq('slug', articleSlug).maybeSingle();
        imageUrl = imgCheck?.image_url ?? null;

        if (!imageUrl) {
          console.log(`[Cron1] Image: téléchargement pour catégorie "${animal}"...`);
          const photo = await Promise.race([
            getPhotoForCategory(animal, sujet),
            new Promise<null>(r => setTimeout(() => r(null), 5000)),
          ]);
          if (photo) {
            const stored = await Promise.race([
              downloadAndStorePhoto(photo.url, `article-${articleSlug}.jpg`),
              new Promise<null>(r => setTimeout(() => r(null), 5000)),
            ]);
            imageUrl = stored ?? photo.url;
            await supabase.from('articles').update({
              image_url: imageUrl,
              image_alt: photo.alt,
              image_credit: photo.credit,
              image_credit_url: photo.creditUrl,
            }).eq('slug', articleSlug);
            console.log('[Cron1] Image:', stored ? `stockée Supabase ✅` : 'URL Unsplash directe');
          } else {
            console.log('[Cron1] Image: Unsplash indisponible (clé absente ou timeout)');
          }
        } else {
          console.log('[Cron1] Image déjà présente:', imageUrl.slice(0, 60));
        }
      } catch (err) {
        console.warn('[Cron1] Image erreur:', err instanceof Error ? err.message : err);
      }
    }

    // Sauvegarde dans cron_state pour que le cron social le lise dans 30min
    await supabase.from('cron_state').insert({
      slug: articleSlug,
      title: articleTitle,
      excerpt: articleExcerpt,
      status: 'article_ready',
    });

    await logActivity('thomas', 'Thomas',
      `Cron étape 3 : Marie → article prêt (slug: ${articleSlug})`,
      'success', Date.now() - step3Start,
      { article_slug: articleSlug, article_title: articleTitle }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(msg);
    console.error('[Cron1] erreur:', msg);
    await logActivity('thomas', 'Thomas', `Cron blog erreur: ${msg}`, 'error', Date.now() - globalStart);
  }

  const totalDuration = Date.now() - globalStart;

  // Incrémenter les stats de Thomas (orchestrateur du cron)
  try {
    const existing = await supabase.from('agent_stats').select('tasks_completed,total_tokens_used').eq('agent_id', 'thomas').maybeSingle();
    if (existing.error) console.error('[thomas-stats] select erreur:', existing.error.message);
    const row = existing.data;
    if (!row) {
      const ins = await supabase.from('agent_stats').insert({ agent_id: 'thomas', tasks_completed: 1, tasks_failed: 0, total_tokens_used: pipelineTokens, last_active: new Date().toISOString() });
      console.log('[thomas-stats] insert:', ins.error ? ins.error.message : 'OK');
    } else {
      const upd = await supabase.from('agent_stats').update({ tasks_completed: (row.tasks_completed ?? 0) + 1, total_tokens_used: (row.total_tokens_used ?? 0) + pipelineTokens, last_active: new Date().toISOString() }).eq('agent_id', 'thomas');
      console.log('[thomas-stats] update:', upd.error ? upd.error.message : 'OK');
    }
  } catch (err) {
    console.error('[thomas-stats] exception:', err instanceof Error ? err.message : err);
  }

  console.log(`[Cron1] Terminé en ${totalDuration}ms — slug=${articleSlug}`);

  return NextResponse.json({
    success: !!articleSlug,
    duration_ms: totalDuration,
    animal, season, sujet, article_slug: articleSlug,
    ...(errors.length ? { errors } : {}),
  });
}
