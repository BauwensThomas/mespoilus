-- Ajoute product_type sur products_catalog + met à jour la vue catalog_best_offer

-- 1. Colonne + index
ALTER TABLE products_catalog ADD COLUMN IF NOT EXISTS product_type TEXT;
CREATE INDEX IF NOT EXISTS idx_catalog_product_type ON products_catalog(product_type)
  WHERE product_type IS NOT NULL;

-- 2. Backfill des produits existants (regex sur le nom)
UPDATE products_catalog
SET product_type = CASE
  WHEN isbn IS NOT NULL
    THEN 'livres'
  WHEN lower(name) ~ '\m(food|treat|snack|nourriture|croquette|friandise|alimentation|pat[eé]e|voer|futter|kibble|nutrition|feeding)\M'
    THEN 'nourriture'
  WHEN lower(name) ~ '\m(toy|jouet|jeu|balle|peluche|speelgoed|spielzeug|play|interactive|interactif|tunnel|roue)\M'
    THEN 'jouets'
  WHEN lower(name) ~ '\m(grooming|shampoo|shampooing|toilettage|litter|liti[eè]re|dental|brosse|peigne|d[eé]sodorisant)\M'
    THEN 'hygiene'
  WHEN lower(name) ~ '\m(health|sant[eé]|medicine|m[eé]dicament|antiparasit|vermifuge|supplement|vitamin|pharma|probiotique)\M'
    THEN 'sante'
  WHEN lower(name) ~ '\m(bed|panier|couchage|coussin|niche|cage|aquarium|terrarium|vivarium|griffoir|perchoir|kennel|maison)\M'
    THEN 'habitat'
  WHEN lower(name) ~ '\m(collar|leash|harness|collier|laisse|harnais|bowl|gamelle|carrier|transport)\M'
    THEN 'accessoires'
  WHEN lower(name) ~ '\m(book|livre|roman|encyclop[eé]die|manga)\M'
    THEN 'livres'
  ELSE NULL
END
WHERE product_type IS NULL;

-- 3. Vue catalog_best_offer — ajoute product_type et categories
-- CREATE OR REPLACE ne peut pas ajouter des colonnes → DROP + recreate
DROP VIEW IF EXISTS catalog_best_offer;
CREATE VIEW catalog_best_offer WITH (security_invoker = on) AS
SELECT DISTINCT ON (po.catalog_id)
  pc.id           AS catalog_id,
  pc.name,
  pc.brand,
  pc.category,
  pc.categories,
  pc.product_type,
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
