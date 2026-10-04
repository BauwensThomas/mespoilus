import { createAdminClient } from '@/lib/supabase/server';

type SupabaseClient = ReturnType<typeof createAdminClient>;

export async function buildEnrichedPrompt(
  agentId: string,
  baseTask: string,
  supabase: SupabaseClient
): Promise<string> {
  try {
    if (agentId === 'antoine') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const lastMonthName = startOfLastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      const [articlesRes, socialRes, statsRes, monthlyLogsRes, lastMonthLogsRes, monthlyArticlesRes] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('social_posts').select('id', { count: 'exact', head: true }),
        supabase.from('agent_stats').select('agent_id, tasks_completed, total_tokens_used'),
        supabase.from('activity_logs').select('status, tokens_used').gte('created_at', startOfMonth.toISOString()),
        supabase.from('activity_logs').select('status, tokens_used').gte('created_at', startOfLastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString()),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', startOfMonth.toISOString()),
      ]);

      const articleCount = articlesRes.count ?? 0;
      const postCount = socialRes.count ?? 0;
      const stats = (statsRes.data ?? []) as Array<{ agent_id: string; tasks_completed: number; total_tokens_used: number }>;
      const totalTokens = stats.reduce((s, r) => s + (r.total_tokens_used ?? 0), 0);
      const totalTasks = stats.reduce((s, r) => s + (r.tasks_completed ?? 0), 0);

      // Stats mois courant
      const monthlyLogs = monthlyLogsRes.data ?? [];
      const monthlyTasks = monthlyLogs.filter((r: { status: string }) => r.status === 'success').length;
      const monthlyTokens = monthlyLogs.reduce((s: number, r: { tokens_used: number | null }) => s + (r.tokens_used ?? 0), 0);
      const monthlyCost = ((monthlyTokens / 1_000_000) * 3).toFixed(2);
      const monthlyArticles = monthlyArticlesRes.count ?? 0;

      // Stats mois précédent
      const lastMonthLogs = lastMonthLogsRes.data ?? [];
      const lastMonthTasks = lastMonthLogs.filter((r: { status: string }) => r.status === 'success').length;
      const lastMonthTokens = lastMonthLogs.reduce((s: number, r: { tokens_used: number | null }) => s + (r.tokens_used ?? 0), 0);
      const lastMonthCost = ((lastMonthTokens / 1_000_000) * 3).toFixed(2);

      const totalCostEur = ((totalTokens / 1_000_000) * 3).toFixed(2);
      const tokenTrend = lastMonthTokens > 0
        ? ((monthlyTokens - lastMonthTokens) / lastMonthTokens * 100).toFixed(0)
        : null;

      return `${baseTask}

Données réelles du système :

-Total depuis le début -
- Articles publiés : ${articleCount}
- Posts réseaux sociaux : ${postCount}
- Tâches agents total : ${totalTasks}
- Tokens IA total : ${totalTokens.toLocaleString('fr-FR')}
- Coût API total estimé : ~${totalCostEur} €

-${monthName} (mois en cours) -
- Articles publiés ce mois : ${monthlyArticles}
- Tâches complétées ce mois : ${monthlyTasks}
- Tokens consommés ce mois : ${monthlyTokens.toLocaleString('fr-FR')}
- Coût API ce mois : ~${monthlyCost} €

-${lastMonthName} (mois précédent) -
- Tâches complétées : ${lastMonthTasks}
- Tokens consommés : ${lastMonthTokens.toLocaleString('fr-FR')}
- Coût API : ~${lastMonthCost} €
${tokenTrend !== null ? `- Évolution tokens vs mois précédent : ${Number(tokenTrend) >= 0 ? '+' : ''}${tokenTrend}%` : ''}

-Dépenses fixes mensuelles -
- Supabase : ~25 €/mois
- Vercel : ~20 €/mois
- API Anthropic : variable (~${monthlyCost} € ce mois)
- Sources de revenus actives : blog (SEO/affiliation), réseaux sociaux (trafic)

Base tes analyses et recommandations sur ces chiffres réels mois par mois.`;
    }

    if (agentId === 'nathalie') {
      // On exclut les artefacts d'audit ('Audit Report' + ancien 'Security Analysis') :
      // ce sont les rapports de Nathalie, pas de vraies attaques (évite la boucle de fausse alerte).
      const AUDIT_ARTIFACTS = '("Audit Report","Security Analysis")';
      const [logsRes, blockedRes, recentRes] = await Promise.all([
        supabase.from('security_logs').select('id', { count: 'exact', head: true })
          .not('threat_type', 'in', AUDIT_ARTIFACTS),
        supabase.from('blocked_ips').select('id', { count: 'exact', head: true }),
        supabase.from('security_logs')
          .select('threat_level, threat_type, created_at')
          .not('threat_type', 'in', AUDIT_ARTIFACTS)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      const totalLogs = logsRes.count ?? 0;
      const totalBlocked = blockedRes.count ?? 0;
      const recent = (recentRes.data ?? []) as Array<{ threat_level: string; threat_type: string; created_at: string }>;
      const recentStr = recent.length
        ? recent.map((r) => `- [${r.threat_level.toUpperCase()}] ${r.threat_type} (${new Date(r.created_at).toLocaleDateString('fr-FR')})`).join('\n')
        : '- Aucun incident récent';

      return `${baseTask}

Date du jour : ${new Date().toLocaleDateString('fr-FR')} (utilise cette date dans l'en-tête du rapport, n'en invente pas d'autre).

État de sécurité actuel :
- Incidents enregistrés total : ${totalLogs}
- IPs bloquées : ${totalBlocked}
- 5 derniers incidents :
${recentStr}

Mesures de sécurité déjà en place (NE PAS les signaler comme manquantes) :
- Stack : Next.js 15.5 (14 CVE résolus lors de l'upgrade mai 2026) — NE PAS mentionner "Next.js 14"
- Middleware Edge actif : rate limiting (60 req/min global, 10/min par agent), détection SQLi/XSS/path traversal, blocage IP automatique (mémoire 5min + Redis 24h/30j + table blocked_ips)
- Toutes les routes /api/cron/* protégées par Bearer CRON_SECRET
- Toutes les routes /api/internal/* protégées par header x-internal-secret
- RLS activé sur les 33 tables Supabase (articles et products avec policies publiques, toutes les autres bloquées pour anon)
- Headers HTTP de sécurité configurés dans next.config.mjs : CSP, X-Frame-Options (SAMEORIGIN), X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- X-Powered-By supprimé (poweredByHeader: false)
- Monitoring erreurs Sentry actif (toutes erreurs client + serveur + edge capturées, alertes email sur nouvelles issues)
- Budget cap API Anthropic fixé à 20 €/mois
- Blocage IP global : toutes les routes du site rejettent les IPs bloquées en 403 (via Redis cache + Supabase)
- Secrets dans Vercel Environment Variables uniquement (pas dans le repo) — .gitignore inclut .env.local et .env*.local
- CSRF : 'generateCSRFToken()' disponible dans src/lib/security.ts — les mutations API sont protégées par Supabase Auth (session cookie httpOnly) et par les headers x-internal-secret/CRON_SECRET selon la route
- Les entrées "Security Analysis" dans security_logs sont LES PROPRES RAPPORTS DE NATHALIE des crons précédents, pas de vraies attaques — elles sont filtrées automatiquement dans le contexte (AUDIT_ARTIFACTS). NE PAS les signaler comme un bug de logging.
- Dependabot activé (01/08/2026) : alertes de vulnérabilité + PR de correctifs de sécurité automatiques (repo GitHub, en plus de dependabot.yml qui gère déjà les mises à jour mineures/patch groupées)
- Variables NEXT_PUBLIC_ auditées le 04/10/2026 : uniquement des valeurs publiques par conception (URL + anon key Supabase, clé publishable Stripe, clé + map ID Google Maps, URLs du site, flags AdSense/grille). Aucun secret préfixé NEXT_PUBLIC_.
- Storage Supabase audité le 04/10/2026 : buckets privés = pdf-guides, pixel-grilles, grille-backups ; buckets publics volontaires (contenu destiné à être affiché sur le site) = blog-images, hero-photos, partner-logos, social, adoption-photos (photos d'annonces d'adoption, nom de fichier UUID non devinable). Aucun document personnel privé en bucket public.
- Appels API Anthropic exclusivement server-side (src/lib/anthropic.ts + routes /api/cron/*), jamais dans un composant client — vérifié, pas de fuite de clé possible côté bundle JS

Décisions déjà prises, à ne PAS re-proposer chaque mois (projet solo, faible trafic) :
- Rotation planifiée des secrets (registre, cadence 90j) : non pertinent pour un projet solo sans turnover d'équipe ni accès partagé
- Endpoint de rapport CSP (report-to) : décidé non prioritaire tant que le trafic reste quasi nul
- Fichier security.txt (RFC 9116) : décidé non prioritaire, site à faible visibilité, peu de chances qu'un chercheur en sécurité le consulte
Si l'un de ces éléments redevient pertinent (trafic significatif, ajout d'un collaborateur), le signaler comme "à reconsidérer", pas comme un manque.

Concentre-toi uniquement sur ce qui manque réellement et n'a jamais été évalué. Ne répète pas ce qui est déjà en place ou déjà écarté ci-dessus.`;
    }

    if (agentId === 'lucas') {
      const { data: recent } = await supabase
        .from('articles')
        .select('title, category')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(15);
      const recentTitles =
        (recent ?? []).map((a: { title: string }) => `- ${a.title}`).join('\n') || '- Aucun article récent';

      return `${baseTask}

Articles déjà publiés (à ne pas dupliquer) :
${recentTitles}

Fournis une analyse SEO complète avec mots-clés, volumes estimés par marché (BE/FR/CH/CA) et recommandations on-page.`;
    }

    if (agentId === 'emma') {
      const { data: lastArticle } = await supabase
        .from('articles')
        .select('title, slug, excerpt')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (lastArticle) {
        return `${baseTask}

Dernier article publié sur Mes Poilus :
- Titre : ${lastArticle.title}
- Lien : https://mespoilus.com/blog/${lastArticle.slug}
- Résumé : ${lastArticle.excerpt ?? ''}

Crée un post Facebook et Instagram engageant basé sur cet article.`;
      }
    }

    if (agentId === 'sofia') {
      const { data: recent } = await supabase
        .from('articles')
        .select('title, slug, excerpt, image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      const articles = (recent ?? []) as Array<{ title: string; slug: string; excerpt: string | null; image_url: string | null; published_at: string }>;
      const articlesStr = articles.length
        ? articles.map((a) =>
            `- ${a.title}\n  Lien : https://mespoilus.com/blog/${a.slug}\n  Résumé : ${a.excerpt ?? ''}${a.image_url ? `\n  Image : ${a.image_url}` : ''}`
          ).join('\n\n')
        : '- Aucun article récent';

      const currentYear = new Date().getFullYear();

      return `${baseTask}

Voici les 3 derniers articles publiés sur Mes Poilus :

${articlesStr}

Année actuelle : ${currentYear} (utilise cette année dans le footer copyright).

Génère la newsletter en te basant sur ces articles. Format JSON requis : { "subject": "...", "preview_text": "...", "content_html": "..." }`;
    }

    if (agentId === 'maxime') {
      // Fenêtre de 30 jours : sans elle, l'audit mensuel ressortait des erreurs vieilles
      // de plusieurs semaines (déjà résolues) comme si elles étaient actives.
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [errorRes, activityRes] = await Promise.all([
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('status', 'error').gte('created_at', since),
        supabase
          .from('activity_logs')
          .select('agent_id, action, status, duration_ms, created_at')
          .eq('status', 'error')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      const errorCount = errorRes.count ?? 0;
      const errors = (activityRes.data ?? []) as Array<{ agent_id: string; action: string; duration_ms: number; created_at: string }>;
      const errorsStr = errors.length
        ? errors.map((e) => `- ${new Date(e.created_at).toLocaleDateString('fr-FR')} [${e.agent_id}] ${e.action.slice(0, 80)}${e.duration_ms != null ? ` (${e.duration_ms}ms)` : ''}`).join('\n')
        : '- Aucune erreur sur les 30 derniers jours';

      return `${baseTask}

Date du jour : ${new Date().toLocaleDateString('fr-FR')} (utilise cette date dans l'en-tête du rapport, n'en invente pas d'autre).

État technique actuel (30 derniers jours uniquement) :
- Erreurs dans les logs : ${errorCount}
- Dernières erreurs :
${errorsStr}
Si aucune erreur n'est listée, dis-le simplement : ne reprends pas d'erreurs d'anciens audits.
- Les durées "Cron races : génération fiches" correspondent à un run complet (toutes les races du batch), pas à une seule fiche.

Architecture et mesures déjà en place (NE PAS les signaler comme manquantes ou à corriger) :
- Stack : Next.js 15.5 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL), API Anthropic, Vercel Hobby
- Agents IA en streaming via /api/internal/save-agent-data (timeout propre, évite les limites Vercel)
- maxDuration configurés par route : 60s (routes simples), 120s (blog/newsletter), 300s (security, prenoms, breeds)
- Vercel Hobby : 1-300s de maxDuration autorisé (confirmé dans Project Settings)
- Monitoring erreurs Sentry actif (traces, profiling, logs console capturés)
- maxTokens Nathalie : 8000, maxTokens Maxime : 8000 (configurés dans config.ts — NE PAS signaler comme trop bas)
- Timeout SDK Anthropic : 270 000ms explicite dans src/lib/anthropic.ts (NE PAS signaler les timeouts 74s comme un bug à corriger — c'est le temps normal des gros audits)
- Route catalog-sync/translate : duration_ms enregistré dans activity_logs (corrigé 01/07/2026)
- Il n'existe PAS de route /api/agents/security/legitimacy-check — les temps longs (>50s) sur "vérifier légitimité" sont des tâches manuelles via la page agent Nathalie, durée normale pour Sonnet 4.6
- Le sync catalogue (chats/chiens/etc.) est dans src/app/api/cron/catalog-sync/catalog-sync-helper.ts (PAS catalog-sync/[species]/route.ts, ce fichier n'existe pas). Son insert dans activity_logs n'a jamais inclus duration_ms — un "(nullms)" pouvant apparaître dans les erreurs ci-dessus vient du template de CE prompt (interpolation de duration_ms), pas d'un console.log applicatif. Corrigé le 01/08/2026 (l'absence de durée est maintenant omise plutôt qu'affichée "null"). NE PLUS proposer performance.now()/finally dans ce fichier pour ce motif.

Concentre-toi uniquement sur les vraies erreurs dans les logs et les problèmes de performance réels. Ne propose pas de refactoring ou d'architectures déjà en place.`;
    }
  } catch { /* non-bloquant */ }

  return baseTask;
}
