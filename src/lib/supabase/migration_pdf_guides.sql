-- ============================================================
-- Migration : Système guides PDF Mes Poilus
-- À exécuter dans Supabase > SQL Editor
-- Prérequis : bucket "pdf-guides" créé dans Supabase Storage
-- ============================================================

CREATE TABLE pdf_guides (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        UNIQUE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  category    TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,
  pages_count INT         DEFAULT 1,
  active      BOOLEAN     DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pdf_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active guides" ON pdf_guides FOR SELECT USING (active = true);

CREATE TABLE pdf_downloads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id      UUID        REFERENCES pdf_guides(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  token         TEXT        UNIQUE NOT NULL,
  expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pdf_downloads ENABLE ROW LEVEL SECURITY;

CREATE TABLE pdf_consents (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT        NOT NULL,
  guide_id           UUID        REFERENCES pdf_guides(id) ON DELETE CASCADE,
  newsletter_consent BOOLEAN     DEFAULT false,
  ip_address         TEXT,
  consented_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pdf_consents ENABLE ROW LEVEL SECURITY;

-- Index utiles
CREATE INDEX idx_pdf_downloads_token    ON pdf_downloads(token);
CREATE INDEX idx_pdf_downloads_email    ON pdf_downloads(email);
CREATE INDEX idx_pdf_guides_slug        ON pdf_guides(slug);
CREATE INDEX idx_pdf_guides_category    ON pdf_guides(category);

-- Seed : 10 guides
-- Mettre à jour file_path après upload dans Supabase Storage bucket "pdf-guides"
INSERT INTO pdf_guides (slug, title, description, category, file_path, pages_count) VALUES
('checklist-adoption-chaton',    'Checklist adoption chaton',              'Tout ce qu''il faut préparer avant l''arrivée de votre chaton : litière, alimentation, vétérinaire, jouets et sécurité de la maison.',                  'chats',    'chats/checklist-adoption-chaton.pdf',     4),
('preparer-arrivee-chiot',       'Préparer l''arrivée d''un chiot',        'Le guide complet pour accueillir votre chiot dans les meilleures conditions : équipement, éducation de base, premiers vaccins et routine quotidienne.',     'chiens',   'chiens/preparer-arrivee-chiot.pdf',       5),
('materiel-essentiel-hamster',   'Matériel essentiel hamster',             'La liste complète du matériel indispensable pour bien accueillir un hamster : cage, roue, litière, alimentation et accessoires recommandés.',                'rongeurs', 'rongeurs/materiel-essentiel-hamster.pdf', 3),
('premiers-achats-lapin',        'Premiers achats pour un lapin',          'Tout ce dont vous avez besoin pour accueillir votre lapin : cage, alimentation, foin, litière, jouets et accessoires de soin.',                             'rongeurs', 'rongeurs/premiers-achats-lapin.pdf',      3),
('securiser-maison-chat',        'Sécuriser sa maison pour un chat',       'Guide pratique pour identifier et éliminer les dangers domestiques : plantes toxiques, fenêtres, produits ménagers, fils électriques et zones à risque.',  'chats',    'chats/securiser-maison-chat.pdf',         4),
('guide-nutrition-chien',        'Guide nutrition chien',                  'Comprendre les besoins nutritionnels de votre chien selon son âge, sa taille et son activité. Comparatif croquettes, pâtées et BARF.',                      'chiens',   'chiens/guide-nutrition-chien.pdf',        5),
('checklist-adoption-reptile',   'Checklist adoption reptile',             'Préparer l''arrivée d''un reptile (gecko, serpent, tortue) : terrarium, température, éclairage UV, alimentation et soins vétérinaires spécialisés.',       'reptiles', 'reptiles/checklist-adoption-reptile.pdf', 4),
('alimentation-perroquet',       'Alimentation perroquet débutant',        'Tout sur l''alimentation d''un perroquet ou d''une perruche : graines, fruits, légumes autorisés et aliments dangereux à absolument éviter.',               'oiseaux',  'oiseaux/alimentation-perroquet.pdf',      3),
('premiers-soins-chien',         'Premiers soins pour votre chien',        'Les gestes essentiels en cas d''urgence : coupures, brûlures, empoisonnement, coup de chaleur. Trousse de secours et numéros d''urgence vétérinaire.',      'chiens',   'chiens/premiers-soins-chien.pdf',         4),
('preparer-arrivee-chat-adulte', 'Préparer l''arrivée d''un chat adulte',  'Adopter un chat adulte : différences avec un chaton, période d''adaptation, présentation aux autres animaux et conseils pour une intégration réussie.',    'chats',    'chats/preparer-arrivee-chat-adulte.pdf',  3);
