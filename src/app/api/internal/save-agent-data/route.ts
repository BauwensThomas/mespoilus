import { NextRequest, NextResponse } from 'next/server';
import { getPhotoForArticle } from '@/lib/unsplash';

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

async function logActivity(agentId: string, agentName: string, action: string, durationMs: number, details: Record<string, unknown>) {
  await dbFetch('activity_logs', 'POST', { agent_id: agentId, agent_name: agentName, action, status: 'success', duration_ms: durationMs, details });
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

async function saveMarie(content: string) {
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
  const slug = getField('slug') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const excerpt = getField('excerpt');
  const category = getField('category') || 'general';
  const metaDescription = getField('meta_description');
  const readingTime = parseInt(getField('reading_time')) || 5;
  const seoKeywords = getField('seo_keywords').split(',').map(k => k.trim()).filter(Boolean);
  const categoriesRaw = getField('categories');
  const categories = categoriesRaw ? categoriesRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean) : [category];
  const articleContent = normalized.replace(/^---[\s\S]*?---\n/, '').trim();
  if (!title || !slug) return null;

  let imageData: { url: string; alt: string; credit: string; creditUrl: string } | null = null;
  try {
    imageData = await Promise.race([
      getPhotoForArticle(title, category),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
  } catch { /* ignore */ }

  const res = await dbFetch('articles', 'POST', {
    title, slug, content: articleContent, excerpt, category, categories,
    seo_keywords: seoKeywords, meta_description: metaDescription,
    reading_time: readingTime, status: 'published',
    published_at: new Date().toISOString(),
    image_url: imageData?.url ?? null, image_alt: imageData?.alt ?? null,
    image_credit: imageData?.credit ?? null, image_credit_url: imageData?.creditUrl ?? null,
  });
  // Si conflict slug → upsert via PATCH
  if (!res.ok) {
    await dbFetch('articles', 'PATCH', { content: articleContent, excerpt, seo_keywords: seoKeywords, meta_description: metaDescription, updated_at: new Date().toISOString() }, `slug=eq.${slug}`);
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
  await dbFetch('newsletter_campaigns', 'POST', { subject: parsed.subject, preview_text: parsed.preview_text ?? null, content_html: parsed.content_html, status: 'draft' });
  console.log('[save-agent] Sofia newsletter_campaigns OK');
}

export async function POST(req: NextRequest) {
  const { agentId, agentName, content, task, durationMs, tokens } = await req.json() as {
    agentId: string; agentName: string; content: string; task: string; durationMs: number; tokens: number;
  };

  const start = Date.now();
  let extraDetails: Record<string, unknown> = {};

  if (agentId === 'marie') {
    const slug = await saveMarie(content);
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

  await logActivity(agentId, agentName, task.slice(0, 200), durationMs, { content_length: content.length, ...extraDetails });
  await updateAgentStats(agentId, tokens);

  console.log(`[save-agent] ${agentId} terminé en ${Date.now() - start}ms`);
  return NextResponse.json({ ok: true });
}
