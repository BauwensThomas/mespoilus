CREATE TABLE IF NOT EXISTS article_comments (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  article_slug TEXT        NOT NULL,
  author_name  TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved comments"
  ON article_comments FOR SELECT
  USING (status = 'approved');
