-- Soft delete adoption_posts
-- Conserve les stats, anonymise les données personnelles (RGPD)

ALTER TABLE adoption_posts
  ADD COLUMN IF NOT EXISTS deleted_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason  TEXT,   -- 'adopted' | 'error' | 'auto_expired' | 'admin'
  ADD COLUMN IF NOT EXISTS deleted_by      TEXT;   -- 'user' | 'cron' | 'admin'

-- Index pour requêtes stats
CREATE INDEX IF NOT EXISTS idx_adoption_posts_deleted_reason ON adoption_posts (deleted_reason) WHERE deleted_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_adoption_posts_deleted_at     ON adoption_posts (deleted_at)     WHERE deleted_at     IS NOT NULL;
