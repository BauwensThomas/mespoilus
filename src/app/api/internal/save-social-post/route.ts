import { NextRequest, NextResponse } from 'next/server';
import { downloadAndStorePhoto } from '@/lib/unsplash-storage';

const FALLBACK_BY_CATEGORY: Record<string, string> = {
  chiens:   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  chats:    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
  oiseaux:  'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1200&q=80',
  rongeurs: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1200&q=80',
  reptiles: 'https://images.unsplash.com/photo-1519439050986-9cd34fc28ddc?w=1200&q=80',
  general:  'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=1200&q=80',
};

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

async function getImageUrl(): Promise<string> {
  // 1. Chercher l'image de l'article le plus récent (créé par le cron blog)
  const res = await supabaseFetch('articles', 'GET', undefined,
    'status=eq.published&order=published_at.desc&limit=1&select=image_url,category');
  const rows = res.data as { image_url: string | null; category: string }[] | null;
  const article = rows?.[0];

  if (article?.image_url) {
    console.log('[save-post] image article récent:', article.image_url.slice(0, 60));
    return article.image_url;
  }

  // 2. Fallback catégorie : télécharger + stocker dans Supabase Storage
  const category = article?.category ?? 'general';
  const fallbackUnsplashUrl = FALLBACK_BY_CATEGORY[category] ?? FALLBACK_BY_CATEGORY.general;
  const stored = await downloadAndStorePhoto(fallbackUnsplashUrl, `social-fallback-${category}.jpg`);
  if (stored) {
    console.log('[save-post] image fallback stockée Supabase:', stored.slice(0, 60));
    return stored;
  }

  // 3. Dernier recours : URL Unsplash directe
  console.log('[save-post] image fallback URL directe (Supabase KO)');
  return fallbackUnsplashUrl;
}

export async function POST(req: NextRequest) {
  const { content, hashtags } = await req.json() as { content: string; hashtags: string[] };

  // Récupérer l'image (article récent > fallback Supabase > fallback URL directe)
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
      const res = await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
          hashtags: hashtags.join(' '),
          image_url: imageUrl,
        }),
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
