import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/server';

export const revalidate = 86400;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articleEntries: MetadataRoute.Sitemap = [];
  let guideEntries: MetadataRoute.Sitemap = [];
  let breedEntries: MetadataRoute.Sitemap = [];
  let adoptionEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = createAdminClient();
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at, image_url')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    articleEntries = (articles ?? []).map((article) => ({
      url: `${APP_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at ?? article.published_at ?? Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      ...(article.image_url ? { images: [article.image_url] } : {}),
    }));
  } catch {
    // Supabase unavailable - sitemap without articles
  }

  try {
    const supabase = createAdminClient();
    const { data: guides } = await supabase
      .from('pdf_guides')
      .select('slug, created_at')
      .eq('active', true);

    guideEntries = (guides ?? []).map((guide) => ({
      url: `${APP_URL}/guides/${guide.slug}`,
      lastModified: new Date(guide.created_at ?? Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
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

    const ANIMAL_URL: Record<string, string> = { chien: 'chiens', chat: 'chats', oiseau: 'oiseaux', rongeur: 'rongeurs', reptile: 'reptiles' };
    breedEntries = (breeds ?? []).map(b => ({
      url: `${APP_URL}/races/${ANIMAL_URL[b.animal] ?? b.animal}/${b.slug}`,
      lastModified: new Date(b.generated_at ?? Date.now()),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
      ...(b.photo_url ? { images: [b.photo_url] } : {}),
    }));
  } catch {
    // Supabase unavailable - sitemap without breeds
  }

  try {
    const supabase = createAdminClient();
    const { data: adoptionPosts } = await supabase
      .from('adoption_posts')
      .select('id, created_at, photo_urls')
      .eq('status', 'approved');

    adoptionEntries = (adoptionPosts ?? []).map((post) => ({
      url: `${APP_URL}/adoption/${post.id}`,
      lastModified: new Date(post.created_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      ...(post.photo_urls?.[0] ? { images: [post.photo_urls[0]] } : {}),
    }));
  } catch {
    // Supabase unavailable - sitemap without adoption posts
  }

  return [
    { url: `${APP_URL}/`,         lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${APP_URL}/blog`,          lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/guides`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${APP_URL}/blog/chiens`,   lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/blog/chats`,    lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/blog/oiseaux`,  lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/blog/rongeurs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/blog/reptiles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/adoption`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${APP_URL}/boutique`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${APP_URL}/outils/age`,       lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: `${APP_URL}/outils/nutrition`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: `${APP_URL}/outils/prenom`,    lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: `${APP_URL}/outils/quiz`,      lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: `${APP_URL}/races`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${APP_URL}/races/chiens`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${APP_URL}/races/chats`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${APP_URL}/races/oiseaux`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/races/rongeurs`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/races/reptiles`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    ...(['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'] as const).flatMap(animal =>
      (['appartement', 'enfants', 'debutants', 'seniors'] as const).map(critere => ({
        url: `${APP_URL}/races/${animal}/${critere}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    ),
    { url: `${APP_URL}/adoption/deposer`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/a-propos`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/mentions-legales`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/politique-confidentialite`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/cgu`,     lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...articleEntries,
    ...guideEntries,
    ...breedEntries,
    ...adoptionEntries,
  ];
}
