-- =========================================
-- Mes Poilus - Grille Pixels : ROTATION
-- Permet plusieurs grilles en file d'attente
-- À exécuter dans le SQL Editor de Supabase
-- =========================================

-- 1. Autoriser le statut 'scheduled' (grille en attente)
ALTER TABLE pixel_grilles DROP CONSTRAINT IF EXISTS pixel_grilles_statut_check;
ALTER TABLE pixel_grilles ADD CONSTRAINT pixel_grilles_statut_check
  CHECK (statut IN ('scheduled', 'active', 'completed'));

-- 2. Nouvelles colonnes de rotation
ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS starts_at      TIMESTAMPTZ;
ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS ends_at        TIMESTAMPTZ;
ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS next_starts_at TIMESTAMPTZ;
ALTER TABLE pixel_grilles ADD COLUMN IF NOT EXISTS ordre          INTEGER DEFAULT 1;

-- 3. Initialiser la grille active existante
--    starts_at = created_at, ends_at = created_at + 3 mois
UPDATE pixel_grilles
SET starts_at = COALESCE(starts_at, created_at),
    ends_at   = COALESCE(ends_at, created_at + INTERVAL '3 months')
WHERE statut = 'active' AND starts_at IS NULL;

-- 4. Autoriser la source 'grille' dans la newsletter (inscription à l'achat)
ALTER TABLE newsletter_subscribers DROP CONSTRAINT IF EXISTS newsletter_subscribers_source_check;
ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_source_check
  CHECK (source IN ('landing_page','blog','boutique','manual','grille'));

-- 5. Index pour retrouver rapidement la prochaine grille à activer
CREATE INDEX IF NOT EXISTS idx_pixel_grilles_statut_ordre ON pixel_grilles(statut, ordre);
