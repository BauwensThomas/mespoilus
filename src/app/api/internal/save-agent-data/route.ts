import { NextRequest, NextResponse } from 'next/server';
import { getPhotoForCategory } from '@/lib/pexels';
import { downloadAndStorePhoto } from '@/lib/unsplash-storage';
import { sendBulkNewsletter } from '@/lib/resend';

async function dbFetch(path: string, method: string, body?: unknown, params?: string) {
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
    if (!res.ok) console.error(`[db] ${method} ${path} erreur ${res.status}`);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(t);
    console.error(`[db] ${method} ${path} exception:`, err instanceof Error ? err.message : err);
    return { ok: false, status: 0, data: null };
  }
}

async function logActivity(agentId: string, agentName: string, action: string, durationMs: number, details: Record<string, unknown>, tokensUsed = 0) {
  await dbFetch('activity_logs', 'POST', { agent_id: agentId, agent_name: agentName, action, status: 'success', duration_ms: durationMs, details, tokens_used: tokensUsed });
}

async function updateAgentStats(agentId: string, tokens: number) {
  const sel = await dbFetch('agent_stats', 'GET', undefined, `agent_id=eq.${agentId}&select=tasks_completed,tasks_failed,total_tokens_used`);
  const rows = sel.data as { tasks_completed: number; tasks_failed: number; total_tokens_used: number }[] | null;
  const row = rows?.[0];
  if (!row) {
    await dbFetch('agent_stats', 'POST', { agent_id: agentId, tasks_completed: 1, tasks_failed: 0, total_tokens_used: tokens, last_active: new Date().toISOString() });
  } else {
    await dbFetch('agent_stats', 'PATCH', {
      tasks_completed: (row.tasks_completed ?? 0) + 1,
      total_tokens_used: (row.total_tokens_used ?? 0) + tokens,
      last_active: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, `agent_id=eq.${agentId}`);
  }
}

async function saveEmma(content: string) {
  const postContent = content.trim();
  const hashtags = postContent.match(/#[\wÀ-ɏ]+/g) || [];
  // 1. Essayer de récupérer l'image de l'article promu (même URL Supabase que le blog)
  let imageUrl: string | null = null;
  const slugMatch = postContent.match(/mespoilus\.com\/blog\/([a-z0-9-]+)/);
  if (slugMatch) {
    try {
      const { data } = await dbFetch('articles', 'GET', undefined, `slug=eq.${slugMatch[1]}&select=image_url`);
      const rows = data as { image_url: string | null }[] | null;
      imageUrl = rows?.[0]?.image_url ?? null;
    } catch { /* fallback */ }
  }

  // 2. Fallback : Pexels → stocker dans Supabase Storage
  if (!imageUrl) {
    try {
      const tag = hashtags[0]?.replace('#', '').toLowerCase() ?? '';
      const cat = tag.includes('chien') || tag.includes('dog') ? 'chiens'
        : tag.includes('chat') || tag.includes('cat') ? 'chats'
        : tag.includes('oiseau') || tag.includes('bird') ? 'oiseaux'
        : tag.includes('rongeur') || tag.includes('lapin') || tag.includes('hamster') ? 'rongeurs'
        : tag.includes('reptile') || tag.includes('lézard') ? 'reptiles'
        : 'general';
      const photo = await getPhotoForCategory(cat);
      if (photo) {
        imageUrl = await downloadAndStorePhoto(photo.url, `social-fallback-${cat}.jpg`) ?? photo.url;
      }
    } catch { /* non-bloquant */ }
  }

  for (const platform of ['facebook', 'instagram']) {
    const r = await dbFetch('social_posts', 'POST', { content: postContent, platform, hashtags, status: 'draft' });
    console.log(`[save-agent] Emma social_posts ${platform}:`, r.ok ? 'OK' : `erreur ${r.status}`);
  }

  // Un seul webhook → Make déclenche Facebook puis Instagram en séquence
  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
          hashtags: hashtags.join(' '),
          image_url: imageUrl,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      console.log('[save-agent] Emma webhook:', res.ok ? 'OK' : `erreur ${res.status}`);
    } catch (err) {
      clearTimeout(t);
      console.log('[save-agent] Emma webhook exception:', err instanceof Error ? err.message : err);
    }
  }
}

async function saveMarie(content: string, overrideImageUrl?: string) {
  let normalized = content.trim();
  const firstLine = normalized.split('\n')[0].trim();
  if (/^```/.test(firstLine)) {
    const lines = normalized.split('\n');
    lines.shift();
    if (lines[lines.length - 1].trim() === '```') lines.pop();
    normalized = lines.join('\n').trim();
  }
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;
  const fm = frontmatterMatch[1];
  const getField = (key: string) => { const m = fm.match(new RegExp(`${key}:\\s*(.+)`)); return m ? m[1].trim() : ''; };
  const title = getField('title');
  // Slugify robuste : retire les accents (NFD) puis tout caractère non ASCII → évite les 404 (ex: "coincé" → "coince")
  const slugify = (s: string) => s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = slugify(getField('slug') || title);
  const excerpt = getField('excerpt');
  const category = getField('category') || 'general';
  const metaDescription = getField('meta_description');
  const readingTime = parseInt(getField('reading_time')) || 5;
  const seoKeywords = getField('seo_keywords').split(',').map(k => k.trim()).filter(Boolean);
  const categoriesRaw = getField('categories');
  const categories = categoriesRaw ? categoriesRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean) : [category];
  const articleContent = normalized.replace(/^---[\s\S]*?---\n/, '').trim();
  if (!title || !slug) return null;

  const socialFooter = `\n\n---\n\n**Rejoins la communauté Mes Poilus !** Suis-nous sur [Instagram](https://www.instagram.com/mespoilusofficiel) et [Facebook](https://www.facebook.com/profile.php?id=61589487954538) pour ne rien manquer des conseils et actualités animalières. 🐾`;
  const contentWithFooter = articleContent + socialFooter;

  // Anti-doublon : si un article avec ce slug ou ce titre existe déjà, on met à jour
  const existing = await dbFetch('articles', 'GET', undefined, `slug=eq.${slug}&select=id`);
  const existingRows = existing.data as { id: string }[] | null;
  if (existingRows && existingRows.length > 0) {
    await dbFetch('articles', 'PATCH', {
      content: contentWithFooter, excerpt, seo_keywords: seoKeywords,
      meta_description: metaDescription, updated_at: new Date().toISOString(),
      ...(overrideImageUrl ? { image_url: overrideImageUrl, image_alt: null, image_credit: null, image_credit_url: null } : {}),
    }, `slug=eq.${slug}`);
    console.log('[save-agent] Marie article mis à jour (doublon évité):', slug);
    return slug;
  }

  let storedImageUrl: string | null = overrideImageUrl ?? null;
  let imageAlt: string | null = null;
  let imageCredit: string | null = null;
  let imageCreditUrl: string | null = null;

  if (!storedImageUrl) {
    let imageData: { url: string; alt: string; credit: string; creditUrl: string } | null = null;
    try {
      imageData = await Promise.race([
        getPhotoForCategory(category),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
    } catch { /* ignore */ }
    if (imageData?.url) {
      storedImageUrl = await downloadAndStorePhoto(imageData.url, `article-${Date.now()}.jpg`) ?? imageData.url;
      imageAlt = imageData.alt;
      imageCredit = imageData.credit;
      imageCreditUrl = imageData.creditUrl;
    }
  }

  // Fallback breeds si Pexels échoue
  if (!storedImageUrl) {
    const CAT_TO_ANIMAL: Record<string, string> = { chiens: 'chien', chats: 'chat', oiseaux: 'oiseau', rongeurs: 'rongeur', reptiles: 'reptile' };
    const animalType = CAT_TO_ANIMAL[category];
    if (animalType) {
      try {
        const breedRes = await dbFetch('breeds', 'GET', undefined,
          `animal=eq.${animalType}&status=eq.published&photo_url=not.is.null&select=photo_url,name&limit=50`
        );
        const breedPhotos = breedRes.data as { photo_url: string; name: string }[] | null;
        if (breedPhotos && breedPhotos.length > 0) {
          const pick = breedPhotos[Math.floor(Math.random() * breedPhotos.length)];
          storedImageUrl = pick.photo_url;
          imageAlt = pick.name;
          console.log('[save-agent] Marie image fallback breed:', pick.name);
        }
      } catch { /* non-bloquant */ }
    }
  }

  const res = await dbFetch('articles', 'POST', {
    title, slug, content: contentWithFooter, excerpt, category, categories,
    seo_keywords: seoKeywords, meta_description: metaDescription,
    reading_time: readingTime, status: 'published',
    published_at: new Date().toISOString(),
    image_url: storedImageUrl, image_alt: imageAlt,
    image_credit: imageCredit, image_credit_url: imageCreditUrl,
  });
  // Si conflict slug → upsert via PATCH
  if (!res.ok) {
    await dbFetch('articles', 'PATCH', { content: contentWithFooter, excerpt, seo_keywords: seoKeywords, meta_description: metaDescription, updated_at: new Date().toISOString() }, `slug=eq.${slug}`);
  }
  console.log('[save-agent] Marie article:', slug);
  return slug;
}

async function saveNathalie(content: string) {
  const match = content.match(/CRITIQUE|ÉLEVÉ|MOYEN|FAIBLE/i);
  const levelMap: Record<string, string> = { CRITIQUE: 'critical', ÉLEVÉ: 'high', MOYEN: 'medium', FAIBLE: 'low' };
  const threatLevel = match ? (levelMap[match[0].toUpperCase()] || 'low') : 'low';
  await dbFetch('security_logs', 'POST', { threat_level: threatLevel, threat_type: 'Security Analysis', action_taken: 'Report generated', blocked: false, details: { analysis: content.slice(0, 2000) } });
  console.log('[save-agent] Nathalie security_logs OK');
}

async function saveAntoine(content: string, task: string) {
  const periodMatch = task.match(/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\d{4})\b/i);
  const period = periodMatch ? periodMatch[0] : new Date().toISOString().slice(0, 7);
  await dbFetch('financial_reports', 'POST', { period: period.slice(0, 100), details: { report: content.slice(0, 5000) } });
  console.log('[save-agent] Antoine financial_reports OK');
}

async function saveSofia(content: string) {
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  let parsed: { subject?: string; preview_text?: string; content_html?: string } = {};
  try { parsed = JSON.parse(cleaned); } catch { parsed = { subject: 'Newsletter Mes Poilus', content_html: content }; }
  if (!parsed.subject || !parsed.content_html) return;

  // Anti-doublon : skip si une campagne envoyée dans les 5 derniers jours
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const recent = await dbFetch('newsletter_campaigns', 'GET', undefined, `status=eq.sent&sent_at=gte.${fiveDaysAgo}&select=id&limit=1`);
  const recentRows = recent.data as { id: string }[] | null;
  if (recentRows && recentRows.length > 0) {
    console.log('[save-agent] Sofia : newsletter déjà envoyée récemment, draft sauvegardé sans envoi');
    await dbFetch('newsletter_campaigns', 'POST', { subject: parsed.subject, preview_text: parsed.preview_text ?? null, content_html: parsed.content_html, status: 'draft' });
    return;
  }

  // Sauvegarder le draft
  const saveRes = await dbFetch('newsletter_campaigns', 'POST', { subject: parsed.subject, preview_text: parsed.preview_text ?? null, content_html: parsed.content_html, status: 'draft' });
  console.log('[save-agent] Sofia newsletter_campaigns OK');

  // Récupérer l'ID du draft créé
  const savedRows = saveRes.data as { id: string }[] | null;
  const campaignId = savedRows?.[0]?.id;

  // Récupérer les abonnés actifs
  const subsRes = await dbFetch('newsletter_subscribers', 'GET', undefined, 'status=eq.active&select=email');
  const subscribers = (subsRes.data as { email: string }[] | null ?? []).map(s => s.email);
  if (subscribers.length === 0) {
    console.log('[save-agent] Sofia : aucun abonné actif, draft sauvegardé sans envoi');
    return;
  }

  // Envoyer via Resend
  const { sent, failed } = await sendBulkNewsletter({ subject: parsed.subject, html: parsed.content_html, subscribers });
  console.log(`[save-agent] Sofia newsletter envoyée : ${sent}/${subscribers.length}`);

  // Marquer comme envoyée
  if (campaignId) {
    await dbFetch('newsletter_campaigns', 'PATCH', {
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipients_count: subscribers.length,
      sent_count: sent,
      failed_count: failed,
      updated_at: new Date().toISOString(),
    }, `id=eq.${campaignId}`);
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { agentId, agentName, content, task, durationMs, tokens, imageUrl } = await req.json() as {
    agentId: string; agentName: string; content: string; task: string; durationMs: number; tokens: number; imageUrl?: string;
  };

  const start = Date.now();
  let extraDetails: Record<string, unknown> = {};

  if (agentId === 'marie') {
    const slug = await saveMarie(content, imageUrl);
    if (slug) extraDetails = { article_slug: slug };
  } else if (agentId === 'emma') {
    await saveEmma(content);
  } else if (agentId === 'nathalie') {
    await saveNathalie(content);
  } else if (agentId === 'antoine') {
    await saveAntoine(content, task);
  } else if (agentId === 'sofia') {
    await saveSofia(content);
  }

  await logActivity(agentId, agentName, task.slice(0, 200), durationMs, { content_length: content.length, ...extraDetails }, tokens);
  await updateAgentStats(agentId, tokens);

  console.log(`[save-agent] ${agentId} terminé en ${Date.now() - start}ms`);
  return NextResponse.json({ ok: true });
}
