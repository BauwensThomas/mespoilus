CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  emails TEXT[] NOT NULL,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outreach_service_all" ON outreach_campaigns USING (true) WITH CHECK (true);
