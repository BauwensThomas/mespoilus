-- Réglages du site modifiables depuis l'admin (25/11/2026).
-- Premier réglage : grille_visible (true/false), l'interrupteur du jeu "Grille Mystère"
-- dans /grille-admin. Lu par src/lib/site-settings.ts. Absent ou illisible = jeu masqué.
--
-- RLS activée SANS policy : seule la service-role (serveur) lit et écrit.

CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON site_settings FROM anon, authenticated;

INSERT INTO site_settings (key, value) VALUES ('grille_visible', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
