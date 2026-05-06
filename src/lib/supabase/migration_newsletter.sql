-- ============================================================
-- Migration : Système newsletter Mes Poilus
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Table abonnés newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email           TEXT        NOT NULL,
  first_name      TEXT,
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'unsubscribed')),
  source          TEXT        DEFAULT 'landing_page'
                              CHECK (source IN ('landing_page', 'blog', 'boutique', 'manual')),
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email  ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- Table campagnes newsletter
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  subject          TEXT        NOT NULL,
  preview_text     TEXT,
  content_html     TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'sent', 'failed')),
  recipients_count INT         DEFAULT 0,
  sent_count       INT         DEFAULT 0,
  failed_count     INT         DEFAULT 0,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Seed agent_stats pour Sofia
INSERT INTO agent_stats (agent_id)
VALUES ('sofia')
ON CONFLICT (agent_id) DO NOTHING;
