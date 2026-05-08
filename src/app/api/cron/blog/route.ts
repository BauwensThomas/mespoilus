import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { getPhotoForCategory } from '@/lib/pexels';
import { downloadAndStorePhoto } from '@/lib/unsplash-storage';
import { PARTENAIRES } from '@/lib/partenaires';

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
  details: Record<string, unknown> = {},
  tokensUsed = 0
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('activity_logs').insert({
      agent_id: agentId, agent_name: agentName,
      action, status, duration_ms: durationMs, details,
      tokens_used: tokensUsed,
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

  const urlParams = new URL(req.url).searchParams;
  const urlAnimal = urlParams.get('animal');
  const urlType = urlParams.get('type');

  let animal = 'chiens';
  let season = 'printemps';
  let sujet = '';
  let motsCles: string[] = [];
  let intention = '';
  let raison = '';
  let nomProduit = '';
  let lienAffilie = '';
  let imageProduit = '';
  let metaDesc = '';
  let relatedArticles: { slug: string; title: string }[] = [];
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
    // dayIndex : lundi=0, mercredi=1, vendredi=2 (−1 si run manuel hors-planning)
    const dayIndex = [1, 3, 5].indexOf(now.getDay());
    const postIndex = dayIndex >= 0 ? dayIndex : 0;
    animal = (urlAnimal && ANIMAL_CATEGORIES.includes(urlAnimal))
      ? urlAnimal
      : ANIMAL_CATEGORIES[(week * 3 + postIndex) % 5];

    const { data: articles } = await supabase
      .from('articles')
      .select('title')
      .order('published_at', { ascending: false })
      .limit(30);
    const recentTitles = (articles ?? []).map((a: { title: string }) => a.title);

    // Partenaires déjà mis en avant (colonne featured_partner — requiert migration_featured_partner.sql)
    let recentlyFeaturedPartners: string[] = [];
    try {
      const { data: partnerRows } = await supabase
        .from('articles')
        .select('featured_partner')
        .not('featured_partner', 'is', null)
        .order('published_at', { ascending: false })
        .limit(30);
      recentlyFeaturedPartners = Array.from(new Set(
        (partnerRows ?? []).map((a: { featured_partner: string }) => a.featured_partner).filter(Boolean)
      ));
    } catch { /* migration non encore appliquée — pas de blocage */ }

    const { data: productRows } = await supabase
      .from('products')
      .select('name, affiliate_url, image_url')
      .eq('category', animal)
      .eq('in_stock', true)
      .gt('price', 0)
      .limit(5);
    type ProductRow = { name: string; affiliate_url: string; image_url: string };
    const productsWithLinks: ProductRow[] = (productRows && productRows.length > 0)
      ? (productRows as ProductRow[])
      : GENERIC_PRODUCTS[animal].map(name => ({ name, affiliate_url: '', image_url: '' }));

    // Derniers articles de la même catégorie pour liens internes dans l'article de Marie
    try {
      const { data: relRows } = await supabase
        .from('articles').select('slug, title')
        .eq('category', animal).eq('status', 'published')
        .order('published_at', { ascending: false }).limit(3);
      relatedArticles = (relRows ?? []) as { slug: string; title: string }[];
    } catch { /* non-bloquant */ }

    const partenairesAnimal = PARTENAIRES.filter(p =>
      !p.categories || p.categories.includes(animal)
    );

    console.log(`[Cron1] Thomas : animal=${animal}, saison=${season}`);
    await logActivity('thomas', 'Thomas',
      `Cron étape 1 : contexte préparé — ${animal} en ${season}`,
      'success', Date.now() - step1Start,
      { animal, season, products: productsWithLinks.map(p => p.name), partenaires: partenairesAnimal.map(p => p.nom), recent_count: recentTitles.length }
    );

    // ─── ÉTAPE 2 : Lucas analyse le SEO ──────────────────────────────────
    const step2Start = Date.now();
    const recentContext = recentTitles.length
      ? recentTitles.map(t => `- ${t}`).join('\n')
      : 'Aucun article récent.';
    const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    // Rotation forcée du type d'article : trending → affiliation → pratique → ...
    const ARTICLE_TYPES = ['trending', 'affiliation', 'pratique'] as const;
    const articleTypeIndex = (week * 3 + postIndex) % 3;
    const requestedType = (urlType && (ARTICLE_TYPES as readonly string[]).includes(urlType))
      ? urlType as typeof ARTICLE_TYPES[number]
      : ARTICLE_TYPES[articleTypeIndex];

    // Fallback affiliation → pratique si tous les partenaires sont bloqués et aucun produit dispo
    const availablePartners = partenairesAnimal.filter(p => !recentlyFeaturedPartners.includes(p.nom));
    const hasAffiliatableProducts = productsWithLinks.some(p => p.affiliate_url);
    const forcedType = (requestedType === 'affiliation' && availablePartners.length === 0 && !hasAffiliatableProducts)
      ? 'pratique' as const
      : requestedType;
    if (forcedType !== requestedType) console.log('[Cron1] Affiliation: tous bloqués → fallback pratique');

    const partenairesStr = availablePartners.length
      ? availablePartners.map(p => `- ${p.nom} : ${p.description ?? ''}\n  Lien affilié : ${p.url}`).join('\n')
      : '';
    const productsForLucas = productsWithLinks
      .map(p => p.affiliate_url ? `- ${p.name} | lien : ${p.affiliate_url}${p.image_url ? ` | image : ${p.image_url}` : ''}` : `- ${p.name}`)
      .join('\n');

    const typeInstructions: Record<typeof forcedType, string> = {
      trending: `TYPE IMPOSÉ : TRENDING
Trouve un sujet que les propriétaires de ${animal} recherchent ACTIVEMENT sur Google EN CE MOMENT.
Pense au-delà des saisons : comportements étranges, questions santé fréquentes, tendances alimentation,
questions d'éducation/comportement, actualités vétérinaires, erreurs courantes à éviter.
NE PAS choisir un sujet saisonnier générique (ex: "printemps avec son chien") — trouve quelque chose de précis et recherché.`,

      affiliation: `TYPE IMPOSÉ : AFFILIATION
Tu dois IMPÉRATIVEMENT écrire un article centré sur UN partenaire ou produit ci-dessous.
Trouve un angle éditorial utile (guide d'achat, comparatif, "pourquoi choisir", avis, bienfaits...).
${recentlyFeaturedPartners.length ? `PARTENAIRES DÉJÀ UTILISÉS dans les 30 derniers articles — NE PAS réutiliser : ${recentlyFeaturedPartners.join(', ')}\n` : ''}${partenairesStr ? `Partenaires recommandés :\n${partenairesStr}\n` : ''}Produits en boutique :
${productsForLucas}
Tu DOIS retourner NOM_PRODUIT, LIEN_AFFILIE et IMAGE_PRODUIT dans ta réponse.`,

      pratique: `TYPE IMPOSÉ : CONSEIL PRATIQUE
Propose un guide pratique concret et actionnable pour les propriétaires de ${animal}.
Exemples : soins à domicile, erreurs à éviter, routine quotidienne, alimentation équilibrée,
activités, premiers secours, comportement, éducation, hygiène.
Évite les sujets trop génériques — sois précis et utile.`,
    };

    const lucasPrompt = `Trouve le meilleur sujet d'article SEO pour les propriétaires de ${animal} (${monthName}).

${typeInstructions[forcedType]}

Articles déjà publiés (à ne pas dupliquer) :
${recentContext}

Retourne UNIQUEMENT :
SUJET: [le sujet choisi]
MOTS_CLES: [mot1, mot2, mot3, mot4, mot5]
INTENTION: [ce que cherche l'internaute]
RAISON: [pourquoi ce sujet est pertinent]
NOM_PRODUIT: [nom exact du produit ou partenaire mis en avant, ou AUCUN]
LIEN_AFFILIE: [URL affiliée exacte à utiliser dans l'article, ou AUCUN]
IMAGE_PRODUIT: [URL image du produit, ou AUCUN]
META_DESC: [meta description SEO optimisée, 155 caractères max]`;

    const lucasResult = await executeAgentTask('lucas', lucasPrompt);
    pipelineTokens += lucasResult.tokens_used ?? 0;
    if (lucasResult.success) {
      const subjectMatch = lucasResult.content.match(/SUJET:\s*(.+)/i);
      const keywordsMatch = lucasResult.content.match(/MOTS_CLES:\s*(.+)/i);
      sujet = subjectMatch?.[1]?.trim() || `Conseils pratiques pour votre ${animal.replace(/s$/, '')} en ${season}`;
      motsCles = keywordsMatch?.[1]?.split(',').map(k => k.trim()).filter(Boolean) ?? [animal, season, 'conseils', 'bien-être', 'santé'];
      const intentionMatch = lucasResult.content.match(/INTENTION:\s*(.+)/i);
      const raisonMatch = lucasResult.content.match(/RAISON:\s*(.+)/i);
      intention = intentionMatch?.[1]?.trim() ?? '';
      raison = raisonMatch?.[1]?.trim() ?? '';
      const nomMatch = lucasResult.content.match(/NOM_PRODUIT:\s*(.+)/i);
      const lienMatch = lucasResult.content.match(/LIEN_AFFILIE:\s*(.+)/i);
      const imageMatch = lucasResult.content.match(/IMAGE_PRODUIT:\s*(.+)/i);
      nomProduit = (nomMatch?.[1]?.trim() ?? '') === 'AUCUN' ? '' : (nomMatch?.[1]?.trim() ?? '');
      lienAffilie = (lienMatch?.[1]?.trim() ?? '') === 'AUCUN' ? '' : (lienMatch?.[1]?.trim() ?? '');
      imageProduit = (imageMatch?.[1]?.trim() ?? '') === 'AUCUN' ? '' : (imageMatch?.[1]?.trim() ?? '');
      const metaDescMatch = lucasResult.content.match(/META_DESC:\s*(.+)/i);
      metaDesc = metaDescMatch?.[1]?.trim() ?? '';
      console.log(`[Cron1] Lucas : sujet=${sujet}${nomProduit ? `, produit=${nomProduit}` : ''}`);
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
    const productsStr = productsWithLinks
      .map(p => p.affiliate_url ? `- ${p.name} → ${p.affiliate_url}` : `- ${p.name}`)
      .join('\n');
    const produitSection = nomProduit && lienAffilie
      ? `\nPRODUIT / PARTENAIRE PRINCIPAL À METTRE EN AVANT :\n- Nom : ${nomProduit}\n- Lien affilié (utilise ce lien EXACT dans le texte, ne l'invente pas) : ${lienAffilie}\n  Ex. dans le texte : [${nomProduit}](${lienAffilie})\n`
      : `\nIntègre naturellement 1-2 recommandations de produits dans le texte avec leurs liens :\n${productsStr}\nSi aucun lien n'est disponible, renvoie vers mespoilus.com/boutique\n`;
    const contextLines = [
      forcedType !== 'affiliation' ? `Saison : ${season}` : '',
      intention ? `Ce que cherche le lecteur : ${intention}` : '',
      raison ? `Pourquoi ce sujet maintenant : ${raison}` : '',
    ].filter(Boolean).join('\n');

    const mariePrompt = `Écris un article de blog sur : ${sujet}
Animal concerné : ${animal}
Mots-clés SEO à intégrer naturellement : ${motsCles.join(', ')}
${contextLines ? `\nContexte :\n${contextLines}\n` : ''}${metaDesc ? `Meta description cible (155 chars max) : ${metaDesc}\n` : ''}
${produitSection}
${relatedArticles.length ? `Articles récents ${animal} — intègre 1-2 liens internes si pertinent :\n${relatedArticles.map(a => `- [${a.title}](https://mespoilus.com/blog/${a.slug})`).join('\n')}\n` : ''}
STRUCTURE OBLIGATOIRE :
1. Introduction accrocheuse (2-3 phrases qui parlent directement au propriétaire)
2. 3 à 4 sections avec titres H2 clairs et informatifs
3. Conclusion avec un appel à l'action vers mespoilus.com/boutique ou mespoilus.com/adoption selon le sujet

CONSIGNES :
- Entre 550 et 700 mots au total
- Ton chaleureux, bienveillant, comme un ami expert
- Public : propriétaires francophones (Belgique, France, Suisse, Canada)
- Intègre au moins un lien interne : [notre boutique](https://mespoilus.com/boutique) ou [nos annonces d'adoption](https://mespoilus.com/adoption)
- Ne jamais inventer de faits médicaux ou vétérinaires sans nuance`;

    const marieResult = await executeAgentTask('marie', mariePrompt);
    pipelineTokens += marieResult.tokens_used ?? 0;
    if (!marieResult.success) throw new Error(marieResult.error ?? 'Marie a échoué');

    // Vérification longueur de l'article (hors frontmatter)
    const fmEnd = marieResult.content.indexOf('---', 3);
    const bodyForCount = fmEnd > -1 ? marieResult.content.slice(fmEnd + 3) : marieResult.content;
    const wordCount = bodyForCount.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 350) console.warn(`[Cron1] Article court: ${wordCount} mots (cible: 550-700)`);
    else console.log(`[Cron1] Article: ~${wordCount} mots ✓`);

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

    // Sauvegarder le partenaire mis en avant (requiert migration_featured_partner.sql)
    if (nomProduit && articleSlug) {
      try {
        await supabase.from('articles').update({ featured_partner: nomProduit }).eq('slug', articleSlug);
      } catch { /* migration non encore appliquée — pas de blocage */ }
    }

    // Temps de lecture calculé depuis le vrai nombre de mots (250 mots/min)
    if (articleSlug && wordCount > 0) {
      try {
        await supabase.from('articles')
          .update({ reading_time: Math.max(1, Math.ceil(wordCount / 250)) })
          .eq('slug', articleSlug);
      } catch { /* non-bloquant */ }
    }

    // ─── IMAGE : télécharger pour l'animal + stocker dans Supabase Storage ───
    let imageUrl: string | null = null;
    if (articleSlug) {
      try {
        // Vérifier si l'article a déjà une image (runner.ts peut l'avoir ajoutée)
        const { data: imgCheck } = await supabase
          .from('articles').select('image_url').eq('slug', articleSlug).maybeSingle();
        imageUrl = imgCheck?.image_url ?? null;

        if (!imageUrl) {
          if (imageProduit) {
            // Image du produit Awin — on la télécharge et stocke dans Supabase Storage
            console.log(`[Cron1] Image: produit Awin "${nomProduit}"...`);
            const stored = await Promise.race([
              downloadAndStorePhoto(imageProduit, `article-${articleSlug}.jpg`),
              new Promise<null>(r => setTimeout(() => r(null), 5000)),
            ]);
            imageUrl = stored ?? imageProduit;
            await supabase.from('articles').update({ image_url: imageUrl }).eq('slug', articleSlug);
            console.log('[Cron1] Image produit:', stored ? 'stockée Supabase ✅' : 'URL directe');
          } else {
            console.log(`[Cron1] Image: téléchargement Pexels pour catégorie "${animal}"...`);
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
              console.log('[Cron1] Image Pexels:', stored ? 'stockée Supabase ✅' : 'URL directe');
            } else {
              console.log('[Cron1] Image: Pexels indisponible (clé absente ou timeout)');
            }
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

  await logActivity('thomas', 'Thomas',
    `[Cron blog] terminé — ${articleSlug || 'échec'}`,
    errors.length === 0 ? 'success' : 'error',
    totalDuration,
    { slug: articleSlug, animal, season, errors },
    pipelineTokens
  );

  console.log(`[Cron1] Terminé en ${totalDuration}ms — slug=${articleSlug}`);

  return NextResponse.json({
    success: !!articleSlug,
    duration_ms: totalDuration,
    animal, season, sujet, article_slug: articleSlug,
    ...(errors.length ? { errors } : {}),
  });
}
