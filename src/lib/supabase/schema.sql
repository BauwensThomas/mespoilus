-- =========================================
-- Mes Poilus - Schéma de base de données
-- À exécuter dans le SQL Editor de Supabase
-- =========================================

-- Articles rédigés par Marie
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  meta_description TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  reading_time INTEGER DEFAULT 5,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs d'activité de tous les agents
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de sécurité gérés par Nathalie
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT,
  user_agent TEXT,
  endpoint TEXT,
  method TEXT,
  threat_level TEXT DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  threat_type TEXT,
  action_taken TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts réseaux sociaux créés par Emma
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok')),
  hashtags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  engagement_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rapports financiers générés par Antoine
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL,
  revenue DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  margin DECIMAL(5,2) DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statistiques des agents
CREATE TABLE IF NOT EXISTS agent_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  performance_score DECIMAL(3,1) DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IPs bloquées par Nathalie
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT,
  blocked_by TEXT DEFAULT 'nathalie',
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_activity_logs_agent_id ON activity_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_threat_level ON security_logs(threat_level);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);

-- Trigger pour updated_at sur articles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données initiales pour agent_stats
INSERT INTO agent_stats (agent_id, tasks_completed, performance_score) VALUES
  ('thomas', 0, 0.0),
  ('marie', 0, 0.0),
  ('lucas', 0, 0.0),
  ('emma', 0, 0.0),
  ('maxime', 0, 0.0),
  ('lea', 0, 0.0),
  ('antoine', 0, 0.0),
  ('nathalie', 0, 0.0)
ON CONFLICT (agent_id) DO NOTHING;

-- Politique RLS (Row Level Security) - désactivé pour usage interne
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips DISABLE ROW LEVEL SECURITY;
