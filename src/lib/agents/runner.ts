import { AgentId, AgentTaskResult } from '@/types';
import { runAgent, streamAgent } from '@/lib/anthropic';
import { getAgent } from './config';
import { createAdminClient } from '@/lib/supabase/server';
import { getPhotoForArticle } from '@/lib/unsplash';

export async function executeAgentTask(
  agentId: AgentId,
  task: string,
  context?: Record<string, unknown>
): Promise<AgentTaskResult> {
  const agent = getAgent(agentId);
  const startTime = Date.now();

  const fullTask = context
    ? `${task}\n\nContexte supplémentaire :\n${JSON.stringify(context, null, 2)}`
    : task;

  try {
    const { content, inputTokens, outputTokens } = await runAgent(
      agent.systemPrompt,
      fullTask,
      agent.model,
      agent.maxTokens ?? 3000
    );

    const duration = Date.now() - startTime;
    const totalTokens = inputTokens + outputTokens;

    let extraDetails: Record<string, unknown> = {};
    if (agentId === 'marie') {
      const slug = await saveMariesArticle(content);
      if (slug) extraDetails = { article_slug: slug };
    } else if (agentId === 'nathalie') {
      await saveSecurityAnalysis(content);
    } else if (agentId === 'emma') {
      await saveSocialPost(content);
    } else if (agentId === 'antoine') {
      await saveFinancialReport(content, task);
    } else if (agentId === 'sofia') {
      await saveNewsletterDraft(content);
    }
    await logActivity(agentId, agent.name, task.slice(0, 200), 'success', duration, {
      content_length: content.length,
      content: agentId !== 'marie' ? content : undefined,
      ...extraDetails,
    });
    await updateAgentStats(agentId, 'success', totalTokens);

    return {
      success: true,
      content,
      tokens_used: totalTokens,
      duration_ms: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    await logActivity(agentId, agent.name, task.slice(0, 200), 'error', duration, { error: message });
    await updateAgentStats(agentId, 'error', 0);

    return {
      success: false,
      content: '',
      tokens_used: 0,
      duration_ms: duration,
      error: message,
    };
  }
}

export async function streamAgentTask(
  agentId: AgentId,
  task: string
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
          controller.close();
          const duration = Date.now() - startTime;
          console.log(`[stream:${agentId}] Stream terminé - ${fullContent.length} caractères, ${duration}ms`);
          // Post-processing : on attend explicitement pour garantir l'exécution
          void (async () => {
            try {
              // Pour Marie : sauvegarder l'article d'abord pour récupérer le slug
              let extraDetails: Record<string, unknown> = {};
              if (agentId === 'marie') {
                const slug = await saveMariesArticle(fullContent);
                if (slug) extraDetails = { article_slug: slug };
              } else if (agentId === 'nathalie') await saveSecurityAnalysis(fullContent);
              else if (agentId === 'emma') await saveSocialPost(fullContent);
              else if (agentId === 'antoine') await saveFinancialReport(fullContent, task);
              else if (agentId === 'sofia') await saveNewsletterDraft(fullContent);
              await logActivity(agentId, agent.name, task.slice(0, 200), 'success', duration, {
                content_length: fullContent.length,
                content: agentId !== 'marie' ? fullContent : undefined,
                ...extraDetails,
              });
              await updateAgentStats(agentId, 'success', totalTokens);
            } catch (err) {
              console.error(`[stream:${agentId}] Post-processing error:`, err);
            }
          })();
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

async function logActivity(
  agentId: AgentId,
  agentName: string,
  action: string,
  status: 'success' | 'error' | 'pending',
  durationMs: number,
  details: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('activity_logs').insert({
      agent_id: agentId,
      agent_name: agentName,
      action,
      status,
      duration_ms: durationMs,
      details,
    });
    if (error) {
      console.error(`[activity:${agentId}] Insert error:`, error);
    } else {
      console.log(`[activity:${agentId}] Log enregistré (${status}, ${durationMs}ms)`);
    }
  } catch (err) {
    console.error(`[activity:${agentId}] Exception:`, err);
  }
}

async function updateAgentStats(agentId: AgentId, result: 'success' | 'error', tokens: number) {
  try {
    const supabase = createAdminClient();
    const isSuccess = result === 'success';

    // Lire la ligne courante
    const { data, error: selectError } = await supabase
      .from('agent_stats')
      .select('tasks_completed, tasks_failed, total_tokens_used')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (selectError) {
      console.error(`[stats:${agentId}] SELECT error:`, selectError);
      return;
    }

    if (!data) {
      // Ligne inexistante — INSERT
      const { error: insertError } = await supabase.from('agent_stats').insert({
        agent_id:          agentId,
        tasks_completed:   isSuccess ? 1 : 0,
        tasks_failed:      isSuccess ? 0 : 1,
        total_tokens_used: tokens,
        last_active:       new Date().toISOString(),
      });
      if (insertError) console.error(`[stats:${agentId}] INSERT error:`, insertError);
      else console.log(`[stats:${agentId}] Stats créées (${result})`);
      return;
    }

    const { error: updateError } = await supabase
      .from('agent_stats')
      .update({
        tasks_completed:   (data.tasks_completed   ?? 0) + (isSuccess ? 1 : 0),
        tasks_failed:      (data.tasks_failed       ?? 0) + (isSuccess ? 0 : 1),
        total_tokens_used: (data.total_tokens_used  ?? 0) + tokens,
        last_active:       new Date().toISOString(),
        updated_at:        new Date().toISOString(),
      })
      .eq('agent_id', agentId);

    if (updateError) {
      console.error(`[stats:${agentId}] UPDATE error:`, updateError);
    } else {
      console.log(`[stats:${agentId}] Stats mis à jour (${result})`);
    }
  } catch (err) {
    console.error(`[stats:${agentId}] Exception:`, err);
  }
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
    const slug = getField('slug') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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

    // Récupérer une image Unsplash pertinente (non-bloquant si pas de clé ou erreur)
    let imageData: { url: string; alt: string; credit: string; creditUrl: string } | null = null;
    try {
      imageData = await getPhotoForArticle(title, category);
      console.log('[Marie] Image Unsplash:', imageData ? imageData.url.slice(0, 60) + '…' : 'aucune');
    } catch (err) {
      console.warn('[Marie] Unsplash indisponible:', err);
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
      image_url: imageData?.url ?? null,
      image_alt: imageData?.alt ?? null,
      image_credit: imageData?.credit ?? null,
      image_credit_url: imageData?.creditUrl ?? null,
    }, { onConflict: 'slug' });

    if (error) {
      console.error('[Marie] Erreur Supabase upsert:', error);
      return null;
    } else {
      console.log('[Marie] ✅ Article sauvegardé:', slug);
      return slug;
    }
  } catch (err) {
    console.error('[Marie] saveMariesArticle exception:', err);
    return null;
  }
}

async function saveSecurityAnalysis(content: string) {
  try {
    const threatLevelMatch = content.match(/CRITIQUE|ÉLEVÉ|MOYEN|FAIBLE/i);
    const threatLevel = threatLevelMatch
      ? ({ CRITIQUE: 'critical', ÉLEVÉ: 'high', MOYEN: 'medium', FAIBLE: 'low' } as Record<string, string>)[
          threatLevelMatch[0].toUpperCase()
        ] || 'low'
      : 'low';

    const supabase = createAdminClient();
    await supabase.from('security_logs').insert({
      threat_level: threatLevel,
      threat_type: 'Security Analysis',
      action_taken: 'Report generated',
      blocked: false,
      details: { analysis: content.slice(0, 2000) },
    });
  } catch {
    // Non-blocking
  }
}

async function saveSocialPost(content: string) {
  console.log('[Emma] saveSocialPost start');

  // 1. Extraire contenu et hashtags
  const postContent = content.trim();
  const hashtags = postContent.match(/#[\wÀ-ɏ]+/g) || [];
  console.log('[Emma] hashtags:', hashtags.length);

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

  // 2. Webhooks Make EN PREMIER — rien d'autre avant
  for (const platform of ['facebook', 'instagram']) {
    console.log(`[Emma] webhook Make (${platform})...`);
    try {
      const result = await sendToMakeWebhook(platform, postContent, hashtags, imageUrl);
      if (!result.success) console.log(`[Emma] webhook ${platform} échoué:`, result.error);
      else console.log(`[Emma] webhook ${platform} OK`);
    } catch (err) {
      console.error(`[Emma] webhook ${platform} exception:`, err);
    }
  }

  // Webhook envoyé — on peut maintenant await les opérations DB sans bloquer l'utilisateur
  const startDb = Date.now();

  // Unsplash
  let finalImageUrl = imageUrl;
  try {
    const imageData = await Promise.race([
      getPhotoForArticle(postContent.slice(0, 60), query),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (imageData?.url) {
      finalImageUrl = imageData.url;
      console.log('[Emma] Unsplash OK:', finalImageUrl.slice(0, 80));
    }
  } catch {
    console.log('[Emma] Unsplash ignoré');
  }

  // INSERT social_posts (une ligne par plateforme)
  try {
    const supabase = createAdminClient();
    for (const platform of ['facebook', 'instagram'] as const) {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({ content: postContent, platform, hashtags, status: 'draft' })
        .select('id')
        .single();
      if (error) console.log(`[Emma] social_posts ${platform} erreur -`, error.message);
      else console.log(`[Emma] social_posts ${platform} OK - id:`, data?.id);
    }
  } catch (err) {
    console.log('[Emma] social_posts exception:', err);
  }

  // INSERT activity_logs
  await logActivity('emma', 'Emma', 'Post réseaux sociaux publié', 'success', Date.now() - startDb, {
    platforms: ['facebook', 'instagram'],
    hashtags_count: hashtags.length,
    image_url: finalImageUrl,
  });

  // UPDATE agent_stats
  await updateAgentStats('emma', 'success', 0);

  console.log('[Emma] saveSocialPost terminé');
}

async function sendToMakeWebhook(
  platform: string,
  content: string,
  hashtags: string[],
  imageUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    console.warn('[Make] MAKE_WEBHOOK_URL non configuré — publication ignorée');
    return { success: false, error: 'MAKE_WEBHOOK_URL non configuré' };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        platform,
        content: content.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim(),
        hashtags: hashtags.join(' '),
        image_url: imageUrl,
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Make] Webhook error ${res.status}:`, text);
      return { success: false, error: `Make webhook error ${res.status}` };
    }
    console.log(`[Make] ✅ Webhook ${platform} envoyé — status: ${res.status}`);
    return { success: true };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Make] Exception webhook (${platform}):`, msg);
    return { success: false, error: msg };
  }
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
