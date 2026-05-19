import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export const maxDuration = 300;

const BUCKET = 'hero-photos';
const MAX_WIDTH = 600;
const QUALITY = 80;
const SKIP_BELOW_KB = 100;

interface Result {
  path: string;
  before: number;
  after: number;
  skipped: boolean;
}

interface FileError {
  path: string;
  error: string;
}

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
      if (/\.(jpe?g|png|webp)$/i.test(item.name)) {
        paths.push(fullPath);
      }
    } else {
      const nested = await listFilesRecursive(supabase, fullPath);
      paths.push(...nested);
    }
  }
  return paths;
}

export async function GET() {
  const authClient = createClient();
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

  const compressed = results.filter(r => !r.skipped);
  const totalBefore = compressed.reduce((s, r) => s + r.before, 0);
  const totalAfter = compressed.reduce((s, r) => s + r.after, 0);
  const savedBytes = totalBefore - totalAfter;

  return NextResponse.json({
    total: files.length,
    compressed: compressed.length,
    skipped: results.filter(r => r.skipped).length,
    errors: errors.length,
    saved: `${(savedBytes / 1024 / 1024).toFixed(2)} MB economises`,
    before: `${(totalBefore / 1024 / 1024).toFixed(2)} MB`,
    after: `${(totalAfter / 1024 / 1024).toFixed(2)} MB`,
    details: results,
    errorDetails: errors,
  });
}
