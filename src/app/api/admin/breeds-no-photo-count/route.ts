import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('breeds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('photo_url', null);

  if (error) return NextResponse.json({ count: 0 });
  return NextResponse.json({ count: count ?? 0 });
}
