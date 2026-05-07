import { createAdminClient } from '@/lib/supabase/server';

export async function downloadAndStorePhoto(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.error('[storage] fetch image échoué:', res.status, imageUrl.slice(0, 80));
      return null;
    }
    const buffer = await res.arrayBuffer();
    console.log('[storage] image téléchargée:', buffer.byteLength, 'bytes');
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) {
      console.error('[storage] upload Supabase erreur:', error.message);
      return null;
    }
    if (!data) {
      console.error('[storage] upload Supabase: pas de data');
      return null;
    }
    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(data.path);
    console.log('[storage] ✅ image stockée:', urlData.publicUrl.slice(0, 80));
    return urlData.publicUrl;
  } catch (err) {
    console.error('[storage] exception:', err instanceof Error ? err.message : err);
    return null;
  }
}
