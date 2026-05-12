-- Table awin_sync_progress : suivi de l'avancement de chaque cron Awin par catégorie
CREATE TABLE IF NOT EXISTS awin_sync_progress (
  category    TEXT        PRIMARY KEY,
  status      TEXT        NOT NULL DEFAULT 'idle', -- 'idle' | 'running' | 'done' | 'error'
  synced      INTEGER     NOT NULL DEFAULT 0,
  current_feed TEXT,
  error       TEXT,
  started_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Insérer les catégories par défaut
INSERT INTO awin_sync_progress (category, status) VALUES
  ('chiens',   'idle'),
  ('chats',    'idle'),
  ('oiseaux',  'idle'),
  ('rongeurs', 'idle'),
  ('reptiles', 'idle'),
  ('livres',   'idle'),
  ('general',  'idle')
ON CONFLICT (category) DO NOTHING;

-- RLS désactivé (accès service role uniquement)
ALTER TABLE awin_sync_progress DISABLE ROW LEVEL SECURITY;