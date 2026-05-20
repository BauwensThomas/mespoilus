import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bandeau = searchParams.get('bandeau');

  const supabase = createAdminClient();
  let query = supabase.from('partenaires').select('*').eq('actif', true).order('ordre', { ascending: true }).order('created_at', { ascending: true });

  if (bandeau === '1') query = query.eq('in_bandeau', true);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}
