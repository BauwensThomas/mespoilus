import { NextRequest, NextResponse } from 'next/server';
import { getPhotoForCategory } from '@/lib/pexels';
import { downloadAndStorePhoto } from '@/lib/unsplash-storage';

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

async function getImageUrl(): Promise<string | null> {
  // 1. Image de l'article le plus récent déjà stockée dans Supabase
  const res = await supabaseFetch('articles', 'GET', undefined,
    'status=eq.published&image_url=not.is.null&order=published_at.desc&limit=1&select=image_url,category');
  const rows = res.data as { image_url: string; category: string }[] | null;

  if (rows?.[0]?.image_url) {
    console.log('[save-post] image article récent:', rows[0].image_url.slice(0, 60));
    return rows[0].image_url;
  }

  // 2. Fallback via Pexels + stockage Supabase
  const category = rows?.[0]?.category ?? 'general';
  try {
    const photo = await getPhotoForCategory(category);
    if (!photo) { console.log('[save-post] Pexels aucun résultat -post sans image'); return null; }
    const stored = await downloadAndStorePhoto(photo.url, `social-fallback-${category}.jpg`);
    console.log('[save-post] image fallback Pexels:', stored ? 'stockée' : 'URL directe');
    return stored ?? photo.url;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { content, hashtags } = await req.json() as { content: string; hashtags: string[] };

  const imageUrl = await getImageUrl();

  for (const platform of ['facebook', 'instagram']) {
    const r = await supabaseFetch('social_posts', 'POST', { content, platform, hashtags, status: 'draft' });
    console.log(`[save-post] social_posts ${platform}:`, r.ok ? 'OK' : `erreur ${r.status}`);
  }

  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const body: Record<string, string> = {
        content: content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
        hashtags: hashtags.join(' '),
      };
      if (imageUrl) body.image_url = imageUrl;

      const res = await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      console.log('[save-post] webhook:', res.ok ? 'OK' : `erreur ${res.status}`);
    } catch (err) {
      clearTimeout(t);
      console.log('[save-post] webhook exception:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ ok: true });
}
