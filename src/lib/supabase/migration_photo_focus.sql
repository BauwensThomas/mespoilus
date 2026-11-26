-- Cadrage des photos (26/11/2026) : "x y zoom" en pourcentages (ex. "50 20 1.3"), réglé à la main
-- dans l'admin (PhotoFrameEditor). Lu par frameStyle() (src/lib/image-focus.ts). NULL = cadrage par défaut.
ALTER TABLE breeds ADD COLUMN IF NOT EXISTS photo_focus text;
ALTER TABLE adoption_posts ADD COLUMN IF NOT EXISTS photo_focus text[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_focus text;
