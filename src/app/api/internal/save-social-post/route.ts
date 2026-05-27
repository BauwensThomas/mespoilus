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

async function getImageUrl(articleSlug?: string): Promise<string | null> {
  // Priorité 1: Récupérer l'image de l'article lui-même
  if (articleSlug) {
    const res = await supabaseFetch('articles', 'GET', undefined,
      `slug=eq.${articleSlug}&select=image_url,category`);
    const row = (res.data as { image_url?: string; category?: string }[] | null)?.[0];
    
    if (row?.image_url) {
      console.log(`[save-post] image de l'article "${articleSlug}" trouvée:`, row.image_url.slice(0, 80));
      return row.image_url;
    }
    
    // Fallback: si l'article n'a pas d'image, utiliser la catégorie pour Pexels
    const category = row?.category ?? 'general';
    console.log(`[save-post] article sans image, fallback Pexels pour catégorie: ${category}`);
    try {
      const photo = await getPhotoForCategory(category, undefined, 'square');
      if (!photo) { console.log('[save-post] Pexels aucun résultat - post sans image'); return null; }
      const stored = await downloadAndStorePhoto(photo.url, `social-square-${category}.jpg`);
      console.log('[save-post] image Pexels fallback:', stored ? 'stockée' : 'URL directe');
      return stored ?? photo.url;
    } catch {
      return null;
    }
  }

  // Fallback si pas de slug: utiliser la catégorie du dernier article
  const res = await supabaseFetch('articles', 'GET', undefined,
    'status=eq.published&order=published_at.desc&limit=1&select=category');
  const rows = res.data as { category: string }[] | null;
  const category = rows?.[0]?.category ?? 'general';

  try {
    const photo = await getPhotoForCategory(category, undefined, 'square');
    if (!photo) { console.log('[save-post] Pexels aucun résultat - post sans image'); return null; }
    const stored = await downloadAndStorePhoto(photo.url, `social-square-${category}.jpg`);
    console.log('[save-post] image Pexels:', stored ? 'stockée' : 'URL directe');
    return stored ?? photo.url;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content, hashtags, overrideImageUrl } = await req.json() as { content: string; hashtags: string[]; overrideImageUrl?: string };

  // Extraire le slug du contenu du post (lien https://www.mespoilus.com/blog/{slug})
  const slugMatch = content.match(/https:\/\/www\.mespoilus\.com\/blog\/([a-z0-9\-]+)/i);
  const articleSlug = slugMatch?.[1];
  console.log(`[save-post] slug extrait du contenu: ${articleSlug ?? 'non trouvé'}`);

  const imageUrl = overrideImageUrl ?? await getImageUrl(articleSlug);
  if (overrideImageUrl) console.log('[save-post] image override:', overrideImageUrl.slice(0, 80));

  for (const platform of ['facebook', 'instagram']) {
    const r = await supabaseFetch('social_posts', 'POST', { content, platform, hashtags, status: 'draft' });
    console.log(`[save-post] social_posts ${platform}:`, r.ok ? 'OK' : `erreur ${r.status}`);
  }

  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      // Extraire le lien de l'article du contenu
      const articleLinkMatch = content.match(/https:\/\/(?:www\.)?mespoilus\.com\/blog\/[a-z0-9\-]+/i);
      const articleLink = articleLinkMatch?.[0] ?? '';

      const body: Record<string, string> = {
        content: content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
        hashtags: hashtags.join(' '),
      };
      if (imageUrl) body.image_url = imageUrl;
      if (articleLink) body.article_url = articleLink; // Lien explicite pour Make/Facebook

      const res = await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      console.log('[save-post] webhook:', res.ok ? 'OK' : `erreur ${res.status}`, articleLink ? `(lien: ${articleLink.slice(0, 50)})` : '');
    } catch (err) {
      clearTimeout(t);
      console.log('[save-post] webhook exception:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ ok: true });
}
