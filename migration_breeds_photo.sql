-- Ajouter la colonne photo_url à la table breeds
ALTER TABLE breeds ADD COLUMN IF NOT EXISTS photo_url TEXT;
