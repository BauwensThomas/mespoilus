-- Table partenaires (gestion dynamique depuis /partenaires-admin)
CREATE TABLE IF NOT EXISTS partenaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  logo_urls TEXT[] DEFAULT '{}',
  url TEXT,
  urls_by_country JSONB,
  tag TEXT,
  tag_bg TEXT DEFAULT '#f3f4f6',
  tag_text TEXT DEFAULT '#374151',
  pour TEXT,
  emoji TEXT DEFAULT '🐾',
  pays TEXT[] DEFAULT '{}',
  network TEXT DEFAULT 'awin',
  recommend BOOLEAN DEFAULT true,
  in_bandeau BOOLEAN DEFAULT true,
  display_mode TEXT DEFAULT 'card',
  flag_position TEXT DEFAULT 'bottom-left',
  link_position TEXT DEFAULT 'bottom-right',
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Colonnes ajoutées après la création initiale (idempotent)
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS logo_urls TEXT[] DEFAULT '{}';
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS in_bandeau BOOLEAN DEFAULT true;
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'card';
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS flag_position TEXT DEFAULT 'bottom-left';
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS link_position TEXT DEFAULT 'bottom-right';

-- RLS
ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partenaires_public_select" ON partenaires FOR SELECT USING (actif = true);
CREATE POLICY "partenaires_service_all" ON partenaires USING (true) WITH CHECK (true);

-- Seed depuis les partenaires existants
INSERT INTO partenaires (nom, description, logo_url, url, urls_by_country, tag, tag_bg, tag_text, pour, emoji, pays, network, recommend, ordre) VALUES
(
  'Dogfy Diet',
  'Repas 100 % naturels cuisinés à la vapeur. Livraison en France. Portions personnalisées selon le poids, l''âge et l''activité de votre chien.',
  NULL,
  'https://www.awin1.com/cread.php?awinmid=30279&awinaffid=2885973&ued=https%3A%2F%2Fdogfydiet.com%2Ffr',
  NULL,
  'Nutrition fraîche',
  '#ffedd5', '#9a3412',
  'Pour les chiens', '🍗', ARRAY['FR'], 'awin', true, 0
),
(
  'Maxi Zoo',
  'Alimentation, accessoires et soins pour tous vos animaux. Magasins en France et en Belgique.',
  NULL,
  NULL,
  '{"FR": "https://www.awin1.com/cread.php?awinmid=68698&awinaffid=2885973&ued=https%3A%2F%2Fwww.maxizoo.fr", "BE": "https://www.awin1.com/cread.php?awinmid=68696&awinaffid=2885973&ued=https%3A%2F%2Fwww.maxizoo.be"}',
  'Animalerie',
  '#dcfce7', '#166534',
  'Pour tous les animaux', '🐾', ARRAY['FR', 'BE'], 'awin', true, 1
),
(
  'CanadaPetCare',
  'Antiparasitaires, vermifuges et soins santé pour chiens et chats. Frontline Plus, Advantage, K9 Advantix et plus.',
  NULL,
  'https://www.jdoqocy.com/click-101746286-17287368',
  NULL,
  'Santé animale',
  '#dbeafe', '#1e40af',
  'Pour chiens & chats', '💊', ARRAY['CA', 'US'], 'cj', true, 2
),
(
  'Tuft & Paw',
  'Litière Crystal Clear, nourriture fraiche et mobilier design pour chats. Produits haut de gamme conçus au Canada.',
  NULL,
  NULL,
  NULL,
  'Litière, Nourriture & Mobilier',
  '#f3e8ff', '#6b21a8',
  'Pour les chats', '🐾', ARRAY['US'], 'awin', false, 3
);
