-- Table pour stocker les prénoms générés par Thomas (cron mensuel)
CREATE TABLE IF NOT EXISTS prenoms (
  animal TEXT NOT NULL,
  style  TEXT NOT NULL,
  names  TEXT[] NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (animal, style)
);

ALTER TABLE prenoms ENABLE ROW LEVEL SECURITY;

-- Lecture publique (page /outils/prenom est publique)
CREATE POLICY "Public read prenoms" ON prenoms FOR SELECT USING (true);
