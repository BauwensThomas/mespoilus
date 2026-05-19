-- Sécurité : Politiques RLS pour bloquer tout accès public direct
-- Toutes ces tables sont accédées uniquement via la service key (createAdminClient)
-- La service key bypass RLS, donc ces politiques n'affectent pas le code

-- Tables internes (dashboard, agents, crons)
CREATE POLICY "admin only" ON public.activity_logs USING (false);
CREATE POLICY "admin only" ON public.agent_stats USING (false);
CREATE POLICY "admin only" ON public.awin_sync_progress USING (false);
CREATE POLICY "admin only" ON public.blocked_ips USING (false);
CREATE POLICY "admin only" ON public.cron_state USING (false);
CREATE POLICY "admin only" ON public.financial_reports USING (false);
CREATE POLICY "admin only" ON public.newsletter_campaigns USING (false);
CREATE POLICY "admin only" ON public.security_logs USING (false);
CREATE POLICY "admin only" ON public.seo_reports USING (false);
CREATE POLICY "admin only" ON public.social_posts USING (false);
CREATE POLICY "admin only" ON public.support_logs USING (false);
CREATE POLICY "admin only" ON public.tech_reports USING (false);
CREATE POLICY "admin only" ON public.products_hidden USING (false);

-- Tables publiques (accès aussi via service key uniquement)
CREATE POLICY "admin only" ON public.adoption_posts USING (false);
CREATE POLICY "admin only" ON public.adoption_alerts USING (false);
CREATE POLICY "admin only" ON public.newsletter_subscribers USING (false);
CREATE POLICY "admin only" ON public.pdf_consents USING (false);
CREATE POLICY "admin only" ON public.pdf_downloads USING (false);