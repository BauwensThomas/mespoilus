import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const animal = req.nextUrl.searchParams.get('animal');
  const supabase = createAdminClient();

  let query = supabase
    .from('breeds')
    .select('id, name, slug, animal, photo_url, status')
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (animal) query = query.eq('animal', animal);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ breeds: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const { id, photo_url } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('breeds')
    .update({ photo_url: photo_url || null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
