-- Email optionnel sur les commentaires
ALTER TABLE article_comments ADD COLUMN IF NOT EXISTS email TEXT;

-- Abonnements aux notifications de commentaires par article
CREATE TABLE IF NOT EXISTS comment_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  article_slug     TEXT NOT NULL,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, article_slug)
);

CREATE INDEX IF NOT EXISTS idx_comment_subs_slug  ON comment_subscriptions(article_slug);
CREATE INDEX IF NOT EXISTS idx_comment_subs_token ON comment_subscriptions(unsubscribe_token);

-- Acces service_role uniquement (pas d'acces public)
ALTER TABLE comment_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only" ON public.comment_subscriptions USING (false);
