import { NextRequest, NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase/server';
import { getPhotoForCategory } from '@/lib/pexels';
import { downloadAndStorePhoto } from '@/lib/unsplash-storage';
import { buildEnrichedPrompt } from '@/lib/agents/context';

export const runtime = 'nodejs';
export const maxDuration = 300; // pipeline complet (Thomas→Lucas→Marie→image→Emma→synthèse) : 120s trop court

const CATEGORY_KEYWORDS: Array<[string, string]> = [
  ['chien', 'chiens'], ['chiens', 'chiens'],
  ['chat', 'chats'], ['chats', 'chats'],
  ['oiseau', 'oiseaux'], ['oiseaux', 'oiseaux'],
  ['rongeur', 'rongeurs'], ['rongeurs', 'rongeurs'],
  ['lapin', 'rongeurs'], ['hamster', 'rongeurs'],
  ['reptile', 'reptiles'], ['reptiles', 'reptiles'],
  ['serpent', 'reptiles'], ['lézard', 'reptiles'],
];

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, val] of CATEGORY_KEYWORDS) {
    if (lower.includes(key)) return val;
  }
  return 'general';
}

interface OrchestrationPlan {
  strategy: string;
  tasks: Array<{ agent: string; task: string; priority: number }>;
}

type AgentResult = { agent: string; success: boolean; content: string; priority: number };

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = await checkRateLimit(`orchestrate:${ip}`, 60_000, 3);

  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes d'orchestration. Maximum 3 par minute." },
      { status: 429 }
    );
  }

  let body: { objective?: string; overrideImageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const rawObjective = body.objective ?? '';
  if (!rawObjective.trim()) {
    return NextResponse.json({ error: "L'objectif ne peut pas être vide" }, { status: 400 });
  }

  const objective = sanitizeInput(rawObjective);
  const overrideImageUrl = body.overrideImageUrl?.trim() || undefined;
  const supabase = createAdminClient();

  try {
    // ── Étape 1 : Thomas crée le plan ──────────────────────────────────────
    const planResult = await executeAgentTask(
      'thomas',
      `Objectif reçu : "${objective}"

Tu dois créer un plan d'orchestration structuré. Réponds UNIQUEMENT avec un JSON valide dans ce format :
{
  "strategy": "Description de la stratégie globale",
  "tasks": [
    { "agent": "marie", "task": "Tâche précise pour Marie", "priority": 1 },
    { "agent": "emma", "task": "Tâche précise pour Emma", "priority": 2 }
  ]
}

Agents disponibles : marie (rédige articles blog), lucas (SEO/mots-clés), emma (posts réseaux sociaux), maxime, lea, antoine, nathalie.
Si l'objectif concerne du contenu (article, post, publication), inclure marie ET emma.
Lucas est optionnel (analyse SEO en amont de Marie).
Maximum 4 agents par orchestration. Priorité 1 = le plus urgent.`
    );

    let plan: OrchestrationPlan;
    try {
      const jsonMatch = planResult.content.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { strategy: planResult.content, tasks: [] };
    } catch {
      plan = { strategy: planResult.content, tasks: [] };
    }

    const hasMarie = plan.tasks.some((t) => t.agent === 'marie');
    const hasEmma = plan.tasks.some((t) => t.agent === 'emma');
    const category = detectCategory(objective);
    const results: AgentResult[] = [];

    if (hasMarie) {
      // ── Pipeline blog complet (Lucas → Marie → Image → Emma) ───────────

      // Lucas : SEO (toujours en amont de Marie)
      const lucasTaskDef = plan.tasks.find((t) => t.agent === 'lucas');
      const lucasPrompt =
        lucasTaskDef?.task ??
        `Trouve le meilleur sujet de conseil pratique pour les propriétaires de ${category} en ce moment.
Retourne UNIQUEMENT :
SUJET: [le sujet précis]
MOTS_CLES: [mot1, mot2, mot3, mot4, mot5]
INTENTION: [ce que cherche l'internaute]`;

      const lucasResult = await executeAgentTask('lucas', lucasPrompt);
      results.push({ agent: 'lucas', success: lucasResult.success, content: lucasResult.content, priority: 0 });

      let sujet = objective;
      let motsCles: string[] = [];
      if (lucasResult.success) {
        const subjectMatch = lucasResult.content.match(/SUJET:\s*(.+)/i);
        const keywordsMatch = lucasResult.content.match(/MOTS_CLES:\s*(.+)/i);
        sujet = subjectMatch?.[1]?.trim() ?? objective;
        motsCles = keywordsMatch?.[1]?.split(',').map((k) => k.trim()).filter(Boolean) ?? [];
      }

      // Marie : article avec frontmatter structuré
      const marieTaskDef = plan.tasks.find((t) => t.agent === 'marie');
      const mariePrompt = marieTaskDef?.task
        ? `${marieTaskDef.task}\nMots-clés SEO : ${motsCles.join(', ')}\nCatégorie : ${category}`
        : `Écris un article COMPLET de conseil pratique sur : ${sujet}

IMPORTANT - Tu DOIS respecter EXACTEMENT ce format de sortie :
---
title: [Titre accrocheur]
slug: [slug-url-friendly-sans-accents]
excerpt: [Résumé 1 phrase court]
category: ${category}
categories: ${category}
seo_keywords: [${motsCles.join(', ')}]
meta_description: [155 chars max]
reading_time: 5
---

[Ton article complet en Markdown - 800-900 mots]

Mots-clés SEO à intégrer : ${motsCles.join(', ')}
Intègre 2-3 recommandations de produits avec liens vers mespoilus.com/boutique.
Ton bienveillant et pratique, destiné aux propriétaires francophones.
Termine avec une conclusion + CTA court.`;

      const marieResult = await executeAgentTask('marie', mariePrompt);
      results.push({ agent: 'marie', success: marieResult.success, content: marieResult.content, priority: 1 });

      // Récupérer le slug depuis le contenu de Marie
      let articleSlug = '';
      let articleTitle = sujet;
      let articleExcerpt = '';

      if (marieResult.success) {
        const slugMatch = marieResult.content.match(/^slug:\s*(.+)/m);
        const titleMatch = marieResult.content.match(/^title:\s*(.+)/m);
        const excerptMatch = marieResult.content.match(/^excerpt:\s*(.+)/m);
        articleSlug = slugMatch?.[1]?.trim() ?? '';
        articleTitle = titleMatch?.[1]?.trim() ?? sujet;
        articleExcerpt = excerptMatch?.[1]?.trim() ?? '';

        // Fallback : requête DB si slug non trouvé dans le frontmatter
        if (!articleSlug) {
          await new Promise((r) => setTimeout(r, 3000));
          const { data } = await supabase
            .from('articles')
            .select('slug, title, excerpt, image_url')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data) {
            articleSlug = data.slug ?? '';
            articleTitle = data.title ?? articleTitle;
            articleExcerpt = data.excerpt ?? articleExcerpt;
          }
        }

        // Image : override si fourni, sinon Pexels
        if (articleSlug) {
          try {
            if (overrideImageUrl) {
              await supabase.from('articles').update({ image_url: overrideImageUrl }).eq('slug', articleSlug);
            } else {
              const { data: imgCheck } = await supabase
                .from('articles')
                .select('image_url')
                .eq('slug', articleSlug)
                .maybeSingle();

              if (!imgCheck?.image_url) {
                const photo = await Promise.race([
                  getPhotoForCategory(category),
                  new Promise<null>((r) => setTimeout(() => r(null), 5000)),
                ]);
                if (photo) {
                  const stored = await Promise.race([
                    downloadAndStorePhoto(photo.url, `article-${articleSlug}.jpg`),
                    new Promise<null>((r) => setTimeout(() => r(null), 5000)),
                  ]);
                  await supabase.from('articles').update({
                    image_url: stored ?? photo.url,
                    image_alt: photo.alt,
                    image_credit: photo.credit,
                    image_credit_url: photo.creditUrl,
                  }).eq('slug', articleSlug);
                }
              }
            }
          } catch { /* non-bloquant */ }

          // Sauvegarder dans cron_state en 'done' : orchestrate publie déjà Emma lui-même,
          // donc on NE met PAS 'article_ready' (sinon le cron social re-posterait le même article).
          await supabase.from('cron_state').insert({
            slug: articleSlug,
            title: articleTitle,
            excerpt: articleExcerpt,
            status: 'done',
          });
        }
      }

      // Emma : post social avec le vrai slug de l'article
      if (hasEmma) {
        if (articleSlug) {
          const emmaPrompt = `Crée un post Facebook et Instagram pour cet article :
Titre : ${articleTitle}
Résumé : ${articleExcerpt || articleTitle}

Le post doit donner envie de lire l'article.
IMPORTANT : tu dois inclure ce lien EXACT à la fin du post, sans le modifier ni le raccourcir :
https://mespoilus.com/blog/${articleSlug}`;

          const emmaResult = await executeAgentTask('emma', emmaPrompt, undefined, overrideImageUrl);
          results.push({ agent: 'emma', success: emmaResult.success, content: emmaResult.content, priority: 2 });
        } else {
          results.push({
            agent: 'emma',
            success: false,
            content: "Emma n'a pas pu poster : l'article de Marie n'a pas été sauvegardé correctement.",
            priority: 2,
          });
        }
      }

      // Autres agents du plan (pas lucas/marie/emma)
      const otherTasks = plan.tasks.filter((t) => !['lucas', 'marie', 'emma'].includes(t.agent));
      for (const t of otherTasks) {
        const enriched = await buildEnrichedPrompt(t.agent, t.task, supabase);
        try {
          const result = await executeAgentTask(t.agent as never, enriched);
          results.push({ agent: t.agent, success: result.success, content: result.content, priority: t.priority });
        } catch {
          results.push({ agent: t.agent, success: false, content: "Erreur d'exécution", priority: t.priority });
        }
      }

    } else {
      // ── Agents sans pipeline blog ──────────────────────────────────────
      const taskPromises = plan.tasks.slice(0, 4).map(async (t): Promise<AgentResult> => {
        // Emma seule
        if (t.agent === 'emma') {
          let emmaPrompt: string;

          if (overrideImageUrl) {
            // Image fournie par l'utilisateur : post libre sur l'objectif
            emmaPrompt = `${t.task}

Objectif de la campagne : ${objective}

Crée un post engageant pour Facebook et Instagram en lien avec cet objectif.
Sois chaleureux, spontané et ajoute des hashtags pertinents à la fin.
Ne mentionne pas d'image dans le texte du post.`;
          } else {
            // Pas d'image : poster à propos du dernier article publié
            const { data } = await supabase
              .from('articles')
              .select('slug, title, excerpt')
              .eq('status', 'published')
              .order('published_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!data) {
              return { agent: 'emma', success: false, content: 'Aucun article publié trouvé.', priority: t.priority };
            }
            emmaPrompt = `Crée un post Facebook et Instagram pour cet article :
Titre : ${data.title}
Résumé : ${data.excerpt || data.title}
IMPORTANT : inclure ce lien EXACT : https://mespoilus.com/blog/${data.slug}`;
          }

          const result = await executeAgentTask('emma', emmaPrompt, undefined, overrideImageUrl);
          return { agent: 'emma', success: result.success, content: result.content, priority: t.priority };
        }

        const enriched = await buildEnrichedPrompt(t.agent, t.task, supabase);
        try {
          const result = await executeAgentTask(t.agent as never, enriched);
          return { agent: t.agent, success: result.success, content: result.content, priority: t.priority };
        } catch {
          return { agent: t.agent, success: false, content: "Erreur d'exécution", priority: t.priority };
        }
      });

      results.push(...(await Promise.all(taskPromises)));
    }

    // ── Étape finale : Thomas synthétise ───────────────────────────────────
    const synthesis = await executeAgentTask(
      'thomas',
      `L'orchestration est terminée. Voici les résultats :\n\n${
        results.map((r) => `**${r.agent}** :\n${r.content.slice(0, 500)}`).join('\n\n')
      }\n\nObjectif initial : "${objective}"\n\nFais une synthèse exécutive de 200 mots maximum.`
    );

    return NextResponse.json({
      success: true,
      strategy: plan.strategy,
      results: results.map((r) => ({
        agent: r.agent,
        success: r.success,
        preview: r.content.slice(0, 300),
      })),
      synthesis: synthesis.content,
      tokensUsed: planResult.tokens_used + synthesis.tokens_used,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[orchestrate] Error:', message, error);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
