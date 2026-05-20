-- Correction des policies RLS "always true" signalées par le Security Advisor
-- Ces tables sont accédées uniquement via service_role (createAdminClient) qui bypass RLS de toute façon.
-- On remplace USING(true) par USING(false) pour bloquer l'accès anon/authenticated direct.

-- outreach_campaigns
DROP POLICY IF EXISTS "outreach_service_all" ON outreach_campaigns;
CREATE POLICY "outreach_deny_anon" ON outreach_campaigns USING (false) WITH CHECK (false);

-- partenaires
DROP POLICY IF EXISTS "partenaires_service_all" ON partenaires;
CREATE POLICY "partenaires_deny_anon" ON partenaires USING (false) WITH CHECK (false);
