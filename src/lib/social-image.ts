import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase/server';

// Instagram refuse les photos hors du ratio 4:5 (0.8) - 1.91:1 (erreur 36003 "aspect ratio
// not supported") ; les images d'articles (Pexels) et les photos d'annonces adoption (upload
// utilisateur) ont un ratio arbitraire. On recadre au centre vers le ratio autorisé le plus proche.
const IG_MIN_RATIO = 0.8;
const IG_MAX_RATIO = 1.91;

export async function cropForInstagram(buf: Buffer): Promise<Buffer> {
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 1080;
  const h = meta.height ?? 1080;
  const ratio = w / h;
  const targetRatio = Math.min(IG_MAX_RATIO, Math.max(IG_MIN_RATIO, ratio));

  const outW = targetRatio <= ratio ? Math.round(h * targetRatio) : w;
  const outH = targetRatio <= ratio ? h : Math.round(w / targetRatio);

  return sharp(buf)
    .resize(outW, outH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Prépare l'image envoyée au webhook Make -> Facebook/Instagram : recadrage au ratio Instagram
 * puis stockage dans Supabase Storage (blog-images/social/), pour donner à Meta une URL statique
 * .jpg servie par le CDN Supabase. Le proxy dynamique /api/social-image (fonction Vercel derrière
 * le middleware) n'était pas toujours joignable par le robot d'Instagram : la requête n'arrivait
 * jamais et Instagram répondait "Only photo or video can be accepted as media type" (9004).
 * Repli sur le proxy si le stockage échoue.
 */
export async function prepareSocialImage(src: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mespoilus.com';
  const proxyUrl = `${baseUrl}/api/social-image?src=${encodeURIComponent(src)}`;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const jpeg = await cropForInstagram(Buffer.from(await res.arrayBuffer()));

    const path = `social/ig-${createHash('sha1').update(src).digest('hex').slice(0, 16)}.jpg`;
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from('blog-images')
      .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
    if (error) throw new Error(error.message);

    const publicUrl = supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
    console.log('[social-image] image stockée:', publicUrl.slice(0, 100));
    return publicUrl;
  } catch (err) {
    console.error('[social-image] stockage échoué, repli sur le proxy:', err instanceof Error ? err.message : err);
    return proxyUrl;
  }
}
