import { createAdminClient } from '@/lib/supabase/server';
import { pingIndexNow } from '@/lib/indexnow';
import { GSC_SITE_ORIGIN } from '@/lib/gsc';

export interface SeoSuggestion {
  id: string;
  page: string;
  page_type: 'blog' | 'produit' | 'race' | 'statique' | 'racine';
  suggestion_type: 'title' | 'meta' | 'internal_link';
  proposed_value: string;
  anchor_text: string | null;
  target_url: string | null;
}

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

/**
 * Applique une suggestion approuvée sur le contenu réel du site.
 * Appelée synchronement depuis le Server Action "Valider" de /seo-admin.
 */
export async function applySuggestion(suggestion: SeoSuggestion): Promise<ApplyResult> {
  const supabase = createAdminClient();

  try {
    if (suggestion.suggestion_type === 'internal_link') {
      const result = await applyInternalLink(supabase, suggestion);
      if (result.ok) await pingIndexNow(`${GSC_SITE_ORIGIN}${suggestion.page}`);
      return result;
    }

    if (suggestion.page_type === 'blog') {
      const slug = extractSlug(suggestion.page, '/blog/');
      const column = suggestion.suggestion_type === 'title' ? 'title' : 'meta_description';
      const { error } = await supabase.from('articles').update({ [column]: suggestion.proposed_value }).eq('slug', slug);
      if (error) return { ok: false, error: error.message };
      await pingIndexNow(`${GSC_SITE_ORIGIN}${suggestion.page}`);
      return { ok: true };
    }

    if (suggestion.page_type === 'race') {
      if (suggestion.suggestion_type === 'title') {
        return { ok: false, error: 'Titre des fiches races non modifiable automatiquement (gabarit fixe partagé par toutes les fiches).' };
      }
      const slug = suggestion.page.split('/').filter(Boolean).pop() ?? '';
      const { data, error: fetchErr } = await supabase.from('breeds').select('content').eq('slug', slug).single();
      if (fetchErr || !data) return { ok: false, error: fetchErr?.message ?? 'Fiche race introuvable' };
      const { error } = await supabase
        .from('breeds')
        .update({ content: { ...data.content, excerpt: suggestion.proposed_value } })
        .eq('slug', slug);
      if (error) return { ok: false, error: error.message };
      await pingIndexNow(`${GSC_SITE_ORIGIN}${suggestion.page}`);
      return { ok: true };
    }

    // produit / statique / racine : passent par la table de surcharge
    const column = suggestion.suggestion_type === 'title' ? 'title' : 'meta_description';
    const { error } = await supabase
      .from('seo_meta_overrides')
      .upsert({ url_path: suggestion.page, [column]: suggestion.proposed_value, updated_at: new Date().toISOString() }, { onConflict: 'url_path' });
    if (error) return { ok: false, error: error.message };
    await pingIndexNow(`${GSC_SITE_ORIGIN}${suggestion.page}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function extractSlug(page: string, prefix: string): string {
  return page.replace(prefix, '').replace(/\/$/, '');
}

async function applyInternalLink(
  supabase: ReturnType<typeof createAdminClient>,
  suggestion: SeoSuggestion
): Promise<ApplyResult> {
  if (suggestion.page_type !== 'blog') {
    return { ok: false, error: 'Liens internes automatiques disponibles uniquement sur les articles de blog.' };
  }
  if (!suggestion.anchor_text || !suggestion.target_url) {
    return { ok: false, error: 'Ancre ou URL cible manquante.' };
  }

  const slug = extractSlug(suggestion.page, '/blog/');
  const { data, error: fetchErr } = await supabase.from('articles').select('content').eq('slug', slug).single();
  if (fetchErr || !data) return { ok: false, error: fetchErr?.message ?? 'Article introuvable' };

  const content: string = data.content;
  const anchor = suggestion.anchor_text;

  // Compte les occurrences exactes de l'ancre, en excluant celles déjà dans un lien markdown [texte](url)
  const linkRegex = /\[([^\]]*)\]\([^)]*\)/g;
  const alreadyLinkedAnchors = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(content)) !== null) alreadyLinkedAnchors.add(m[1]);

  const occurrences = content.split(anchor).length - 1;
  if (occurrences !== 1) {
    return { ok: false, error: `Ancre "${anchor}" introuvable ou ambiguë (${occurrences} occurrence(s)) — contenu probablement modifié depuis la détection.` };
  }
  if (alreadyLinkedAnchors.has(anchor)) {
    return { ok: false, error: `Ancre "${anchor}" déjà utilisée dans un lien existant.` };
  }

  const newContent = content.replace(anchor, `[${anchor}](${suggestion.target_url})`);
  const { error: updateErr } = await supabase.from('articles').update({ content: newContent }).eq('slug', slug);
  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true };
}
