import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`blog:${ip}`, 60_000, 30);

  if (!allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('articles')
      .select('id, title, slug, excerpt, category, seo_keywords, reading_time, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ articles: data ?? [], total: count ?? 0, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur base de données';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
