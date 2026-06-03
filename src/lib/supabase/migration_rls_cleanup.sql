-- Nettoyage des policies RLS redondantes (advisor "Multiple Permissive Policies").
-- Appliqué le 03/06/2026 via l'API Management.
--
-- Contexte : chaque table avait 2 policies PERMISSIVE :
--   1) une "..._deny_anon" (cmd=ALL, qual=false)
--   2) une "..._select"   (la vraie règle de lecture)
-- En RLS, les policies permissives se combinent en OU → "false OR X = X",
-- donc les policies "deny" ne bloquaient RIEN en lecture. Pour l'écriture,
-- le refus par défaut de RLS s'applique déjà (aucune policy permissive
-- d'écriture). Elles étaient donc 100% redondantes et ne faisaient
-- qu'alourdir l'évaluation RLS (avertissement perf).
--
-- Après suppression :
--   • SELECT public : OK via les policies "..._select"
--   • INSERT/UPDATE/DELETE anon : refusés par défaut (RLS actif, pas de policy)
--   • service_role (admin/cron) : inchangé (bypass RLS)

DROP POLICY IF EXISTS "partenaires_deny_anon" ON partenaires;
DROP POLICY IF EXISTS "offers deny anon"      ON product_offers;
DROP POLICY IF EXISTS "catalog deny anon"     ON products_catalog;
