import type { SupabaseClient } from '@supabase/supabase-js';
import type { Article } from '@/types';

// Colonnes utiles aux cartes de la liste du blog. Le texte complet (`content`) n'est chargé
// que pour l'article "À la une" (teaser), via withFeaturedContent : les listes affichent
// tous les articles publiés, inutile d'envoyer le contenu de chacun au navigateur.
export const ARTICLE_CARD_COLUMNS =
  'id, slug, title, excerpt, category, categories, image_url, image_alt, image_credit, image_credit_url, published_at, reading_time, seo_keywords';

export async function withFeaturedContent(supabase: SupabaseClient, rows: unknown[] | null): Promise<Article[]> {
  const articles = ((rows ?? []) as Article[]).map((a) => ({ ...a, content: '' }));
  if (articles.length === 0) return articles;
  const { data } = await supabase.from('articles').select('content').eq('id', articles[0].id).single();
  articles[0].content = (data?.content as string | undefined) ?? '';
  return articles;
}
