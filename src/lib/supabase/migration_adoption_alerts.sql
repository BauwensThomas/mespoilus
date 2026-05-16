CREATE TABLE IF NOT EXISTS adoption_alerts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL,
  animal        TEXT        NOT NULL DEFAULT 'tous',
  country       TEXT        NOT NULL DEFAULT 'tous',
  confirmed     BOOLEAN     DEFAULT false,
  confirm_token TEXT        UNIQUE DEFAULT gen_random_uuid()::text,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email, animal, country)
);

ALTER TABLE adoption_alerts ENABLE ROW LEVEL SECURITY;
-- Pas de policy publique : uniquement service_role peut lire/écrire
