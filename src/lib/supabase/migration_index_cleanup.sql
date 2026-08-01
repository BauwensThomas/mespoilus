-- Nettoyage des index signalés "unused_index" par le Supabase Performance Advisor
-- Vérifié contre le code applicatif (src/) avant toute suppression : cf. CONTEXT.md

-- ============================================================
-- 1) Index vraiment morts : aucune requête applicative ne filtre/trie
--    sur ces colonnes (confirmé par grep sur src/)
-- ============================================================
DROP INDEX IF EXISTS public.idx_clicks_merchant;        -- affiliate_clicks.merchant jamais lu
DROP INDEX IF EXISTS public.idx_clicks_date;             -- affiliate_clicks.clicked_at jamais lu
DROP INDEX IF EXISTS public.idx_security_logs_ip;        -- security_logs.ip_address jamais filtré (le blocage IP lit blocked_ips, autre table)
DROP INDEX IF EXISTS public.idx_pdf_downloads_email;     -- pdf_downloads lu uniquement par token, jamais par email
DROP INDEX IF EXISTS public.idx_catalog_brand;           -- brand affiché mais jamais filtré/trié
DROP INDEX IF EXISTS public.idx_catalog_search;          -- GIN sur search_vector : aucun .textSearch()/@@ utilisé, la recherche boutique passe par ilike(name_search)
DROP INDEX IF EXISTS public.idx_price_history_date;      -- product_price_history jamais lu par le code applicatif

-- ============================================================
-- 2) Index mal typés : la requête existe bien (ilike '%...%') mais un
--    btree ne peut pas servir un ILIKE avec wildcard en tête -> l'advisor
--    les voit "unused" alors qu'ils sont juste inefficaces. On les
--    remplace par un index trigram (GIN + pg_trgm), le bon outil pour ILIKE.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS public.idx_breeds_name_search;
CREATE INDEX idx_breeds_name_search ON public.breeds USING gin (name_search gin_trgm_ops);

DROP INDEX IF EXISTS public.idx_catalog_name_search;
CREATE INDEX idx_catalog_name_search ON public.products_catalog USING gin (name_search gin_trgm_ops);

DROP INDEX IF EXISTS public.idx_articles_title_search;
CREATE INDEX idx_articles_title_search ON public.articles USING gin (title_search gin_trgm_ops);

DROP INDEX IF EXISTS public.idx_adoption_search_text;
CREATE INDEX idx_adoption_search_text ON public.adoption_posts USING gin (search_text gin_trgm_ops);

-- ============================================================
-- Conservés tels quels (utilisation réelle confirmée dans le code, juste
-- peu de trafic actuellement) : idx_catalog_product_type, idx_adoption_created_at,
-- idx_adoption_posts_deleted_at, idx_pixel_grilles_statut_ordre
-- ============================================================
