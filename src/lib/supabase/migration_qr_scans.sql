-- Tracking des scans QR code (carte de visite physique, campagne presentoir_2026)
CREATE TABLE qr_scans (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  city       TEXT,
  country    TEXT,
  campaign   TEXT        NOT NULL DEFAULT 'presentoir_2026'
);

-- RLS activé, AUCUNE policy anon/authenticated = deny par défaut.
-- Seul le service_role (createAdminClient, bypass RLS nativement) peut lire/écrire depuis le code serveur.
-- Le SQL Editor du dashboard Supabase tourne aussi en bypass RLS (rôle postgres) : tu peux y lire les données directement.
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
