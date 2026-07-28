import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const [adoptionRes, commentsRes, reviewsRes] = await Promise.all([
      supabase
        .from('adoption_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('article_comments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);
    return NextResponse.json({
      count: adoptionRes.count ?? 0,
      commentCount: commentsRes.count ?? 0,
      reviewCount: reviewsRes.count ?? 0,
    });
  } catch {
    return NextResponse.json({ count: 0, commentCount: 0, reviewCount: 0 });
  }
}
