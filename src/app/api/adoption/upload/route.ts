import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`upload:${ip}`, 3_600_000, 25);
  if (!allowed) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    if (!file.type.startsWith('image/'))
      return NextResponse.json({ error: 'Seules les images sont acceptées' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });

    const original = Buffer.from(await file.arrayBuffer());

    // Conversion en JPEG (exigé par l'API Instagram via Make) + auto-rotation EXIF
    // et redimensionnement pour limiter l'egress. Repli sur l'original si sharp échoue.
    let buffer: Buffer = original;
    let contentType = file.type;
    let ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    try {
      buffer = await sharp(original)
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer();
      contentType = 'image/jpeg';
      ext = 'jpg';
    } catch {
      // format exotique non décodable par sharp : on garde l'original
    }

    const path = `${randomUUID()}.${ext}`;
    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from('adoption-photos')
      .upload(path, buffer, { contentType, upsert: false });

    if (error) {
      console.error('[adoption:upload]', error);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('adoption-photos')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[adoption:upload] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
