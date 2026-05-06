import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const animal = searchParams.get('animal');

  const supabase = createAdminClient();
  let query = supabase
    .from('adoption_posts')
    .select('id,poster_name,animal_type,breed,age,gender,region,description,contact_info,created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (animal && animal !== 'all') query = query.eq('animal_type', animal);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  return NextResponse.json(data ?? []);
}
