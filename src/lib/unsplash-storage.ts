import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';

const MAX_WIDTH = 1200;
const QUALITY = 80;

/** Compresse l'image (resize ≤1200px + JPEG q80) pour limiter l'egress Supabase.
 *  Si sharp échoue (format exotique), on garde le buffer d'origine. */
async function compress(buffer: ArrayBuffer): Promise<Buffer> {
  try {
    return await sharp(Buffer.from(buffer))
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, progressive: true })
      .toBuffer();
  } catch {
    return Buffer.from(buffer);
  }
}

/**
 * Télécharge une image, la COMPRESSE (≤1200px, q80) et la stocke dans Supabase Storage
 * (bucket blog-images). Timeout interne via AbortController + retries → garantit au mieux
 * que l'image appartient à Mes Poilus (survit à la suppression de la source Pexels/Awin).
 * La compression à la source évite tout futur dépassement du Cached Egress Supabase.
 * Retourne l'URL publique Supabase, ou null si tous les essais échouent.
 */
export async function downloadAndStorePhoto(
  imageUrl: string,
  filename: string,
  opts?: { timeoutMs?: number; retries?: number }
): Promise<string | null> {
  const timeoutMs = opts?.timeoutMs ?? 12000;
  const maxAttempts = (opts?.retries ?? 2) + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(imageUrl, { signal: ctrl.signal });
      if (!res.ok) {
        clearTimeout(t);
        console.error(`[storage] fetch échoué (tentative ${attempt}/${maxAttempts}):`, res.status, imageUrl.slice(0, 80));
        continue;
      }
      const rawBuffer = await res.arrayBuffer();
      clearTimeout(t);
      const buffer = await compress(rawBuffer);
      console.log('[storage] image téléchargée:', rawBuffer.byteLength, '→ compressée:', buffer.byteLength, 'bytes');

      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
      if (error || !data) {
        console.error(`[storage] upload Supabase erreur (tentative ${attempt}/${maxAttempts}):`, error?.message ?? 'pas de data');
        continue;
      }
      const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(data.path);
      console.log('[storage] ✅ image stockée:', urlData.publicUrl.slice(0, 80));
      return urlData.publicUrl;
    } catch (err) {
      clearTimeout(t);
      const aborted = err instanceof Error && err.name === 'AbortError';
      console.error(`[storage] ${aborted ? 'timeout' : 'exception'} (tentative ${attempt}/${maxAttempts}):`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}
