-- Enrichit qr_scans avec 2 colonnes supplémentaires, dans la même catégorie légale
-- que city/country (données techniques déjà couvertes par la politique de confidentialité
-- section 2.4 : "type de navigateur, date et heure" à chaque connexion).
-- Volontairement PAS de : latitude/longitude précise, cookie de suivi, fingerprint.
ALTER TABLE qr_scans
  ADD COLUMN IF NOT EXISTS region   TEXT, -- région/province (x-vercel-ip-country-region), plus fin que country
  ADD COLUMN IF NOT EXISTS language TEXT; -- langue navigateur (Accept-Language), ex: "fr-BE"
