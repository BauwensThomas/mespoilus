-- Colonne breed_slug dans articles : trace quelle race a été utilisée pour un article de type race
ALTER TABLE articles ADD COLUMN IF NOT EXISTS breed_slug text;
CREATE INDEX IF NOT EXISTS articles_breed_slug_idx ON articles(breed_slug) WHERE breed_slug IS NOT NULL;
