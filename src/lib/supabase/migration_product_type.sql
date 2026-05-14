-- Ajoute la colonne product_type sur products
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;
CREATE INDEX IF NOT EXISTS products_product_type_idx ON products (product_type);
