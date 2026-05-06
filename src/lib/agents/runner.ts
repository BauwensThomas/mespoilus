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

    // Lire la ligne courante (seeded par migration_complete.sql)
    const { data, error: selectError } = await supabase
      .from('agent_stats')
      .select('tasks_completed, tasks_failed, total_tokens_used')
      .eq('agent_id', agentId)
      .single();

    if (selectError) {
      console.error(`[stats:${agentId}] SELECT error:`, selectError);
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
  try {
    const platforms = ['instagram', 'facebook', 'tiktok'] as const;
    const supabase = createAdminClient();

    for (const platform of platforms) {
      const regex = new RegExp(`#{1,3}\\s*${platform}[^\\n]*\\n([\\s\\S]*?)(?=#{1,3}|$)`, 'i');
      const match = content.match(regex);
      if (match) {
        const postContent = match[1].trim();
        const hashtagsMatch = postContent.match(/#[\wÀ-ɏ]+/g);
        await supabase.from('social_posts').insert({
          content: postContent,
          platform,
          hashtags: hashtagsMatch || [],
          status: 'draft',
        });
      }
    }
  } catch {
    // Non-blocking
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
