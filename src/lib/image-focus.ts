/**
 * Cadrage des photos (26/11/2026) : où se placer dans la photo quand un cadre la recadre
 * (object-cover), et de combien zoomer. Réglé à la main dans l'admin (PhotoFrameEditor), enregistré
 * en texte "x y zoom" (ex. "50 20 1.3") : breeds.photo_focus, adoption_posts.photo_focus[].
 * Sans réglage : un peu vers le haut, là où se trouve presque toujours la tête de l'animal.
 * Utilisable côté client et côté serveur.
 */
export interface PhotoFrame { x: number; y: number; zoom: number }

export const DEFAULT_FRAME: PhotoFrame = { x: 50, y: 30, zoom: 1 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function parseFrame(value: string | null | undefined): PhotoFrame {
  const [x, y, zoom] = (value ?? '').trim().split(/\s+/).map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return DEFAULT_FRAME;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), zoom: Number.isFinite(zoom) ? clamp(zoom, 1, 3) : 1 };
}

export const serializeFrame = (f: PhotoFrame) => `${Math.round(f.x)} ${Math.round(f.y)} ${Math.round(f.zoom * 100) / 100}`;

/** Style à passer à une image en object-cover (compatible avec les effets de survol en scale). */
export function frameStyle(value: string | null | undefined): React.CSSProperties {
  const f = parseFrame(value);
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    ...(f.zoom > 1 ? { scale: String(f.zoom), transformOrigin: `${f.x}% ${f.y}%` } : {}),
  };
}
