import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mode = (form.get('mode') as string) ?? 'card';

  const webp = mode === 'image'
    ? await sharp(buffer).resize(480, 360, { fit: 'cover' }).webp({ quality: 85 }).toBuffer()
    : await sharp(buffer).resize(320, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).webp({ quality: 90 }).toBuffer();

  const filename = `logo-${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from('partner-logos')
    .upload(filename, webp, { contentType: 'image/webp', upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('partner-logos').getPublicUrl(filename);
  return NextResponse.json({ url: publicUrl });
}
