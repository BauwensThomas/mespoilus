import type { SupabaseClient } from '@supabase/supabase-js';
import { applySearch, searchPatterns } from '@/lib/search';

/**
 * Recherche d'articles : d'abord titre + résumé (colonne title_search), puis le texte complet
 * seulement si rien n'est trouvé, pour ne pas noyer les bons résultats.
 * `base` reconstruit la requête filtrée (statut, catégorie, tri) : un builder ne sert qu'une fois.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchArticles(supabase: SupabaseClient<any, any, any>, base: () => any, search: string): Promise<unknown[]> {
  const patterns = searchPatterns(search);
  if (patterns.length === 0) return [];
  const { data, error } = await applySearch(base(), 'title_search', search);
  if (error) throw error;
  if (data && data.length > 0) return data;

  const { data: ids, error: rpcError } = await supabase.rpc('search_article_content', { p_patterns: patterns });
  if (rpcError) throw rpcError;
  if (!ids || ids.length === 0) return [];
  const { data: inContent } = await base().in('id', ids);
  return inContent ?? [];
}
