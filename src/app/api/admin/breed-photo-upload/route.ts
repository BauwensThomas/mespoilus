import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

async function uploadToSupabase(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>,
  buffer: ArrayBuffer,
  contentType: string,
  breedId: string,
): Promise<string> {
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `races/${breedId}.${ext}`;

  const { error } = await supabase.storage
    .from('hero-photos')
    .upload(path, buffer, { upsert: true, contentType });

  if (error) throw new Error(error.message);

  return supabase.storage.from('hero-photos').getPublicUrl(path).data.publicUrl;
}

// Upload depuis fichier (FormData)
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const breedId = form.get('breedId') as string | null;

  if (!file || !breedId) {
    return NextResponse.json({ error: 'Fichier et breedId requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const buffer = await file.arrayBuffer();

  try {
    const publicUrl = await uploadToSupabase(supabase, buffer, file.type || 'image/jpeg', breedId);
    await supabase.from('breeds').update({ photo_url: publicUrl }).eq('id', breedId);
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Télécharger depuis URL externe → stocker dans Supabase
export async function PUT(req: NextRequest) {
  const { breedId, url } = await req.json();
  if (!breedId || !url) {
    return NextResponse.json({ error: 'breedId et url requis' }, { status: 400 });
  }

  let buffer: ArrayBuffer;
  let contentType: string;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    contentType = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new Error('URL ne pointe pas vers une image');
    buffer = await res.arrayBuffer();
  } catch (e: unknown) {
    return NextResponse.json({ error: `Téléchargement échoué : ${(e as Error).message}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  try {
    const publicUrl = await uploadToSupabase(supabase, buffer, contentType, breedId);
    await supabase.from('breeds').update({ photo_url: publicUrl }).eq('id', breedId);
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
