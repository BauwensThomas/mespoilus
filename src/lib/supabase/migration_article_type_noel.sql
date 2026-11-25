-- Type "noel" (25/11/2026) : un article par semaine sur les fêtes, du 25 novembre au 10 janvier.
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IS NULL OR article_type IN ('trending', 'pratique', 'selection', 'noel', 'affiliation', 'best_of', 'race'));
