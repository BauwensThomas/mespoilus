import { createAdminClient } from '@/lib/supabase/server';

/**
 * Télécharge une image et la stocke dans Supabase Storage (bucket blog-images).
 * Timeout interne via AbortController + retries → garantit au mieux que l'image
 * appartient à Mes Poilus (survit à la suppression de la source Pexels/Awin).
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
      const buffer = await res.arrayBuffer();
      clearTimeout(t);
      console.log('[storage] image téléchargée:', buffer.byteLength, 'bytes');

      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true });
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
