import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const animal = req.nextUrl.searchParams.get('animal');
  const supabase = createAdminClient();

  let query = supabase
    .from('breeds')
    .select('id, name, slug, animal, photo_url, photo_focus, status, content')
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (animal) query = query.eq('animal', animal);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ breeds: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, photo_url, photo_focus, content } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {};
  // Nouvelle photo : l'ancien cadrage ne s'applique plus
  if ('photo_url' in body) { update.photo_url = photo_url || null; update.photo_focus = null; }
  if ('photo_focus' in body) update.photo_focus = typeof photo_focus === 'string' && /^\d{1,3} \d{1,3} \d(\.\d+)?$/.test(photo_focus) ? photo_focus : null;
  if ('content' in body)   update.content   = content;

  const { error } = await supabase.from('breeds').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
