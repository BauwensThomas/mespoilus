-- Migration : ajout colonne buffer_id dans social_posts
-- À exécuter dans Supabase SQL Editor avant d'utiliser l'intégration Buffer

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS buffer_id TEXT;
