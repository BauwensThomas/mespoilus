-- =========================================
-- Tables pour les rapports des agents
-- Lucas (SEO), Maxime (Tech), Léa (Support)
-- À exécuter dans le SQL Editor de Supabase
-- =========================================

-- Rapports SEO de Lucas
CREATE TABLE IF NOT EXISTS seo_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  analysis TEXT NOT NULL,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rapports techniques de Maxime
CREATE TABLE IF NOT EXISTS tech_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  report TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions support de Léa
CREATE TABLE IF NOT EXISTS support_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver RLS pour usage interne
ALTER TABLE seo_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE tech_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_logs DISABLE ROW LEVEL SECURITY;
