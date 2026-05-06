import { NextRequest, NextResponse } from 'next/server';

async function supabaseFetch(path: string, method: string, body?: unknown, params?: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const url = `${base}/rest/v1/${path}${params ? `?${params}` : ''}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const data = res.ok && method === 'GET' ? await res.json().catch(() => []) : null;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: 0, data: err instanceof Error ? err.message : 'timeout' };
  }
}

export async function POST(req: NextRequest) {
  const { content, hashtags } = await req.json() as { content: string; hashtags: string[] };
  const FALLBACK: Record<string, string> = {
    chien:  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
    chat:   'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
    oiseau: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1200&q=80',
    rongeur:'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1200&q=80',
    reptile:'https://images.unsplash.com/photo-1519439050986-9cd34fc28ddc?w=1200&q=80',
    default:'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=1200&q=80',
  };
  const query = hashtags[0]?.replace('#', '') || 'animaux';
  const fallbackKey = Object.keys(FALLBACK).find(k => k !== 'default' && query.toLowerCase().includes(k));
  const imageUrl = FALLBACK[fallbackKey ?? 'default'];

  // INSERT social_posts
  for (const platform of ['facebook', 'instagram']) {
    const r = await supabaseFetch('social_posts', 'POST', { content, platform, hashtags, status: 'draft' });
    console.log(`[save-post] social_posts ${platform}:`, r.ok ? 'OK' : `erreur ${r.status}`);
  }

  // activity_logs
  const logRes = await supabaseFetch('activity_logs', 'POST', {
    agent_id: 'emma',
    agent_name: 'Emma',
    action: 'Post réseaux sociaux publié',
    status: 'success',
    duration_ms: 0,
    details: { platforms: ['facebook', 'instagram'], hashtags_count: hashtags.length, image_url: imageUrl },
  });
  console.log('[save-post] activity_logs:', logRes.ok ? 'OK' : `erreur ${logRes.status}`);

  // agent_stats
  const selectRes = await supabaseFetch('agent_stats', 'GET', undefined, 'agent_id=eq.emma&select=tasks_completed,tasks_failed,total_tokens_used');
  const rows = selectRes.data as { tasks_completed: number; tasks_failed: number; total_tokens_used: number }[] | null;
  const row = rows?.[0];
  if (!row) {
    await supabaseFetch('agent_stats', 'POST', { agent_id: 'emma', tasks_completed: 1, tasks_failed: 0, total_tokens_used: 0, last_active: new Date().toISOString() });
  } else {
    await supabaseFetch('agent_stats', 'PATCH', {
      tasks_completed: (row.tasks_completed ?? 0) + 1,
      last_active: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, 'agent_id=eq.emma');
  }
  console.log('[save-post] agent_stats: OK');

  // Webhooks Make
  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    for (const platform of ['facebook', 'instagram']) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(makeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            content: content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
            hashtags: hashtags.join(' '),
            image_url: imageUrl,
          }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        console.log(`[save-post] webhook ${platform}:`, res.ok ? 'OK' : `erreur ${res.status}`);
      } catch (err) {
        clearTimeout(t);
        console.log(`[save-post] webhook ${platform} exception:`, err instanceof Error ? err.message : err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
