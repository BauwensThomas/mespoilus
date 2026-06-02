import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const imageUrl = (formData.get('image_url') as string | null)?.trim();
  const animal = (formData.get('animal') as string | null)?.trim();
  const raceSecrete = (formData.get('race_secrete') as string | null)?.trim();

  if ((!file && !imageUrl) || !animal || !raceSecrete) {
    return NextResponse.json({ error: 'Image (fichier ou URL), animal et race secrète sont obligatoires' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Source de l'image : fichier uploadé OU téléchargement depuis une URL
  let sourceBytes: ArrayBuffer;
  try {
    if (file) {
      sourceBytes = await file.arrayBuffer();
    } else {
      const res = await fetch(imageUrl!, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) throw new Error('URL non-image');
      sourceBytes = await res.arrayBuffer();
    }
  } catch (e) {
    return NextResponse.json({ error: `Image inaccessible : ${e instanceof Error ? e.message : 'erreur'}` }, { status: 400 });
  }

  // Redimensionne en carré 1500×1500 et stocke en PNG dans le bucket privé pixel-grilles
  let buffer: Buffer;
  try {
    buffer = await sharp(Buffer.from(sourceBytes))
      .resize(1500, 1500, { fit: 'cover' })
      .png()
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Image illisible' }, { status: 400 });
  }

  const imagePath = `grille-${Date.now()}.png`;
  const { error: upErr } = await admin.storage
    .from('pixel-grilles')
    .upload(imagePath, buffer, { contentType: 'image/png', upsert: false });
  if (upErr) return NextResponse.json({ error: `Upload: ${upErr.message}` }, { status: 500 });

  // Ordre = max(ordre) + 1
  const { data: last } = await admin
    .from('pixel_grilles')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordre = (last?.ordre ?? 0) + 1;

  const { data: grille, error: insErr } = await admin
    .from('pixel_grilles')
    .insert({
      animal,
      race_secrete: raceSecrete,
      statut: 'scheduled',
      grille_taille: 75,
      image_path: imagePath,
      image_taille: 1500,
      ordre,
    })
    .select('id')
    .single();

  if (insErr) return NextResponse.json({ error: `Insert: ${insErr.message}` }, { status: 500 });

  return NextResponse.json({ success: true, id: grille.id, ordre });
}
