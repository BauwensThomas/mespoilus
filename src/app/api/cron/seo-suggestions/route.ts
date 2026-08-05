import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runAgent } from '@/lib/anthropic';
import { AGENTS } from '@/lib/agents/config';
import { GSC_SITE_ORIGIN } from '@/lib/gsc';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

export const maxDuration = 300;

const MAX_PAGES_PER_RUN = 15;
const REGRESSION_POSITION_DROP = 3; // places perdues
const REGRESSION_CLICKS_DROP_PCT = 0.3; // -30% de clics
const DEDUP_WINDOW_DAYS = 30;

type PageType = 'blog' | 'produit' | 'race' | 'statique' | 'racine';

interface GscStatRow {
  page: string;
  query: string;
  page_type: PageType;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Opportunity {
  query: string;
  opportunity_type: 'page2' | 'low_ctr' | 'regression';
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevPosition?: number;
  prevClicks?: number;
}

interface PageCandidate {
  page: string;
  page_type: PageType;
  opportunities: Opportunity[];
  totalImpressions: number;
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0];
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: latestRow } = await supabase
    .from('gsc_weekly_stats')
    .select('week_start')
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (!latestRow) {
    return NextResponse.json({ success: true, message: 'Aucune donnée gsc_weekly_stats — lancer gsc-sync d\'abord', pagesProcessed: 0 });
  }

  const latestWeekStart = latestRow.week_start as string;
  const prevWeekDate = new Date(latestWeekStart);
  prevWeekDate.setUTCDate(prevWeekDate.getUTCDate() - 7);
  const prevWeekStart = fmt(prevWeekDate);

  const [{ data: latestRows }, { data: prevRows }] = await Promise.all([
    supabase.from('gsc_weekly_stats').select('page,query,page_type,clicks,impressions,ctr,position').eq('week_start', latestWeekStart),
    supabase.from('gsc_weekly_stats').select('page,query,clicks,impressions,ctr,position').eq('week_start', prevWeekStart),
  ]);

  const prevMap = new Map<string, { clicks: number; position: number }>();
  for (const r of (prevRows ?? []) as { page: string; query: string; clicks: number; position: number }[]) {
    prevMap.set(`${r.page}|||${r.query}`, { clicks: r.clicks, position: r.position });
  }

  // ─── Détection des opportunités, groupées par page ────────────────────────
  const candidatesByPage = new Map<string, PageCandidate>();

  const addOpportunity = (row: GscStatRow, opp: Opportunity) => {
    const key = row.page;
    if (!candidatesByPage.has(key)) {
      candidatesByPage.set(key, { page: row.page, page_type: row.page_type, opportunities: [], totalImpressions: 0 });
    }
    const candidate = candidatesByPage.get(key)!;
    candidate.opportunities.push(opp);
    candidate.totalImpressions += opp.impressions;
  };

  for (const row of (latestRows ?? []) as GscStatRow[]) {
    if (row.position >= 8 && row.position <= 20 && row.impressions >= 10) {
      addOpportunity(row, { query: row.query, opportunity_type: 'page2', clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position });
    }
    if (row.impressions >= 20 && row.ctr < 3) {
      addOpportunity(row, { query: row.query, opportunity_type: 'low_ctr', clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position });
    }
    const prev = prevMap.get(`${row.page}|||${row.query}`);
    if (prev && prev.clicks >= 5) {
      const positionWorsened = row.position - prev.position >= REGRESSION_POSITION_DROP;
      const clicksDropped = row.clicks <= prev.clicks * (1 - REGRESSION_CLICKS_DROP_PCT);
      if (positionWorsened || clicksDropped) {
        addOpportunity(row, {
          query: row.query, opportunity_type: 'regression', clicks: row.clicks, impressions: row.impressions,
          ctr: row.ctr, position: row.position, prevPosition: prev.position, prevClicks: prev.clicks,
        });
      }
    }
  }

  // ─── Déduplication contre les suggestions existantes ──────────────────────
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - DEDUP_WINDOW_DAYS);
  const { data: existing } = await supabase
    .from('seo_suggestions')
    .select('page,status,reviewed_at')
    .or(`status.eq.pending,and(status.in.(approved,applied),reviewed_at.gte.${cutoff.toISOString()})`);

  const excludedPages = new Set((existing ?? []).map(s => s.page as string));

  const candidates = [...candidatesByPage.values()]
    .filter(c => !excludedPages.has(c.page))
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, MAX_PAGES_PER_RUN);

  let suggestionsCreated = 0;
  let pagesSkippedParseError = 0;

  for (const candidate of candidates) {
    try {
      const current = await getCurrentValues(supabase, candidate.page, candidate.page_type);
      const task = buildTask(candidate, current);
      const { content } = await runAgent(AGENTS.lucas.systemPrompt, task, AGENTS.lucas.model, AGENTS.lucas.maxTokens);
      const parsed = parseLucasJson(content);
      if (!parsed) { pagesSkippedParseError++; continue; }

      const dominantType = candidate.opportunities[0].opportunity_type;
      const rows: Record<string, unknown>[] = [];

      // Le layout racine ajoute déjà " | Mes Poilus" au <title> — évite un doublon si Lucas l'a quand même inclus.
      const cleanTitle = parsed.title?.replace(/\s*[|\-–]\s*Mes Poilus\s*$/i, '').trim();

      // Le titre des fiches races est un gabarit fixe ("<nom> - Caractère, Santé, Entretien"), non réécrivable.
      if (cleanTitle && cleanTitle !== current.title && candidate.page_type !== 'race') {
        rows.push({
          page: candidate.page, page_type: candidate.page_type, suggestion_type: 'title',
          current_value: current.title ?? null, proposed_value: cleanTitle,
          reasoning: parsed.reasoning ?? '', opportunity_type: dominantType,
        });
      }
      if (parsed.meta_description && parsed.meta_description !== current.meta) {
        rows.push({
          page: candidate.page, page_type: candidate.page_type, suggestion_type: 'meta',
          current_value: current.meta ?? null, proposed_value: parsed.meta_description,
          reasoning: parsed.reasoning ?? '', opportunity_type: dominantType,
        });
      }
      const link = parsed.internal_link;
      if (link?.anchor_text && link?.target_url && isSafeInternalUrl(link.target_url)) {
        rows.push({
          page: candidate.page, page_type: candidate.page_type, suggestion_type: 'internal_link',
          current_value: null, proposed_value: `${link.anchor_text} → ${link.target_url}`,
          anchor_text: link.anchor_text, target_url: link.target_url,
          reasoning: parsed.reasoning ?? '', opportunity_type: dominantType,
        });
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('seo_suggestions').insert(rows);
        if (error) throw error;
        suggestionsCreated += rows.length;
      }
    } catch (e) {
      console.error(`[seo-suggestions] page ${candidate.page} :`, e instanceof Error ? e.message : String(e));
    }
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'lucas', agent_name: 'Lucas',
    action: `[SEO suggestions] ${candidates.length} page(s) analysée(s), ${suggestionsCreated} suggestion(s) créée(s)`,
    details: { weekStart: latestWeekStart, pagesAnalyzed: candidates.length, suggestionsCreated, pagesSkippedParseError, opportunitiesFound: candidatesByPage.size },
    status: 'success',
  });

  const { count: pendingCount } = await supabase
    .from('seo_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingCount && pendingCount > 0) {
    try {
      await sendEmail({
        to: 'contact@mespoilus.com',
        subject: `${pendingCount} suggestion${pendingCount > 1 ? 's' : ''} SEO à valider`,
        html: cronEmailWrapper(
          `${pendingCount} suggestion${pendingCount > 1 ? 's' : ''} SEO en attente`,
          'Automatisation SEO',
          `${statsRow([
            { label: 'En attente', value: pendingCount },
            { label: 'Nouvelles ce run', value: suggestionsCreated },
          ])}
          <p style="font-size:13px;line-height:1.6;color:#374151">Lucas a analysé les opportunités détectées cette semaine sur Google Search Console (positions page 2, CTR faible, régressions). Va valider ou rejeter les propositions :</p>
          <div style="text-align:center;margin:20px 0">
            <a href="https://www.mespoilus.com/seo-admin" style="display:inline-block;background:#ea580c;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:10px;text-decoration:none">Voir les suggestions</a>
          </div>`
        ),
      });
    } catch (mailErr) {
      console.error('[seo-suggestions] échec email notification:', mailErr);
    }
  }

  return NextResponse.json({ success: true, pagesAnalyzed: candidates.length, suggestionsCreated, pagesSkippedParseError, pendingCount: pendingCount ?? 0 });
}

function isSafeInternalUrl(target: string): boolean {
  if (target.startsWith('/')) return true;
  return target.startsWith(GSC_SITE_ORIGIN);
}

async function getCurrentValues(
  supabase: ReturnType<typeof createAdminClient>,
  page: string,
  pageType: PageType
): Promise<{ title: string | null; meta: string | null; content: string | null }> {
  if (pageType === 'blog') {
    const slug = page.replace('/blog/', '').replace(/\/$/, '');
    const { data } = await supabase.from('articles').select('title, meta_description, content').eq('slug', slug).single();
    return { title: data?.title ?? null, meta: data?.meta_description ?? null, content: data?.content?.slice(0, 4000) ?? null };
  }
  if (pageType === 'race') {
    const slug = page.split('/').filter(Boolean).pop() ?? '';
    const { data } = await supabase.from('breeds').select('name, content').eq('slug', slug).single();
    return { title: data?.name ?? null, meta: data?.content?.excerpt ?? null, content: null };
  }
  // produit / statique / racine : cherche une éventuelle surcharge déjà posée
  const { data } = await supabase.from('seo_meta_overrides').select('title, meta_description').eq('url_path', page).single();
  return { title: data?.title ?? null, meta: data?.meta_description ?? null, content: null };
}

function buildTask(candidate: PageCandidate, current: { title: string | null; meta: string | null; content: string | null }): string {
  const oppLines = candidate.opportunities
    .slice(0, 8)
    .map(o => {
      const base = `"${o.query}" | position ${o.position} | ${o.impressions} impressions | ${o.clicks} clics | CTR ${o.ctr}% | type: ${o.opportunity_type}`;
      return o.opportunity_type === 'regression'
        ? `${base} (avant : position ${o.prevPosition}, ${o.prevClicks} clics)`
        : base;
    })
    .join('\n');

  return `Analyse cette page de mespoilus.com et propose des corrections SEO concrètes, en te basant sur les données réelles Google Search Console ci-dessous.

PAGE : ${candidate.page} (type: ${candidate.page_type})

OPPORTUNITÉS DÉTECTÉES (requêtes réelles tapées sur Google) :
${oppLines}

TITRE ACTUEL : ${current.title ?? '(aucun, page sans titre spécifique connu)'}
META DESCRIPTION ACTUELLE : ${current.meta ?? '(aucune)'}
${current.content ? `EXTRAIT DU CONTENU (pour repérer une ancre de lien interne pertinente) :\n${current.content}` : ''}

Important : le site ajoute automatiquement " | Mes Poilus" à la fin de chaque titre (balise <title>). Ne mets JAMAIS "Mes Poilus" ou un nom de marque dans le titre que tu proposes, sous peine de doublon.

Réponds UNIQUEMENT avec un objet JSON strict (rien avant, rien après, pas de balises markdown), au format exact :
{
  "title": "nouveau titre SEO SANS le nom du site (60 caractères max) ou null si pas de changement pertinent",
  "meta_description": "nouvelle meta description (150-155 caractères) ou null si pas de changement pertinent",
  "internal_link": { "anchor_text": "texte EXACT présent dans l'extrait du contenu ci-dessus", "target_url": "/chemin/vers/une/autre/page/du/site" } ou null si aucune opportunité de lien interne pertinente,
  "reasoning": "1-2 phrases expliquant le raisonnement, en français"
}`;
}

function parseLucasJson(raw: string): { title?: string; meta_description?: string; internal_link?: { anchor_text?: string; target_url?: string } | null; reasoning?: string } | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
}
