-- Index recommandés par le Supabase Performance Advisor
-- Amélioration estimée : 65% sur la requête UNION du dashboard (activity_logs + articles + social_posts + agent_stats + cron_state)

CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_agent_stats_last_active ON public.agent_stats USING btree (last_active);
CREATE INDEX IF NOT EXISTS idx_cron_state_created_at ON public.cron_state USING btree (created_at);
