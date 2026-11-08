import { createAdminClient } from '@/lib/supabase/server';

/**
 * Indexation sélective des pages /races (fiches + pages de filtres).
 *
 * Les fiches races sont courtes (~300 mots) et construites sur le même modèle : en masse, elles
 * font passer le site pour "beaucoup de pages minces" et Google ralentit l'exploration de tout le
 * site (180 pages "Détectée, actuellement non indexée" en nov. 2026, dont 97 % de pages races).
 *
 * Une page race n'est indexable (et présente dans le sitemap) que si :
 *  - elle a un article guide dédié (articles.breed_slug = slug, publié) ; ou
 *  - elle a obtenu au moins une impression Google sur les GSC_WINDOW_DAYS derniers jours
 *    (table gsc_weekly_stats, alimentée chaque semaine par le cron gsc-sync).
 * Les autres restent accessibles aux visiteurs en `noindex, follow`. Tout est dynamique : une
 * fiche qui reçoit un guide ou des impressions redevient indexable sans intervention.
 */
const GSC_WINDOW_DAYS = 56;

type RaceIndexing = { ok: boolean; paths: Set<string>; guideSlugs: Set<string> };

// Mémo en mémoire (5 min) : évite 2 requêtes Supabase par fiche lors des régénérations ISR
const MEMO_MS = 5 * 60_000;
let memo: { at: number; value: RaceIndexing } | null = null;

export async function getIndexableRacePaths(): Promise<RaceIndexing> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  const value = await loadIndexableRacePaths();
  if (value.ok) memo = { at: Date.now(), value };
  return value;
}

async function loadIndexableRacePaths(): Promise<RaceIndexing> {
  const paths = new Set<string>();
  const guideSlugs = new Set<string>();
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - GSC_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
    const [guides, gsc] = await Promise.all([
      supabase.from('articles').select('breed_slug').eq('status', 'published').not('breed_slug', 'is', null),
      supabase.from('gsc_weekly_stats').select('page').eq('page_type', 'race')
        .gte('week_start', since).gt('impressions', 0).range(0, 9999),
    ]);
    if (guides.error || gsc.error) throw new Error('lecture indexation races');
    for (const g of guides.data ?? []) if (g.breed_slug) guideSlugs.add(g.breed_slug);
    for (const r of gsc.data ?? []) {
      const path = String(r.page ?? '').replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
      if (path.startsWith('/races/')) paths.add(decodeURIComponent(path));
    }
    return { ok: true, paths, guideSlugs };
  } catch {
    // Erreur passagère : on ne met PAS de noindex (une page déjà indexée ne doit pas sortir de Google
    // pour une panne d'une minute) ; le sitemap, lui, retombe sur la liste vide.
    return { ok: false, paths, guideSlugs };
  }
}

/** `animalUrl` = segment d'URL ("chiens"), `slug` = slug de la fiche ou du filtre ("appartement"). */
export async function isRacePageIndexable(animalUrl: string, slug: string): Promise<boolean> {
  const { ok, paths, guideSlugs } = await getIndexableRacePaths();
  if (!ok) return true;
  return guideSlugs.has(slug) || paths.has(`/races/${animalUrl}/${slug}`);
}

export const NOINDEX_FOLLOW = { index: false, follow: true } as const;
