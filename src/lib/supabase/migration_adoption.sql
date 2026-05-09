-- Mes Poilus -Table annonces d'adoption

CREATE TABLE IF NOT EXISTS adoption_posts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_name   TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  animal_type   TEXT        NOT NULL,
  breed         TEXT,
  age           TEXT,
  gender        TEXT        NOT NULL DEFAULT 'inconnu',
  region        TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  contact_info  TEXT        NOT NULL,
  photo_urls    TEXT[]      NOT NULL DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adoption_status      ON adoption_posts(status);
CREATE INDEX IF NOT EXISTS idx_adoption_animal_type ON adoption_posts(animal_type);
CREATE INDEX IF NOT EXISTS idx_adoption_created_at  ON adoption_posts(created_at DESC);

-- ⚠️  Créer manuellement le bucket dans Supabase Dashboard → Storage :
--     Nom : adoption-photos | Public : oui | Taille max fichier : 5 MB
