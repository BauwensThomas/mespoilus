import { NextResponse } from 'next/server';
import { executeAgentTask } from '@/lib/agents/runner';
import { createAdminClient } from '@/lib/supabase/server';
import { AWIN_CATEGORY_SEARCH } from '@/lib/awin';

// Détermine la saison en fonction du mois courant (hémisphère nord)
function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

// Pool de sujets par saison pour diversifier le contenu
const SEASONAL_TOPICS: Record<string, string[]> = {
  printemps: [
    'Préparer son jardin pour accueillir son chien en toute sécurité',
    'Les allergies printanières chez le chat : symptômes et solutions',
    'Activités outdoor avec son chien au printemps',
    'Comment protéger son oiseau des variations de température printanières',
    'Puces et tiques : guide de prévention printanière pour tous les animaux',
    'Les plantes de printemps dangereuses pour vos animaux de compagnie',
  ],
  été: [
    'Protéger son animal de la chaleur estivale : conseils essentiels',
    'Voyager avec son chien cet été : tout ce qu\'il faut savoir',
    'Coup de chaleur chez le chat : reconnaître et agir vite',
    'Les meilleures activités aquatiques avec son chien',
    'Alimentation estivale : adapter la diète de son animal en été',
    'Garder son lapin au frais pendant les canicules',
  ],
  automne: [
    'Préparer son animal pour l\'arrivée du froid',
    'Les maladies de l\'automne chez le chien : prévention et traitement',
    'Adapter l\'alimentation de son chat en automne',
    'Les champignons d\'automne : lesquels sont dangereux pour vos animaux',
    'Manteau, veste ou combinaison pour chien : guide complet',
    'Les petits animaux en automne : rongeurs, reptiles et changement de saison',
  ],
  hiver: [
    'Comment garder son chien actif et en forme pendant l\'hiver',
    'Protéger les pattes de son chien du sel et du froid',
    'Le confort hivernal de votre chat : accessoires et astuces',
    'Chauffage et animaux : quels risques et comment les éviter',
    'Noël et animaux : les dangers cachés des fêtes de fin d\'année',
    'Alimentation enrichie pour passer l\'hiver en pleine santé',
  ],
};

// Détermine une catégorie animale à cibler (rotation par numéro de semaine)
function getWeeklyCategory(week: number): string {
  const categories = Object.keys(AWIN_CATEGORY_SEARCH);
  return categories[week % categories.length];
}

// Numéro de semaine ISO
function getISOWeek(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const season = getSeason(month);
  const week = getISOWeek(now);
  const animalCategory = getWeeklyCategory(week);

  // Récupérer les slugs des articles récents pour éviter les doublons
  let recentSlugs: string[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(20);
    recentSlugs = (data ?? []).map((a: { title: string }) => a.title);
  } catch {
    // Non-bloquant
  }

  // Choisir un sujet en fonction de la semaine (rotation)
  const topicPool = SEASONAL_TOPICS[season] ?? SEASONAL_TOPICS.printemps;
  const topic = topicPool[week % topicPool.length];

  const awinCategories = Object.keys(AWIN_CATEGORY_SEARCH).join(', ');
  const recentContext = recentSlugs.length
    ? `\n\nArticles récents à ne pas dupliquer :\n${recentSlugs.slice(0, 10).map(t => `- ${t}`).join('\n')}`
    : '';

  const task = `Rédige un article de blog complet sur le sujet suivant :

**"${topic}"**

Contexte :
- Saison actuelle : ${season} (mois ${month})
- Catégorie animale principale : ${animalCategory}
- Date de publication : ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}

Instructions spécifiques :
1. L'article doit faire entre 900 et 1400 mots, structuré avec des titres H2 et H3.
2. Intègre NATURELLEMENT 2 à 3 recommandations de produits affiliés dans le corps de l'article. Ces recommandations doivent s'intégrer dans le conseil pratique (ex: "Pour cela, un harnais adapté ou une laisse à enrouleur sont de bonnes options que vous trouverez facilement chez nos partenaires"). Les catégories de produits disponibles sont : ${awinCategories}.
3. Ne pas mentionner de marques spécifiques — parler de types de produits (harnais, gamelle, jouet, etc.).
4. L'article doit être utile, pratique et basé sur des faits vétérinaires reconnus.
5. Conclure avec un appel à l'action vers la boutique Mes Poilus ou vers d'autres articles du blog.
6. Respecter strictement le format frontmatter demandé.${recentContext}`;

  try {
    const result = await executeAgentTask('marie', task);

    return NextResponse.json({
      success: result.success,
      topic,
      season,
      animalCategory,
      tokens_used: result.tokens_used,
      duration_ms: result.duration_ms,
      ...(result.success ? {} : { error: result.error }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
