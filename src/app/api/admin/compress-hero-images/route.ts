import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

export const maxDuration = 300;

// Compresse en un seul passage les DEUX buckets d'images servies directement
// (egress Supabase). blog-images (heros d'articles, ~1200px) + hero-photos (races, ~600px).
const BUCKETS: Array<{ name: string; maxWidth: number; skipBelowKb: number }> = [
  { name: 'blog-images', maxWidth: 1200, skipBelowKb: 120 },
  { name: 'hero-photos', maxWidth: 600,  skipBelowKb: 100 },
];
const QUALITY = 80;

interface Result { bucket: string; path: string; before: number; after: number; skipped: boolean }
interface FileError { bucket: string; path: string; error: string }

async function listFilesRecursive(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix = ''
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];

  const paths: string[] = [];
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      if (/\.(jpe?g|png|webp)$/i.test(item.name)) paths.push(fullPath);
    } else {
      const nested = await listFilesRecursive(supabase, bucket, fullPath);
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
  let totalFiles = 0;

  for (const { name: bucket, maxWidth, skipBelowKb } of BUCKETS) {
    const files = await listFilesRecursive(supabase, bucket);
    totalFiles += files.length;

    for (const path of files) {
      try {
        const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(path);
        if (dlError || !blob) throw new Error(dlError?.message ?? 'Download failed');

        const buffer = Buffer.from(await blob.arrayBuffer());
        if (buffer.length < skipBelowKb * 1024) {
          results.push({ bucket, path, before: buffer.length, after: buffer.length, skipped: true });
          continue;
        }

        const compressed = await sharp(buffer)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .jpeg({ quality: QUALITY, progressive: true })
          .toBuffer();

        if (compressed.length >= buffer.length) {
          results.push({ bucket, path, before: buffer.length, after: buffer.length, skipped: true });
          continue;
        }

        const { error: upError } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });
        if (upError) throw new Error(upError.message);

        results.push({ bucket, path, before: buffer.length, after: compressed.length, skipped: false });
      } catch (e) {
        errors.push({ bucket, path, error: String(e) });
      }
    }
  }

  const done = results.filter(r => !r.skipped);
  const totalBefore = done.reduce((s, r) => s + r.before, 0);
  const totalAfter = done.reduce((s, r) => s + r.after, 0);
  const savedBytes = totalBefore - totalAfter;
  const savedLabel = `${(savedBytes / 1024 / 1024).toFixed(2)} MB économisés`;

  // Comptes par bucket pour l'email
  const perBucket = BUCKETS.map(b => {
    const d = done.filter(r => r.bucket === b.name).length;
    const tot = results.filter(r => r.bucket === b.name).length;
    return { label: b.name, value: `${d}/${tot}`, color: '#0d9488' };
  });

  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Compression images - ${done.length} image${done.length > 1 ? 's' : ''} compressée${done.length > 1 ? 's' : ''}`,
      html: cronEmailWrapper(
        'Compression images terminée',
        'Maintenance',
        statsRow([
          ...perBucket,
          { label: 'Espace gagné', value: savedLabel,                            color: '#059669' },
          { label: 'Erreurs',      value: errors.length,                          color: errors.length ? '#dc2626' : '#6b7280' },
        ]) + (errors.length ? `<p style="color:#dc2626;font-size:13px;margin-top:12px">⚠ ${errors.length} fichier${errors.length > 1 ? 's' : ''} en erreur</p>` : ''),
      ),
    });
  } catch (e) { console.error('[compress] email erreur:', e); }

  return NextResponse.json({
    total: totalFiles,
    compressed: done.length,
    skipped: results.filter(r => r.skipped).length,
    errors: errors.length,
    saved: savedLabel,
    before: `${(totalBefore / 1024 / 1024).toFixed(2)} MB`,
    after: `${(totalAfter / 1024 / 1024).toFixed(2)} MB`,
    errorDetails: errors,
  });
}
