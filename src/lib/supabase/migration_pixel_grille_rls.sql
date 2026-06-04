-- =========================================
-- Mes Poilus - Grille Pixels : SÉCURITÉ (RLS)
-- À exécuter dans le SQL Editor de Supabase
-- =========================================
--
-- Sans RLS, la clé anon (publique) peut tout lire/écrire :
--   - lire race_secrete (triche)
--   - insérer de faux achats (sans payer)
--
-- On active RLS SANS policy publique → seul le service_role
-- (utilisé côté serveur via createAdminClient) peut accéder aux tables.
-- Toutes les opérations passent déjà par le serveur, donc rien ne casse.
-- ⚠️ Le client n'utilisera plus Realtime sur pixel_achats (remplacé par polling).
-- =========================================

ALTER TABLE pixel_grilles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_achats  ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour anon = aucun accès via la clé publique.
-- Le service_role bypass TOUJOURS RLS → le serveur continue de fonctionner.
-- On ajoute une policy ciblant UNIQUEMENT service_role pour satisfaire l'advisor
-- "RLS Enabled No Policy" (INFO) sans ouvrir le moindre accès à anon/authenticated.
DROP POLICY IF EXISTS "grille_service_role_only" ON pixel_grilles;
CREATE POLICY "grille_service_role_only" ON pixel_grilles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "achats_service_role_only" ON pixel_achats;
CREATE POLICY "achats_service_role_only" ON pixel_achats
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- (Optionnel) Retirer pixel_achats de la publication Realtime puisqu'on passe au polling.
-- Si la table n'y est pas, l'instruction échoue sans gravité - on l'enveloppe.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE pixel_achats;
EXCEPTION WHEN OTHERS THEN
  NULL; -- déjà absente ou publication différente
END $$;
