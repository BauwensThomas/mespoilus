-- BOUTIQUE V2 - Phase 2
-- Ajout colonnes ean, isbn, brand à la table products existante
-- Colonnes nullable → aucun impact sur la boutique actuelle

ALTER TABLE products ADD COLUMN IF NOT EXISTS ean   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS isbn  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;

-- Index utiles pour le matching futur
CREATE INDEX IF NOT EXISTS idx_products_ean   ON products(ean)   WHERE ean IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
