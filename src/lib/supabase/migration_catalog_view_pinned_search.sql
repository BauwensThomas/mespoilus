-- Vue catalog_best_offer (25/11/2026) :
--   1. inclut les produits épinglés (status = 'pinned') : ils étaient invisibles dans la boutique
--      alors qu'épingler sert à les garder visibles ;
--   2. expose name_search : la recherche de /boutique filtre dessus, la colonne manquait dans la
--      vue et TOUTE recherche renvoyait "Aucun produit trouvé".
-- name_search est ajoutée en DERNIER (obligatoire avec CREATE OR REPLACE VIEW).

CREATE OR REPLACE VIEW catalog_best_offer WITH (security_invoker = on) AS
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
  po.source,
  pc.name_search
FROM products_catalog pc
JOIN product_offers po ON po.catalog_id = pc.id
WHERE pc.status IN ('active', 'pinned')
  AND po.in_stock = true
  AND po.price > 0
ORDER BY po.catalog_id, po.price ASC;
