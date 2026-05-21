import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const visitorId = searchParams.get('v');
  if (!visitorId) return NextResponse.json({ ids: [] });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('user_favorites')
    .select('catalog_id')
    .eq('visitor_id', visitorId);

  return NextResponse.json({ ids: (data ?? []).map(r => r.catalog_id) });
}

export async function POST(req: Request) {
  const { visitorId, catalogId } = await req.json();
  if (!visitorId || !catalogId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('visitor_id', visitorId)
    .eq('catalog_id', catalogId)
    .single();

  if (existing) {
    await supabase.from('user_favorites').delete().eq('id', existing.id);
    return NextResponse.json({ action: 'removed' });
  } else {
    await supabase.from('user_favorites').insert({ visitor_id: visitorId, catalog_id: catalogId });
    return NextResponse.json({ action: 'added' });
  }
}
