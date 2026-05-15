import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('adoption_posts')
    .select('id,poster_name,animal_type,breed,age,gender,region,description,reason,photo_urls,created_at,updated_at')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  return NextResponse.json({ post: data });
}
