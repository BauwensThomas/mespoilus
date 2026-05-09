import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from('adoption_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
