export interface TrendingItem {
  title: string;
  traffic?: string;
}

// ── RSS général (tendances du jour, marchés francophones) ────────────────────

function parseTrendsRss(xml: string): TrendingItem[] {
  const items: TrendingItem[] = [];
  for (const item of [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]) {
    const titleMatch = item[1].match(/<title>(?:<!\[CDATA\[)?([^\]<]+?)(?:\]\]>)?<\/title>/);
    const trafficMatch = item[1].match(/<ht:approx_traffic>(.+?)<\/ht:approx_traffic>/);
    if (titleMatch) items.push({ title: titleMatch[1].trim(), traffic: trafficMatch?.[1]?.trim() });
  }
  return items;
}

const RSS_GEOS = ['FR', 'BE', 'CH', 'LU', 'CA', 'MA', 'DZ', 'TN', 'SN', 'CI', 'CM'] as const;

export async function getDailyTrends(): Promise<TrendingItem[]> {
  try {
    const responses = await Promise.all(
      RSS_GEOS.map(geo =>
        fetch(`https://trends.google.com/trending/rss?geo=${geo}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        }).then(r => r.text()).catch(() => '')
      )
    );
    const seen = new Set<string>();
    const merged: TrendingItem[] = [];
    for (const item of responses.flatMap(xml => xml ? parseTrendsRss(xml) : [])) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) { seen.add(key); merged.push(item); }
    }
    return merged.slice(0, 20);
  } catch { return []; }
}

// ── Google Autocomplete - suggestions en temps réel par animal ───────────────

const ANIMAL_SEEDS: Record<string, string[]> = {
  chiens:   ['chien ', 'mon chien ', 'pourquoi mon chien '],
  chats:    ['chat ', 'mon chat ', 'pourquoi mon chat '],
  oiseaux:  ['perruche ', 'perroquet ', 'oiseau '],
  rongeurs: ['lapin ', 'hamster ', 'cochon d\'inde '],
  reptiles: ['tortue ', 'gecko ', 'serpent '],
};

export async function getAnimalSuggestions(animal: string): Promise<string[]> {
  const seeds = ANIMAL_SEEDS[animal] ?? [`${animal.replace(/s$/, '')} `];
  try {
    const results = await Promise.all(
      seeds.map(seed =>
        fetch(
          `https://suggestqueries.google.com/complete/search?q=${encodeURIComponent(seed)}&hl=fr&gl=fr&client=firefox`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
          .then(r => r.json())
          .then((data: [string, string[]]) => data[1] ?? [])
          .catch(() => [] as string[])
      )
    );
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const s of results.flat()) {
      if (!seen.has(s)) { seen.add(s); merged.push(s); }
    }
    return merged.slice(0, 20);
  } catch { return []; }
}

// ── Formatters pour Lucas ────────────────────────────────────────────────────

export function formatTrendsForLucas(trends: TrendingItem[]): string {
  if (trends.length === 0) return '';
  return [
    "=== TENDANCES GOOGLE AUJOURD'HUI (marchés francophones) ===",
    ...trends.map(t => `- ${t.title}${t.traffic ? ` (${t.traffic} recherches)` : ''}`),
  ].join('\n');
}

export function formatSuggestionsForLucas(animal: string, suggestions: string[]): string {
  if (suggestions.length === 0) return '';
  return [
    `=== CE QUE LES GENS CHERCHENT MAINTENANT SUR GOOGLE (${animal}) ===`,
    ...suggestions.map(s => `- ${s}`),
  ].join('\n');
}
