-- Table produits Awin (synchronisée toutes les 24h)
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'EUR',
  image_url     TEXT,
  affiliate_url TEXT NOT NULL,
  merchant_name TEXT,
  category      TEXT NOT NULL, -- chiens, chats, oiseaux, rongeurs, reptiles, general
  in_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_in_stock_idx ON products(in_stock);
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price);

-- À exécuter dans Supabase SQL Editor après avoir configuré les clés Awin
