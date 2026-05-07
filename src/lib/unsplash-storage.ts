import { createAdminClient } from '@/lib/supabase/server';

export async function downloadAndStorePhoto(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error || !data) return null;
    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch {
    return null;
  }
}
