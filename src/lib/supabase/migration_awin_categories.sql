-- Ajout colonne categories[] pour filtrage multi-catégorie
-- Un livre sur les chiens a categories = ['livres', 'chiens']
-- Un produit chien a categories = ['chiens']

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';

-- Remplir depuis la colonne category existante
UPDATE products
  SET categories = ARRAY[category]
  WHERE categories = '{}';

-- Ajouter 'livres' dans le type category
ALTER TABLE products
  ALTER COLUMN category TYPE TEXT;

-- Index GIN pour les requêtes @> (contains)
CREATE INDEX IF NOT EXISTS products_categories_gin ON products USING GIN(categories);
