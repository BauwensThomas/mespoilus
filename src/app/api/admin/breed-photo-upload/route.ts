import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const breedId = form.get('breedId') as string | null;

  if (!file || !breedId) {
    return NextResponse.json({ error: 'Fichier et breedId requis' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `races/${breedId}.${ext}`;

  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from('hero-photos')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('hero-photos')
    .getPublicUrl(path);

  const { error: dbError } = await supabase
    .from('breeds')
    .update({ photo_url: publicUrl })
    .eq('id', breedId);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: publicUrl });
}
