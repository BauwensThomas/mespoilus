-- Table fiches races
CREATE TABLE IF NOT EXISTS breeds (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal        TEXT NOT NULL CHECK (animal IN ('chien', 'chat', 'oiseau', 'rongeur', 'reptile')),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  content       JSONB,
  status        TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  generated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(animal, slug)
);

CREATE INDEX IF NOT EXISTS breeds_animal_idx  ON breeds(animal);
CREATE INDEX IF NOT EXISTS breeds_status_idx  ON breeds(status);
CREATE INDEX IF NOT EXISTS breeds_slug_idx    ON breeds(slug);

-- RLS
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;

-- Lecture publique des races publiées
CREATE POLICY "breeds_select_published" ON breeds
  FOR SELECT USING (status = 'published' AND content IS NOT NULL);
