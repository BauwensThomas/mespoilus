import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`stats:${ip}`, 60_000, 20);

  if (!allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    const supabase = createAdminClient();

    const [statsRes, logsRes, articlesRes, socialRes] = await Promise.all([
      supabase.from('agent_stats').select('*'),
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('articles')
        .select('id, title, slug, category, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5),
      supabase
        .from('social_posts')
        .select('id, platform, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return NextResponse.json({
      agentStats: statsRes.data ?? [],
      recentActivity: logsRes.data ?? [],
      recentArticles: articlesRes.data ?? [],
      recentSocialPosts: socialRes.data ?? [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur base de données';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
