import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const animal = searchParams.get('animal');
  if (!animal) return NextResponse.json(null, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('prenoms')
      .select('style, names')
      .eq('animal', animal);

    if (error || !data || data.length === 0) return NextResponse.json(null);

    const result: Record<string, string[]> = {};
    data.forEach(row => { result[row.style] = row.names; });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(null);
  }
}
