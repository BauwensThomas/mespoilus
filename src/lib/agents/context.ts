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

— Total depuis le début —
- Articles publiés : ${articleCount}
- Posts réseaux sociaux : ${postCount}
- Tâches agents total : ${totalTasks}
- Tokens IA total : ${totalTokens.toLocaleString('fr-FR')}
- Coût API total estimé : ~${totalCostEur} €

— ${monthName} (mois en cours) —
- Articles publiés ce mois : ${monthlyArticles}
- Tâches complétées ce mois : ${monthlyTasks}
- Tokens consommés ce mois : ${monthlyTokens.toLocaleString('fr-FR')}
- Coût API ce mois : ~${monthlyCost} €

— ${lastMonthName} (mois précédent) —
- Tâches complétées : ${lastMonthTasks}
- Tokens consommés : ${lastMonthTokens.toLocaleString('fr-FR')}
- Coût API : ~${lastMonthCost} €
${tokenTrend !== null ? `- Évolution tokens vs mois précédent : ${Number(tokenTrend) >= 0 ? '+' : ''}${tokenTrend}%` : ''}

— Dépenses fixes mensuelles —
- Supabase : ~25 €/mois
- Vercel : ~20 €/mois
- API Anthropic : variable (~${monthlyCost} € ce mois)
- Sources de revenus actives : blog (SEO/affiliation), réseaux sociaux (trafic)

Base tes analyses et recommandations sur ces chiffres réels mois par mois.`;
    }

    if (agentId === 'nathalie') {
      const [logsRes, blockedRes, recentRes] = await Promise.all([
        supabase.from('security_logs').select('id', { count: 'exact', head: true }),
        supabase.from('blocked_ips').select('id', { count: 'exact', head: true }),
        supabase.from('security_logs')
          .select('threat_level, threat_type, created_at')
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

État de sécurité actuel :
- Incidents enregistrés total : ${totalLogs}
- IPs bloquées : ${totalBlocked}
- 5 derniers incidents :
${recentStr}

Stack à auditer : Next.js 14, Supabase, API Anthropic, Vercel, endpoints /api/cron/* et /api/internal/*.
Fournis un audit complet et des recommandations concrètes.`;
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
      const [errorRes, activityRes] = await Promise.all([
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('status', 'error'),
        supabase
          .from('activity_logs')
          .select('agent_id, action, status, duration_ms, created_at')
          .eq('status', 'error')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      const errorCount = errorRes.count ?? 0;
      const errors = (activityRes.data ?? []) as Array<{ agent_id: string; action: string; duration_ms: number }>;
      const errorsStr = errors.length
        ? errors.map((e) => `- [${e.agent_id}] ${e.action.slice(0, 80)} (${e.duration_ms}ms)`).join('\n')
        : '- Aucune erreur récente';

      return `${baseTask}

État technique actuel :
- Erreurs dans les logs : ${errorCount}
- Dernières erreurs :
${errorsStr}

Stack : Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, API Anthropic, déployé sur Vercel.
Fournis un rapport technique avec diagnostic, impact et recommandations.`;
    }
  } catch { /* non-bloquant */ }

  return baseTask;
}
