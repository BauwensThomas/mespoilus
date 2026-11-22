-- Type éditorial de chaque article généré par le cron blog (22/11/2026).
-- Permet de comparer les performances par type dans les bilans SEO (GSC) au lieu de les deviner.
--
-- Types actuels (rotation par animal : trending, pratique, trending, selection) :
--   trending   : sujet recherché en ce moment (santé, comportement, problème concret)
--   pratique   : guide pratique / conseil
--   selection  : sélection de PLUSIEURS produits autour d'un besoin (remplace affiliation et best_of)
-- Types historiques, plus générés depuis le 22/11/2026 (articles existants conservés) :
--   affiliation : article centré sur un seul produit ou partenaire
--   best_of     : comparatif "Meilleur X pour..."
--   race        : article de blog sur une race (doublon des fiches /races, 0 clic constaté)
--
-- NULL = article antérieur au 22/11/2026 dont le type n'était pas enregistré
-- (seuls les articles race sont rattrapés, via breed_slug).

ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_type text;

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IS NULL OR article_type IN ('trending', 'pratique', 'selection', 'affiliation', 'best_of', 'race'));

UPDATE articles SET article_type = 'race' WHERE breed_slug IS NOT NULL AND article_type IS NULL;
