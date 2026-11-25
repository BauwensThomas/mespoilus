-- Recherche dans le TEXTE des articles publiés (25/11/2026), utilisée seulement quand le titre et le
-- résumé ne donnent rien. Motifs fournis par searchPatterns() (src/lib/search.ts), combinés en ET.
-- Pas de colonne générée : environ 106 articles, un parcours suffit et le contenu n'est pas dupliqué.

CREATE OR REPLACE FUNCTION public.search_article_content(p_patterns text[])
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT a.id
  FROM public.articles a
  WHERE a.status = 'published'
    AND cardinality(p_patterns) > 0
    AND NOT EXISTS (
      SELECT 1 FROM unnest(p_patterns) AS p
      WHERE public.unaccent_immutable(lower(COALESCE(a.content, ''))) !~ p
    );
$function$;

REVOKE ALL ON FUNCTION public.search_article_content(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_article_content(text[]) TO service_role;
