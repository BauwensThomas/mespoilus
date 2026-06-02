-- =========================================
-- Mes Poilus - Grille Pixels
-- À exécuter dans le SQL Editor de Supabase
-- =========================================

-- Grilles (une par campagne / animal)
CREATE TABLE IF NOT EXISTS pixel_grilles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal TEXT NOT NULL,                          -- 'chien', 'chat', etc.
  race_secrete TEXT NOT NULL,                    -- réponse cachée ex: 'Bouledogue Français'
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'completed')),
  grille_taille INTEGER DEFAULT 75,              -- 75x75
  image_path TEXT NOT NULL,                      -- chemin dans Supabase Storage
  image_taille INTEGER DEFAULT 1500,             -- taille de l'image source en px
  pixels_vendus INTEGER DEFAULT 0,               -- compteur mis à jour à chaque achat
  gagnant_devinette_id UUID,                     -- FK vers pixel_achats (rempli si quelqu'un devine)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Achats (un par transaction Stripe = 5 pixels minimum)
CREATE TABLE IF NOT EXISTS pixel_achats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grille_id UUID NOT NULL REFERENCES pixel_grilles(id) ON DELETE CASCADE,
  positions INTEGER[] NOT NULL,                  -- indices des cases révélées (ex: [42, 137, 890, 1204, 3301])
  acheteur_prenom TEXT NOT NULL,
  acheteur_email TEXT NOT NULL,
  montant_cents INTEGER NOT NULL,                -- 500 = 5€, 1000 = 10€, etc.
  stripe_session_id TEXT UNIQUE,
  devinette TEXT,                                -- race soumise par l'acheteur
  devinette_correcte BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,                      -- rempli par le webhook Stripe
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_pixel_achats_grille_id ON pixel_achats(grille_id);
CREATE INDEX IF NOT EXISTS idx_pixel_achats_confirmed ON pixel_achats(grille_id, confirmed_at) WHERE confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pixel_achats_stripe ON pixel_achats(stripe_session_id);

-- Activer Realtime sur pixel_achats (pour la révélation en direct)
ALTER PUBLICATION supabase_realtime ADD TABLE pixel_achats;
