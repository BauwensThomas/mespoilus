-- Supprime la colonne in_stock de la table products
-- Les produits sont tous affichés dans la boutique sans distinction de stock

ALTER TABLE products DROP COLUMN IF EXISTS in_stock;

-- Met à jour la RLS : tous les produits sont accessibles publiquement
DROP POLICY IF EXISTS "Public read in_stock products" ON products;
DROP POLICY IF EXISTS "products_public_read" ON products;

CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (true);
