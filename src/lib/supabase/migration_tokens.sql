-- Migration : ajout tokens_used dans activity_logs
-- À exécuter dans Supabase SQL Editor

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_activity_logs_tokens ON activity_logs(agent_id, created_at DESC);
