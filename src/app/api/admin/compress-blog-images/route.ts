import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export const maxDuration = 300;

// Recompresse les images du bucket blog-images (heros d'articles, images Pexels).
// Beaucoup étaient stockées en 1880px (large2x) → on les réduit à 1200px qualité 80,
// ce qui divise fortement le Cached Egress Supabase sans perte visible (affichage ≤ 940px).
const BUCKET = 'blog-images';
const MAX_WIDTH = 1200;
const QUALITY = 80;
const SKIP_BELOW_KB = 120;

interface Result { path: string; before: number; after: number; skipped: boolean }
interface FileError { path: string; error: string }

async function listFilesRecursive(
  supabase: ReturnType<typeof createAdminClient>,
  prefix = ''
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];

  const paths: string[] = [];
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      if (/\.(jpe?g|png|webp)$/i.test(item.name)) paths.push(fullPath);
    } else {
      const nested = await listFilesRecursive(supabase, fullPath);
      paths.push(...nested);
    }
  }
  return paths;
}

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const supabase = createAdminClient();
  const results: Result[] = [];
  const errors: FileError[] = [];

  const files = await listFilesRecursive(supabase);

  for (const path of files) {
    try {
      const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(path);
      if (dlError || !blob) throw new Error(dlError?.message ?? 'Download failed');

      const buffer = Buffer.from(await blob.arrayBuffer());
      if (buffer.length < SKIP_BELOW_KB * 1024) {
        results.push({ path, before: buffer.length, after: buffer.length, skipped: true });
        continue;
      }

      const compressed = await sharp(buffer)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: QUALITY, progressive: true })
        .toBuffer();

      // On ne ré-uploade que si on gagne réellement de l'espace
      if (compressed.length >= buffer.length) {
        results.push({ path, before: buffer.length, after: buffer.length, skipped: true });
        continue;
      }

      const { error: upError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });
      if (upError) throw new Error(upError.message);

      results.push({ path, before: buffer.length, after: compressed.length, skipped: false });
    } catch (e) {
      errors.push({ path, error: String(e) });
    }
  }

  const done = results.filter(r => !r.skipped);
  const totalBefore = done.reduce((s, r) => s + r.before, 0);
  const totalAfter = done.reduce((s, r) => s + r.after, 0);
  const saved = totalBefore - totalAfter;

  return NextResponse.json({
    bucket: BUCKET,
    total: files.length,
    compressed: done.length,
    skipped: results.filter(r => r.skipped).length,
    errors: errors.length,
    saved: `${(saved / 1024 / 1024).toFixed(2)} MB économisés`,
    before: `${(totalBefore / 1024 / 1024).toFixed(2)} MB`,
    after: `${(totalAfter / 1024 / 1024).toFixed(2)} MB`,
    errorDetails: errors,
  });
}
