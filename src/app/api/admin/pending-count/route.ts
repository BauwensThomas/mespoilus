import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET() {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

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
