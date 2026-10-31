-- Partage réseaux sociaux des annonces d'adoption (31/10/2026)
-- Chaque annonce est publiée sur Facebook + Instagram au moment de son approbation
-- (src/lib/adoption-share.ts). shared_at évite de la republier ; NULL = jamais partagée.

ALTER TABLE adoption_posts
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;
