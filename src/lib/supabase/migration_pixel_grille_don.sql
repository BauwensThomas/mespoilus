-- =========================================
-- Mes Poilus - Grille Pixels : PREUVE DU DON
-- À exécuter dans le SQL Editor de Supabase
-- =========================================
-- Montant réellement reversé (saisi manuellement par l'admin) + URL de la preuve
-- (capture du virement). Le montant est saisi à la main pour ne PAS révéler
-- automatiquement la part gardée.

ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS montant_reverse_cents INTEGER;
ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS preuve_don_url TEXT;
