-- =========================================
-- Mes Poilus - Migration complète
-- À exécuter une seule fois dans Supabase SQL Editor
-- Corrige toutes les divergences schema/code
-- =========================================

-- -----------------------------------------------
-- 1. Colonnes images manquantes sur articles
--    (erreur PGRST204 lors de l'upsert de Marie)
-- -----------------------------------------------
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS image_url       TEXT,
  ADD COLUMN IF NOT EXISTS image_alt       TEXT,
  ADD COLUMN IF NOT EXISTS image_credit    TEXT,
  ADD COLUMN IF NOT EXISTS image_credit_url TEXT;

-- -----------------------------------------------
-- 2. Indexes manquants (performances blog)
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_articles_category     ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- -----------------------------------------------
-- 3. Fonction RPC increment_agent_stat
--    (appelée par updateAgentStats dans runner.ts)
--    Upsert atomique : évite les race conditions
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION increment_agent_stat(
  p_agent_id TEXT,
  p_field    TEXT,
  p_tokens   INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO agent_stats (
    agent_id,
    tasks_completed,
    tasks_failed,
    total_tokens_used,
    last_active,
    updated_at
  )
  VALUES (
    p_agent_id,
    CASE WHEN p_field = 'tasks_completed' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'tasks_failed'    THEN 1 ELSE 0 END,
    p_tokens,
    NOW(),
    NOW()
  )
  ON CONFLICT (agent_id) DO UPDATE SET
    tasks_completed   = agent_stats.tasks_completed
                        + CASE WHEN p_field = 'tasks_completed' THEN 1 ELSE 0 END,
    tasks_failed      = agent_stats.tasks_failed
                        + CASE WHEN p_field = 'tasks_failed'    THEN 1 ELSE 0 END,
    total_tokens_used = agent_stats.total_tokens_used + p_tokens,
    last_active       = NOW(),
    updated_at        = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------
-- 4. S'assurer que les 8 agents ont bien une ligne
--    dans agent_stats (idempotent)
-- -----------------------------------------------
INSERT INTO agent_stats (agent_id, tasks_completed, performance_score) VALUES
  ('thomas',   0, 0.0),
  ('marie',    0, 0.0),
  ('lucas',    0, 0.0),
  ('emma',     0, 0.0),
  ('maxime',   0, 0.0),
  ('lea',      0, 0.0),
  ('antoine',  0, 0.0),
  ('nathalie', 0, 0.0)
ON CONFLICT (agent_id) DO NOTHING;
