import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { getIndexableRacePaths } from '@/lib/breed-indexing';

export const revalidate = 86400;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

// Validez et nettoyez les URLs pour le sitemap XML
function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  try {
    // Vérifier que c'est une URL valide
    new URL(url);
    // Vérifier qu'elle ne contient pas de caractères interdits en XML
    if (/<|>|&(?!(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);)/.test(url)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}

// Valider les entrées du sitemap
function isValidSitemapEntry(entry: any): boolean {
  if (!entry?.url) return false;
  try {
    new URL(entry.url);
    return true;
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articleEntries: MetadataRoute.Sitemap = [];
  let guideEntries: MetadataRoute.Sitemap = [];
  let breedEntries: MetadataRoute.Sitemap = [];
  let adoptionEntries: MetadataRoute.Sitemap = [];
  // Pages de filtres races (appartement, enfants...) : même règle d'indexation que les fiches
  const { paths: indexableRacePaths } = await getIndexableRacePaths();
  // Vraies dates de dernière modification (Google ignore les lastmod d'un sitemap qui ment) :
  // listes = date du contenu le plus récent qu'elles affichent ; pages fixes = pas de lastmod.
  const latest: Record<string, Date> = {};
  const bump = (key: string, d: Date) => { if (!latest[key] || d > latest[key]) latest[key] = d; };

  try {
    const supabase = createAdminClient();
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, category, published_at, updated_at, image_url')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    for (const a of articles ?? []) {
      if (!a.published_at) continue;
      const d = new Date(a.published_at);
      bump('blog', d);
      if (a.category) bump(`blog/${a.category}`, d);
    }

    articleEntries = (articles ?? [])
      .filter(article => article.slug)
      .map((article) => ({
        url: `${APP_URL}/blog/${encodeURIComponent(article.slug)}`,
        lastModified: new Date(article.updated_at ?? article.published_at ?? Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        ...(article.image_url && sanitizeUrl(article.image_url) ? { images: [sanitizeUrl(article.image_url)] } : {}),
      }))
      .filter(isValidSitemapEntry);
  } catch {
    // Supabase unavailable - sitemap without articles
  }

  try {
    const supabase = createAdminClient();
    const { data: guides } = await supabase
      .from('pdf_guides')
      .select('slug, created_at')
      .eq('active', true);

    guideEntries = (guides ?? [])
      .filter(guide => guide.slug)
      .map((guide) => ({
        url: `${APP_URL}/guides/${encodeURIComponent(guide.slug)}`,
        lastModified: new Date(guide.created_at ?? Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))
      .filter(isValidSitemapEntry);
  } catch {
    // Supabase unavailable - sitemap without guides
  }

  try {
    const supabase = createAdminClient();
    const { data: breeds } = await supabase
      .from('breeds')
      .select('animal, slug, generated_at, photo_url')
      .eq('status', 'published')
      .not('content', 'is', null);

    const ANIMAL_KEY: Record<string, string> = { chien: 'chiens', chat: 'chats', oiseau: 'oiseaux', rongeur: 'rongeurs', reptile: 'reptiles' };
    for (const b of breeds ?? []) {
      if (!b.generated_at) continue;
      bump('races', new Date(b.generated_at));
      if (ANIMAL_KEY[b.animal]) bump(`races/${ANIMAL_KEY[b.animal]}`, new Date(b.generated_at));
    }

    const ANIMAL_URL: Record<string, string> = { chien: 'chiens', chat: 'chats', oiseau: 'oiseaux', rongeur: 'rongeurs', reptile: 'reptiles' };
    // Seules les fiches indexables (guide dédié ou impressions Google récentes) : voir breed-indexing.ts
    const { paths: racePaths, guideSlugs } = await getIndexableRacePaths();
    breedEntries = (breeds ?? [])
      .filter(b => b.slug && ANIMAL_URL[b.animal])
      .filter(b => guideSlugs.has(b.slug) || racePaths.has(`/races/${ANIMAL_URL[b.animal]}/${b.slug}`))
      .map(b => ({
        url: `${APP_URL}/races/${ANIMAL_URL[b.animal]}/${encodeURIComponent(b.slug)}`,
        lastModified: new Date(b.generated_at ?? Date.now()),
        changeFrequency: 'yearly' as const,
        priority: 0.7,
        ...(b.photo_url && sanitizeUrl(b.photo_url) ? { images: [sanitizeUrl(b.photo_url)] } : {}),
      }))
      .filter(isValidSitemapEntry);
  } catch {
    // Supabase unavailable - sitemap without breeds
  }

  try {
    const supabase = createAdminClient();
    const { data: adoptionPosts } = await supabase
      .from('adoption_posts')
      .select('id, created_at, photo_urls')
      .eq('status', 'approved');

    for (const p of adoptionPosts ?? []) if (p.created_at) bump('adoption', new Date(p.created_at));

    adoptionEntries = (adoptionPosts ?? [])
      .filter(post => post.id)
      .map((post) => ({
        url: `${APP_URL}/adoption/${encodeURIComponent(String(post.id))}`,
        lastModified: new Date(post.created_at ?? Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        ...(post.photo_urls?.[0] && sanitizeUrl(post.photo_urls[0]) ? { images: [sanitizeUrl(post.photo_urls[0])] } : {}),
      }))
      .filter(isValidSitemapEntry);
  } catch {
    // Supabase unavailable - sitemap without adoption posts
  }

  return [
    { url: `${APP_URL}/`,         ...(latest['blog'] ? { lastModified: latest['blog'] } : {}), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${APP_URL}/blog`,          ...(latest['blog'] ? { lastModified: latest['blog'] } : {}), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${APP_URL}/guides`,        changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${APP_URL}/blog/chiens`,   ...(latest['blog/chiens'] ? { lastModified: latest['blog/chiens'] } : {}), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/blog/chats`,    ...(latest['blog/chats'] ? { lastModified: latest['blog/chats'] } : {}), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/blog/oiseaux`,  ...(latest['blog/oiseaux'] ? { lastModified: latest['blog/oiseaux'] } : {}), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/blog/rongeurs`, ...(latest['blog/rongeurs'] ? { lastModified: latest['blog/rongeurs'] } : {}), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/blog/general`,  ...(latest['blog/general'] ? { lastModified: latest['blog/general'] } : {}), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${APP_URL}/blog/reptiles`, ...(latest['blog/reptiles'] ? { lastModified: latest['blog/reptiles'] } : {}), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/adoption`, ...(latest['adoption'] ? { lastModified: latest['adoption'] } : {}), changeFrequency: 'daily' as const,  priority: 0.8 },
    { url: `${APP_URL}/boutique`, changeFrequency: 'daily' as const,  priority: 0.8 },
    { url: `${APP_URL}/grille`,   changeFrequency: 'daily' as const,  priority: 0.8 },
    { url: `${APP_URL}/grilles`,  changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${APP_URL}/outils/age`,       changeFrequency: 'yearly' as const, priority: 0.7 },
    { url: `${APP_URL}/outils/nutrition`, changeFrequency: 'yearly' as const, priority: 0.7 },
    { url: `${APP_URL}/outils/prenom`,    changeFrequency: 'yearly' as const, priority: 0.7 },
    { url: `${APP_URL}/outils/quiz`,      changeFrequency: 'yearly' as const, priority: 0.7 },
    { url: `${APP_URL}/races`,          ...(latest['races'] ? { lastModified: latest['races'] } : {}), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${APP_URL}/races/chiens`,   ...(latest['races/chiens'] ? { lastModified: latest['races/chiens'] } : {}), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${APP_URL}/races/chats`,    ...(latest['races/chats'] ? { lastModified: latest['races/chats'] } : {}), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${APP_URL}/races/oiseaux`,  ...(latest['races/oiseaux'] ? { lastModified: latest['races/oiseaux'] } : {}), changeFrequency: 'weekly' as const,  priority: 0.7 },
    { url: `${APP_URL}/races/rongeurs`, ...(latest['races/rongeurs'] ? { lastModified: latest['races/rongeurs'] } : {}), changeFrequency: 'weekly' as const,  priority: 0.7 },
    { url: `${APP_URL}/races/reptiles`, ...(latest['races/reptiles'] ? { lastModified: latest['races/reptiles'] } : {}), changeFrequency: 'weekly' as const,  priority: 0.7 },
    ...(['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'] as const).flatMap(animal =>
      (['appartement', 'enfants', 'debutants', 'seniors'] as const)
        .filter(critere => indexableRacePaths.has(`/races/${animal}/${critere}`))
        .map(critere => ({
        url: `${APP_URL}/races/${animal}/${critere}`,
        ...(latest[`races/${animal}`] ? { lastModified: latest[`races/${animal}`] } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    ),
    { url: `${APP_URL}/a-propos`,                  changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${APP_URL}/mentions-legales`,          changeFrequency: 'yearly' as const,  priority: 0.3 },
    { url: `${APP_URL}/politique-confidentialite`, changeFrequency: 'yearly' as const,  priority: 0.3 },
    { url: `${APP_URL}/cgu`,     changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${APP_URL}/cookies`, changeFrequency: 'yearly' as const, priority: 0.3 },
    ...articleEntries.filter(isValidSitemapEntry),
    ...guideEntries.filter(isValidSitemapEntry),
    ...breedEntries.filter(isValidSitemapEntry),
    ...adoptionEntries.filter(isValidSitemapEntry),
  ];
}
