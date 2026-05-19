-- Produits masques manuellement par l'admin
-- Survit aux syncs Awin quotidiens (DELETE+INSERT sur products)
CREATE TABLE IF NOT EXISTS products_hidden (
  affiliate_url TEXT PRIMARY KEY,
  hidden_at     TIMESTAMPTZ DEFAULT NOW()
);
