-- Colonne pour tracker quel partenaire/produit a été mis en avant dans un article
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_partner TEXT;
