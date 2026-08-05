import { createAdminClient } from '@/lib/supabase/server';

export interface MetaOverride {
  title?: string;
  description?: string;
}

/**
 * Surcharge de métadonnées pour les pages sans champ éditable natif
 * (boutique produits, pages statiques). `path` = chemin exact (ex: '/boutique/uuid', '/adoption').
 */
export async function getMetaOverride(path: string): Promise<MetaOverride | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('seo_meta_overrides')
    .select('title, meta_description')
    .eq('url_path', path)
    .maybeSingle();

  if (!data || (!data.title && !data.meta_description)) return null;
  return {
    ...(data.title ? { title: data.title } : {}),
    ...(data.meta_description ? { description: data.meta_description } : {}),
  };
}
