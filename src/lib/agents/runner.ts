import { AgentId, AgentTaskResult } from '@/types';
import { runAgent, streamAgent } from '@/lib/anthropic';
import { getAgent } from './config';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/slugify';

export async function executeAgentTask(
  agentId: AgentId,
  task: string,
  context?: Record<string, unknown>,
  overrideImageUrl?: string
): Promise<AgentTaskResult> {
  const agent = getAgent(agentId);
  const startTime = Date.now();

  const fullTask = context
    ? `${task}\n\nContexte supplémentaire :\n${JSON.stringify(context, null, 2)}`
    : task;

  // Capturé hors du try pour être accessible dans le catch (ex: max_tokens)
  let capturedTokens = 0;

  try {
    const { content, inputTokens, outputTokens, stopReason } = await runAgent(
      agent.systemPrompt,
      fullTask,
      agent.model,
      agent.maxTokens ?? 3000
    );

    capturedTokens = inputTokens + outputTokens;

    if (stopReason === 'max_tokens') {
      console.error(`[${agentId}] TRUNCATED - stop_reason=max_tokens (${outputTokens} tokens générés)`);
      const duration = Date.now() - startTime;
      const message = `Article tronqué : limite de tokens atteinte (${outputTokens} tokens). Augmenter maxTokens.`;
      await logActivity(agentId, agent.name, task.slice(0, 200), 'error', duration, { error: message }, capturedTokens);
      await updateAgentStats(agentId, 'error', capturedTokens);
      return { success: false, content: '', tokens_used: capturedTokens, duration_ms: duration, error: message };
    }

    const duration = Date.now() - startTime;

    let extraDetails: Record<string, unknown> = {};
    if (agentId === 'marie') {
      const slug = await saveMariesArticle(content);
      if (slug) extraDetails = { article_slug: slug };
    } else if (agentId === 'nathalie') {
      await saveSecurityAnalysis(content);
    } else if (agentId === 'emma') {
      await saveSocialPost(content, overrideImageUrl);
    } else if (agentId === 'antoine') {
      await saveFinancialReport(content, task);
    } else if (agentId === 'sofia') {
      await saveNewsletterDraft(content);
    } else if (agentId === 'lucas') {
      await saveSeoReport(content, task);
    } else if (agentId === 'maxime') {
      await saveTechReport(content, task);
    } else if (agentId === 'lea') {
      await saveSupportLog(content, task);
    }
    await logActivity(agentId, agent.name, task.slice(0, 200), 'success', duration, {
      content_length: content.length,
      content: agentId !== 'marie' ? content : undefined,
      ...extraDetails,
    }, capturedTokens);
    await updateAgentStats(agentId, 'success', capturedTokens);

    return {
      success: true,
      content,
      tokens_used: capturedTokens,
      duration_ms: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    await logActivity(agentId, agent.name, task.slice(0, 200), 'error', duration, { error: message }, capturedTokens);
    await updateAgentStats(agentId, 'error', capturedTokens);

    return {
      success: false,
      content: '',
      tokens_used: capturedTokens,
      duration_ms: duration,
      error: message,
    };
  }
}

export async function streamAgentTask(
  agentId: AgentId,
  task: string,
  imageUrl?: string
): Promise<ReadableStream<Uint8Array>> {
  const agent = getAgent(agentId);
  const startTime = Date.now();
  let totalTokens = 0;
  const sourceStream = await streamAgent(
    agent.systemPrompt,
    task,
    agent.model,
    agent.maxTokens ?? 3000,
    (tokens) => { totalTokens = tokens; }
  );

  const decoder = new TextDecoder();
  let fullContent = '';
  const reader = sourceStream.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          const duration = Date.now() - startTime;
          // Préférer NEXT_PUBLIC_APP_URL (domaine custom sans protection Vercel)
          // VERCEL_URL = URL de déploiement hashée → protégée par Vercel → 401
          const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
          const appUrl = (rawAppUrl && !rawAppUrl.startsWith('http://localhost'))
            ? rawAppUrl
            : process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : 'http://localhost:3000';
          console.log(`[save-agent] fetch → ${appUrl}/api/internal/save-agent-data`);
          try {
            const r = await fetch(`${appUrl}/api/internal/save-agent-data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.CRON_SECRET ?? '' },
              body: JSON.stringify({ agentId, agentName: agent.name, content: fullContent, task, durationMs: duration, tokens: totalTokens, imageUrl }),
            });
            if (!r.ok) {
              const text = await r.text().catch(() => '');
              console.error(`[save-agent] ${r.status} - ${text.slice(0, 200)}`);
            } else {
              console.log(`[save-agent] OK ${r.status}`);
            }
          } catch (err) {
            console.error('[save-agent] exception:', err instanceof Error ? err.message : err);
          }
          controller.close();
          return;
        }
        if (!value) return;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        controller.enqueue(value);
      } catch (error) {
        const duration = Date.now() - startTime;
        await logActivity(agentId, agent.name, task.slice(0, 200), 'error', duration, {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        await updateAgentStats(agentId, 'error', 0);
        controller.error(error);
        reader.cancel();
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

async function supabaseFetch(
  path: string,
  method: string,
  body?: unknown,
  params?: string
): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const url = `${base}/rest/v1/${path}${params ? `?${params}` : ''}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
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
    const data = res.ok && method !== 'PATCH' ? await res.json().catch(() => null) : null;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: 0, data: err instanceof Error ? err.message : 'timeout' };
  }
}

async function logActivity(
  agentId: AgentId,
  agentName: string,
  action: string,
  status: 'success' | 'error' | 'pending',
  durationMs: number,
  details: Record<string, unknown>,
  tokensUsed = 0
) {
  const res = await supabaseFetch('activity_logs', 'POST', {
    agent_id: agentId,
    agent_name: agentName,
    action,
    status,
    duration_ms: durationMs,
    details,
    tokens_used: tokensUsed,
  });
  if (res.ok) console.log(`[activity:${agentId}] OK (${status}, ${durationMs}ms)`);
  else console.error(`[activity:${agentId}] erreur ${res.status}:`, res.data);
}

async function updateAgentStats(agentId: AgentId, result: 'success' | 'error', tokens: number) {
  const isSuccess = result === 'success';

  const selectRes = await supabaseFetch('agent_stats', 'GET', undefined, `agent_id=eq.${agentId}&select=tasks_completed,tasks_failed,total_tokens_used`);
  if (!selectRes.ok) {
    console.error(`[stats:${agentId}] SELECT erreur ${selectRes.status}`);
    return;
  }

  const rows = selectRes.data as { tasks_completed: number; tasks_failed: number; total_tokens_used: number }[] | null;
  const row = rows?.[0];

  if (!row) {
    const ins = await supabaseFetch('agent_stats', 'POST', {
      agent_id: agentId,
      tasks_completed: isSuccess ? 1 : 0,
      tasks_failed: isSuccess ? 0 : 1,
      total_tokens_used: tokens,
      last_active: new Date().toISOString(),
    });
    console.log(`[stats:${agentId}] INSERT ${ins.ok ? 'OK' : `erreur ${ins.status}`}`);
    return;
  }

  const upd = await supabaseFetch('agent_stats', 'PATCH', {
    tasks_completed: (row.tasks_completed ?? 0) + (isSuccess ? 1 : 0),
    tasks_failed: (row.tasks_failed ?? 0) + (isSuccess ? 0 : 1),
    total_tokens_used: (row.total_tokens_used ?? 0) + tokens,
    last_active: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, `agent_id=eq.${agentId}`);
  console.log(`[stats:${agentId}] UPDATE ${upd.ok ? 'OK' : `erreur ${upd.status}`}`);
}

async function saveMariesArticle(content: string): Promise<string | null> {
  console.log('[Marie] saveMariesArticle appelé - contenu:', content.length, 'chars');
  try {
    // Supprimer le code fence si Claude a enveloppé la réponse (```markdown ... ```)
    let normalized = content.trim();
    const firstLine = normalized.split('\n')[0].trim();
    if (/^```/.test(firstLine)) {
      console.log('[Marie] Code fence détecté, suppression...');
      const lines = normalized.split('\n');
      lines.shift();
      if (lines[lines.length - 1].trim() === '```') lines.pop();
      normalized = lines.join('\n').trim();
    }

    const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.warn('[Marie] Frontmatter introuvable. Début du contenu:\n', normalized.slice(0, 300));
      return null;
    }
    console.log('[Marie] Frontmatter trouvé');

    const fm = frontmatterMatch[1];
    const getField = (key: string) => {
      const match = fm.match(new RegExp(`${key}:\\s*(.+)`));
      return match ? match[1].trim() : '';
    };

    const title = getField('title');
    const slug = slugify(getField('slug') || title);
    const excerpt = getField('excerpt');
    const category = getField('category') || 'general';
    const metaDescription = getField('meta_description');
    const readingTime = parseInt(getField('reading_time')) || 5;
    const keywordsRaw = getField('seo_keywords');
    const seoKeywords = keywordsRaw ? keywordsRaw.split(',').map((k) => k.trim()) : [];

    const categoriesRaw = getField('categories');
    const categories = categoriesRaw
      ? categoriesRaw.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean)
      : [category];

    console.log('[Marie] Parsed - title:', title, '| slug:', slug, '| category:', category, '| categories:', categories);

    const articleContent = normalized.replace(/^---[\s\S]*?---\n/, '').trim();

    if (!title || !slug) {
      console.warn('[Marie] title ou slug manquant, abandon');
      return null;
    }

    const supabase = createAdminClient();
    console.log('[Marie] Upsert Supabase en cours...');
    const { error } = await supabase.from('articles').upsert({
      title,
      slug,
      content: articleContent,
      excerpt,
      category,
      categories,
      seo_keywords: seoKeywords,
      meta_description: metaDescription,
      reading_time: readingTime,
      status: 'published',
      published_at: new Date().toISOString(),
    }, { onConflict: 'slug' });

    if (error) {
      console.error('[Marie] Erreur Supabase upsert:', error);
      return null;
    } else {
      console.log('[Marie] ✅ Article sauvegardé:', slug);
      revalidatePath('/');
      revalidatePath('/blog');
      console.log('[Marie] Cache invalidated for / and /blog');
      return slug;
    }
  } catch (err) {
    console.error('[Marie] saveMariesArticle exception:', err);
    return null;
  }
}

async function saveSecurityAnalysis(content: string) {
  try {
    // Un rapport d'audit N'EST PAS un incident : on le trace en 'Audit Report' niveau 'low'
    // pour ne pas gonfler le compteur critical du dashboard ni se faire relire comme une
    // attaque par l'audit suivant (boucle de fausse alerte).
    const supabase = createAdminClient();
    await supabase.from('security_logs').insert({
      threat_level: 'low',
      threat_type: 'Audit Report',
      action_taken: 'Report generated',
      blocked: false,
      details: { analysis: content.slice(0, 2000) },
    });
  } catch {
    // Non-blocking
  }
}

async function saveSocialPost(content: string, overrideImageUrl?: string) {
  console.log('[Emma] saveSocialPost start', overrideImageUrl ? '(image override)' : '');

  const postContent = content.trim();
  const hashtags = postContent.match(/#[\wÀ-ɏ]+/g) || [];
  console.log('[Emma] hashtags:', hashtags.length);

  // Préférer NEXT_PUBLIC_APP_URL (domaine custom sans protection Vercel)
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const appUrl = (rawAppUrl && !rawAppUrl.startsWith('http://localhost'))
    ? rawAppUrl
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    // AWAIT obligatoire : en serverless, un fetch fire-and-forget est tué dès que le handler renvoie
    const res = await fetch(`${appUrl}/api/internal/save-social-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ content: postContent, hashtags, ...(overrideImageUrl ? { overrideImageUrl } : {}) }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    console.log('[Emma] save-social-post:', res.ok ? 'OK ✅' : `erreur ${res.status}`);
  } catch (err) {
    clearTimeout(t);
    console.log('[Emma] save-social-post échec:', err instanceof Error ? err.message : err);
  }

  console.log('[Emma] saveSocialPost terminé');
}


async function saveFinancialReport(content: string, period: string) {
  try {
    const supabase = createAdminClient();
    await supabase.from('financial_reports').insert({
      period: period.slice(0, 100),
      details: { report: content.slice(0, 5000) },
    });
  } catch {
    // Non-blocking
  }
}

async function saveSeoReport(content: string, topic: string) {
  try {
    const keywordsMatch = content.match(/MOTS_CLES:\s*(.+)/i);
    const keywords = keywordsMatch?.[1]?.split(',').map((k) => k.trim()).filter(Boolean) ?? [];
    const scoreMatch = content.match(/SCORE[^:]*:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

    const supabase = createAdminClient();
    await supabase.from('seo_reports').insert({
      topic: topic.slice(0, 200),
      keywords,
      analysis: content.slice(0, 5000),
      score,
    });
    console.log('[Lucas] SEO report sauvegardé');
  } catch { /* non-bloquant */ }
}

async function saveTechReport(content: string, topic: string) {
  try {
    const lower = content.toLowerCase();
    const severity =
      lower.includes('critique') || lower.includes('critical') ? 'critical' :
      lower.includes('élevé') || lower.includes('high') ? 'high' :
      lower.includes('moyen') || lower.includes('medium') ? 'medium' :
      lower.includes('faible') || lower.includes('low') ? 'low' : 'info';

    const supabase = createAdminClient();
    await supabase.from('tech_reports').insert({
      topic: topic.slice(0, 200),
      severity,
      report: content.slice(0, 5000),
    });
    console.log('[Maxime] Tech report sauvegardé');
  } catch { /* non-bloquant */ }
}

async function saveSupportLog(content: string, topic: string) {
  try {
    const supabase = createAdminClient();
    await supabase.from('support_logs').insert({
      topic: topic.slice(0, 200),
      response: content.slice(0, 5000),
    });
    console.log('[Léa] Support log sauvegardé');
  } catch { /* non-bloquant */ }
}

async function saveNewsletterDraft(content: string) {
  try {
    let parsed: { subject?: string; preview_text?: string; content_html?: string } = {};
    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Si pas de JSON valide, on sauvegarde le contenu brut comme HTML
      parsed = { subject: 'Newsletter Mes Poilus', content_html: content };
    }
    if (!parsed.subject || !parsed.content_html) return;
    const supabase = createAdminClient();
    await supabase.from('newsletter_campaigns').insert({
      subject: parsed.subject,
      preview_text: parsed.preview_text ?? null,
      content_html: parsed.content_html,
      status: 'draft',
    });
  } catch {
    // Non-blocking
  }
}
