-- ============================================================
-- BOUTIQUE V2 - Migration Phase 1
-- Tables : products_catalog, product_offers, user_favorites,
--          affiliate_clicks, product_price_history
-- A exécuter dans Supabase Dashboard (SQL Editor)
-- Ne touche pas à la table products existante (boutique actuelle intacte)
--
-- RLS : toutes les tables bloquées en accès direct (USING(false))
-- Accès uniquement via service_role (createAdminClient) côté serveur
-- Service_role bypass RLS - pas d'impact sur le code.
-- ============================================================


-- ── Trigger updated_at (réutilisable) ───────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY INVOKER
   SET search_path = '';


-- ============================================================
-- 1. products_catalog - fiche produit centrale
-- ============================================================

CREATE TABLE IF NOT EXISTS products_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ean           TEXT,
  isbn          TEXT,
  name          TEXT NOT NULL,
  brand         TEXT,
  category      TEXT NOT NULL,          -- chien/chat/oiseau/rongeur/reptile/livres/general
  categories    TEXT[] DEFAULT '{}',    -- multi-catégories secondaires
  image_url     TEXT,
  description   TEXT,
  weight_g      INTEGER,                -- poids normalisé en grammes (matching)
  search_vector TSVECTOR,               -- full-text search
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Index principaux
CREATE INDEX IF NOT EXISTS idx_catalog_ean      ON products_catalog(ean)      WHERE ean IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_isbn     ON products_catalog(isbn)     WHERE isbn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_category ON products_catalog(category);
CREATE INDEX IF NOT EXISTS idx_catalog_brand    ON products_catalog(brand)    WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_status   ON products_catalog(status);
CREATE INDEX IF NOT EXISTS idx_catalog_weight   ON products_catalog(weight_g) WHERE weight_g IS NOT NULL;

-- Full-text search GIN
CREATE INDEX IF NOT EXISTS idx_catalog_search ON products_catalog USING GIN(search_vector);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_catalog_updated_at ON products_catalog;
CREATE TRIGGER trg_catalog_updated_at
  BEFORE UPDATE ON products_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger mise à jour automatique du search_vector
CREATE OR REPLACE FUNCTION products_catalog_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY INVOKER
   SET search_path = '';

DROP TRIGGER IF EXISTS trg_catalog_search_vector ON products_catalog;
CREATE TRIGGER trg_catalog_search_vector
  BEFORE INSERT OR UPDATE OF name, brand, description ON products_catalog
  FOR EACH ROW EXECUTE FUNCTION products_catalog_search_vector();

-- RLS - accès bloqué en direct, tout passe par service_role
ALTER TABLE products_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "catalog deny anon" ON products_catalog;
CREATE POLICY "catalog deny anon" ON products_catalog USING (false) WITH CHECK (false);


-- ============================================================
-- 2. product_offers - offre par marchand/source
-- ============================================================

CREATE TABLE IF NOT EXISTS product_offers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id     UUID REFERENCES products_catalog(id) ON DELETE CASCADE,
  source         TEXT NOT NULL CHECK (source IN ('awin', 'amazon', 'cj')),
  merchant_name  TEXT NOT NULL,          -- 'Zooplus FR' | 'Amazon FR' | 'CanadaPetCare'
  country        TEXT,                   -- 'fr' | 'be' | 'ca' | 'us'
  price          NUMERIC(10,2),
  currency       TEXT DEFAULT 'EUR',
  affiliate_url  TEXT NOT NULL UNIQUE,   -- lien affilié (clé fonctionnelle)
  in_stock       BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_catalog_id ON product_offers(catalog_id);
CREATE INDEX IF NOT EXISTS idx_offers_source     ON product_offers(source);
CREATE INDEX IF NOT EXISTS idx_offers_merchant   ON product_offers(merchant_name);
CREATE INDEX IF NOT EXISTS idx_offers_country    ON product_offers(country);
CREATE INDEX IF NOT EXISTS idx_offers_price      ON product_offers(price);
CREATE INDEX IF NOT EXISTS idx_offers_in_stock   ON product_offers(in_stock);
CREATE INDEX IF NOT EXISTS idx_offers_synced     ON product_offers(last_synced_at);

-- RLS - accès bloqué en direct, tout passe par service_role
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "offers deny anon" ON product_offers;
CREATE POLICY "offers deny anon" ON product_offers USING (false) WITH CHECK (false);


-- ============================================================
-- 3. user_favorites - favoris visiteur (sans auth)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT NOT NULL,      -- UUID localStorage (mp_visitor_id)
  catalog_id  UUID REFERENCES products_catalog(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(visitor_id, catalog_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_visitor  ON user_favorites(visitor_id);
CREATE INDEX IF NOT EXISTS idx_favorites_catalog  ON user_favorites(catalog_id);

-- RLS - accès bloqué en direct, toggle via API route (service_role)
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites deny anon" ON user_favorites;
CREATE POLICY "favorites deny anon" ON user_favorites USING (false) WITH CHECK (false);


-- ============================================================
-- 4. affiliate_clicks - tracking clics affiliés
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    UUID REFERENCES product_offers(id) ON DELETE SET NULL,
  catalog_id  UUID REFERENCES products_catalog(id) ON DELETE SET NULL,
  merchant    TEXT,
  country     TEXT,
  visitor_id  TEXT,          -- localStorage UUID, peut être null
  clicked_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clicks_offer     ON affiliate_clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_clicks_catalog   ON affiliate_clicks(catalog_id);
CREATE INDEX IF NOT EXISTS idx_clicks_merchant  ON affiliate_clicks(merchant);
CREATE INDEX IF NOT EXISTS idx_clicks_date      ON affiliate_clicks(clicked_at);

-- RLS - log clic via API route (service_role), pas d'accès direct
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clicks deny anon" ON affiliate_clicks;
CREATE POLICY "clicks deny anon" ON affiliate_clicks USING (false) WITH CHECK (false);


-- ============================================================
-- 5. product_price_history - historique des prix
-- ============================================================

CREATE TABLE IF NOT EXISTS product_price_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id     UUID REFERENCES product_offers(id) ON DELETE CASCADE,
  catalog_id   UUID REFERENCES products_catalog(id) ON DELETE CASCADE,
  price        NUMERIC(10,2) NOT NULL,
  currency     TEXT DEFAULT 'EUR',
  recorded_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_offer    ON product_price_history(offer_id);
CREATE INDEX IF NOT EXISTS idx_price_history_catalog  ON product_price_history(catalog_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_date     ON product_price_history(recorded_at DESC);

-- RLS - accès bloqué en direct, lecture via API route (service_role)
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "price_history deny anon" ON product_price_history;
CREATE POLICY "price_history deny anon" ON product_price_history USING (false) WITH CHECK (false);


-- ============================================================
-- 6. Vue utilitaire - meilleure offre par produit catalog
-- ============================================================

CREATE OR REPLACE VIEW catalog_best_offer WITH (security_invoker = on) AS
SELECT DISTINCT ON (po.catalog_id)
  pc.id           AS catalog_id,
  pc.name,
  pc.brand,
  pc.category,
  pc.image_url,
  pc.ean,
  pc.weight_g,
  po.id           AS offer_id,
  po.merchant_name,
  po.country,
  po.price,
  po.currency,
  po.affiliate_url,
  po.in_stock,
  po.source
FROM products_catalog pc
JOIN product_offers po ON po.catalog_id = pc.id
WHERE pc.status = 'active'
  AND po.in_stock = true
  AND po.price > 0
ORDER BY po.catalog_id, po.price ASC;


-- ============================================================
-- 7. Fonction RPC - nb offres par catalog_id (pour affichage "+2 offres")
-- ============================================================

CREATE OR REPLACE FUNCTION get_offer_counts(catalog_ids UUID[])
RETURNS TABLE(catalog_id UUID, offer_count BIGINT) AS $$
  SELECT po.catalog_id, COUNT(*) AS offer_count
  FROM public.product_offers po
  WHERE po.catalog_id = ANY(catalog_ids)
    AND po.in_stock = true
    AND po.price > 0
  GROUP BY po.catalog_id;
$$ LANGUAGE sql
   STABLE
   SECURITY INVOKER
   SET search_path = '';

REVOKE ALL ON FUNCTION get_offer_counts(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_offer_counts(UUID[]) FROM anon;
REVOKE ALL ON FUNCTION get_offer_counts(UUID[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION get_offer_counts(UUID[]) TO service_role;


-- ============================================================
-- Vérification post-exécution
-- ============================================================

-- Vérifier que les 5 tables ont été créées :
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'products_catalog', 'product_offers', 'user_favorites',
--     'affiliate_clicks', 'product_price_history'
--   )
-- ORDER BY table_name;
-- → Doit retourner 5 lignes
