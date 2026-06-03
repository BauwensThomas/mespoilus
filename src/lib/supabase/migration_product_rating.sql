-- Ajoute la note clients (étoiles) + nombre d'avis sur products_catalog
-- et les expose dans la vue catalog_best_offer (utilisée par le cron blog).
-- À lancer une seule fois dans l'éditeur SQL Supabase.

-- 1. Colonnes
ALTER TABLE products_catalog ADD COLUMN IF NOT EXISTS rating       NUMERIC(2,1);
ALTER TABLE products_catalog ADD COLUMN IF NOT EXISTS rating_count INTEGER;

-- 2. Vue catalog_best_offer — ajoute rating + rating_count
-- (CREATE OR REPLACE ne peut pas ajouter de colonnes → DROP + recreate)
DROP VIEW IF EXISTS catalog_best_offer;
CREATE VIEW catalog_best_offer WITH (security_invoker = on) AS
SELECT DISTINCT ON (po.catalog_id)
  pc.id           AS catalog_id,
  pc.name,
  pc.brand,
  pc.category,
  pc.categories,
  pc.product_type,
  pc.rating,
  pc.rating_count,
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
