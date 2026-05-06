-- Migration : Ajout des colonnes images aux articles
-- À exécuter dans le SQL Editor de Supabase si la table articles existe déjà

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS image_credit TEXT,
  ADD COLUMN IF NOT EXISTS image_credit_url TEXT;
