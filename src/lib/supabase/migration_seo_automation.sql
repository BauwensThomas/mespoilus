-- =========================================
-- Automatisation SEO via Google Search Console
-- Historisation GSC + suggestions Lucas + validation admin
-- À exécuter dans le SQL Editor de Supabase (ou via scripts/_sb.mjs)
-- =========================================

-- Historique hebdomadaire des données Search Console (page x requête)
-- Contourne la limite 16 mois de l'UI GSC. Alimenté par le cron gsc-sync.
CREATE TABLE IF NOT EXISTS gsc_weekly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  page TEXT NOT NULL,
  query TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'statique' CHECK (page_type IN ('blog', 'produit', 'race', 'statique', 'racine')),
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  position NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week_start, page, query)
);
CREATE INDEX IF NOT EXISTS idx_gsc_weekly_stats_page ON gsc_weekly_stats (page, week_start);

-- Suggestions générées par Lucas à partir des opportunités détectées dans gsc_weekly_stats
CREATE TABLE IF NOT EXISTS seo_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('blog', 'produit', 'race', 'statique', 'racine')),
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('title', 'meta', 'internal_link')),
  current_value TEXT,
  proposed_value TEXT NOT NULL,
  anchor_text TEXT,
  target_url TEXT,
  reasoning TEXT NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('page2', 'low_ctr', 'regression')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'failed')),
  error_message TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_seo_suggestions_status ON seo_suggestions (status, page_type);
CREATE INDEX IF NOT EXISTS idx_seo_suggestions_page ON seo_suggestions (page, suggestion_type);

-- Surcharge de métadonnées pour les pages sans champ éditable natif
-- (boutique produits, pages statiques). Ne JAMAIS l'utiliser pour articles/breeds,
-- qui ont déjà leurs propres colonnes (title/meta_description, content.excerpt).
CREATE TABLE IF NOT EXISTS seo_meta_overrides (
  url_path TEXT PRIMARY KEY,
  title TEXT,
  meta_description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : accès interne uniquement (service_role bypass), même pattern que qr_scans.
ALTER TABLE gsc_weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_meta_overrides ENABLE ROW LEVEL SECURITY;
