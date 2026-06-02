-- =========================================
-- Mes Poilus - Grille Pixels : PALIERS (notifications)
-- À exécuter dans le SQL Editor de Supabase
-- =========================================
-- Mémorise le plus haut palier de remplissage déjà notifié (0, 25, 50, 75, 90)
-- pour ne pas envoyer plusieurs fois la même notification.

ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS milestone_notifie INTEGER DEFAULT 0;
