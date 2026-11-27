-- Articles invités (27/11/2026) : un article rédigé par un partenaire est signé de son auteur,
-- avec la mention "Article invité". Vide = article de Mes Poilus (rédigé avec Marie).
ALTER TABLE articles ADD COLUMN IF NOT EXISTS guest_author text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS guest_author_bio text;
