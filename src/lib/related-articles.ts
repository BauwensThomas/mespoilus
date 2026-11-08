import { createAdminClient } from '@/lib/supabase/server';

/**
 * "À lire aussi" : articles vraiment proches au lieu des 3 plus récents de la catégorie.
 *
 * Avant (jusqu'au 08/11/2026), le bloc montrait toujours les 3 derniers articles de la
 * catégorie : les anciens ne recevaient presque aucun lien interne, et Google laissait
 * 32 articles en "Explorée, actuellement non indexée". Score de proximité :
 *  - même race (breed_slug) : +12
 *  - mots-clés SEO en commun : +4 par mot significatif partagé
 *  - mots du titre en commun : +2 par mot significatif partagé
 *  - même catégorie : +5
 * Égalités départagées par un hachage stable (paire d'articles) et non par la date.
 * Les 3 premières places vont aux plus proches ; la 4e est réservée à l'article de la même
 * catégorie le MOINS proposé ailleurs (compté sur les top 3 de tout le blog) : aucun article
 * ne reste sans lien entrant, y compris les plus anciens.
 */

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
}

interface Candidate extends RelatedArticle {
  category: string;
  breed_slug: string | null;
  titleWords: Set<string>;
  keywordWords: Set<string>;
}

const STOPWORDS = new Set([
  'avec', 'dans', 'pour', 'sans', 'sous', 'votre', 'vos', 'notre', 'nos', 'leur', 'leurs', 'comment',
  'pourquoi', 'quand', 'quel', 'quelle', 'quels', 'quelles', 'tout', 'tous', 'toute', 'toutes', 'plus',
  'moins', 'tres', 'bien', 'faire', 'fait', 'etre', 'avoir', 'guide', 'complet', 'complete', 'conseils',
  'conseil', 'astuces', 'pratique', 'pratiques', 'essentiels', 'essentiel', 'savoir', 'faut', 'votre',
  'mon', 'mes', 'son', 'ses', 'une', 'des', 'les', 'aux', 'est', 'qui', 'que', 'quoi', 'sur', 'par',
  'entre', 'chez', 'comme', 'mais', 'donc', 'alors', 'cette', 'ces', 'ceux', 'celle', 'elle', 'ils',
  'causes', 'solutions', 'solution', 'meilleur', 'meilleure', 'meilleurs', 'meilleures', 'avis', 'top',
  '2025', '2026', '2027', 'animal', 'animaux', 'compagnie',
]);

function words(text: string | null | undefined): Set<string> {
  const out = new Set<string>();
  if (!text) return out;
  const normalized = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const raw of normalized.split(/[^a-z0-9]+/)) {
    if (raw.length < 4 || STOPWORDS.has(raw)) continue;
    // Pluriel simple : "chiens" et "chien" comptent comme le même mot
    out.add(raw.length > 4 && raw.endsWith('s') ? raw.slice(0, -1) : raw);
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

/** Hachage stable d'une paire (FNV-1a) : départage les égalités sans favoriser les récents. */
function pairHash(a: string, b: string): number {
  let h = 2166136261;
  for (const ch of a + '|' + b) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Mémo en mémoire (5 min) : la page article est dynamique, pas besoin de relire ~100 lignes à chaque visite
const MEMO_MS = 5 * 60_000;
let memo: { at: number; list: Candidate[]; top3Count: Map<string, number> } | null = null;

const TOP = 3;

async function loadCandidates(): Promise<{ list: Candidate[]; top3Count: Map<string, number> }> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo;
  const { data, error } = await createAdminClient()
    .from('articles')
    .select('id, title, slug, image_url, category, breed_slug, seo_keywords')
    .eq('status', 'published');
  if (error) throw error;
  const list: Candidate[] = (data ?? []).map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    image_url: a.image_url ?? null,
    category: a.category,
    breed_slug: a.breed_slug ?? null,
    titleWords: words(a.title),
    keywordWords: words(Array.isArray(a.seo_keywords) ? a.seo_keywords.join(' ') : ''),
  }));
  // Nombre de fois où chaque article figure dans le top 3 d'un autre (sert à la 4e place)
  const top3Count = new Map<string, number>(list.map(a => [a.slug, 0]));
  for (const a of list) for (const r of scoreRelated(a, list, TOP)) top3Count.set(r.slug, (top3Count.get(r.slug) ?? 0) + 1);
  memo = { at: Date.now(), list, top3Count };
  return memo;
}

export function scoreRelated(
  source: { slug: string; category: string; breed_slug: string | null; titleWords: Set<string>; keywordWords: Set<string> },
  candidates: Candidate[],
  limit: number,
): Candidate[] {
  return candidates
    .filter(c => c.slug !== source.slug)
    .map(c => {
      let score = 0;
      if (source.breed_slug && c.breed_slug === source.breed_slug) score += 12;
      score += 4 * overlap(source.keywordWords, c.keywordWords);
      score += 2 * overlap(source.titleWords, c.titleWords);
      if (c.category === source.category) score += 5;
      return { c, score, tie: pairHash(source.slug, c.slug) };
    })
    // Un article d'une autre catégorie n'est retenu que s'il partage vraiment le sujet
    .filter(x => x.c.category === source.category || x.score >= 8)
    .sort((x, y) => y.score - x.score || x.tie - y.tie)
    .slice(0, limit)
    .map(x => x.c);
}

export async function getRelatedArticles(
  article: { slug: string; title: string; category: string; seo_keywords?: string[] | null; breed_slug?: string | null },
  limit = 4,
): Promise<RelatedArticle[]> {
  const { list, top3Count } = await loadCandidates();
  return pickRelated({
    slug: article.slug,
    category: article.category,
    breed_slug: article.breed_slug ?? null,
    titleWords: words(article.title),
    keywordWords: words((article.seo_keywords ?? []).join(' ')),
  }, list, top3Count, limit).map(({ id, title, slug, image_url }) => ({ id, title, slug, image_url }));
}

type Source = Parameters<typeof scoreRelated>[0];

export function pickRelated(source: Source, list: Candidate[], top3Count: Map<string, number>, limit = 4): Candidate[] {
  const top = scoreRelated(source, list, Math.min(TOP, limit));
  if (limit <= top.length) return top;
  const taken = new Set([source.slug, ...top.map(t => t.slug)]);
  // On garde les BOOST_POOL articles les moins proposés de la catégorie, puis on en tire un par
  // hachage de la paire : les places sont réparties entre eux au lieu d'aller toutes au même.
  const BOOST_POOL = 4;
  const boost = list
    .filter(c => c.category === source.category && !taken.has(c.slug))
    .sort((x, y) => (top3Count.get(x.slug) ?? 0) - (top3Count.get(y.slug) ?? 0) || x.slug.localeCompare(y.slug))
    .slice(0, BOOST_POOL)
    .sort((x, y) => pairHash(source.slug, x.slug) - pairHash(source.slug, y.slug))
    .slice(0, limit - top.length);
  return [...top, ...boost];
}

/** Pour les scripts de contrôle : candidats (mots déjà calculés) et compteur top 3. */
export async function getRelatedCandidates() {
  return loadCandidates();
}
