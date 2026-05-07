-- Table cron_state : passage d'état entre cron/blog (étapes 1-3) et cron/social (étapes 4-5)
CREATE TABLE IF NOT EXISTS cron_state (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug       TEXT        NOT NULL,
  title      TEXT,
  excerpt    TEXT,
  status     TEXT        NOT NULL DEFAULT 'article_ready', -- 'article_ready' | 'done'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer la lecture du dernier article prêt
CREATE INDEX IF NOT EXISTS cron_state_status_created_idx ON cron_state (status, created_at DESC);

-- RLS désactivé (accès service role uniquement)
ALTER TABLE cron_state DISABLE ROW LEVEL SECURITY;
