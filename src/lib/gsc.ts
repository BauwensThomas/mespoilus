const CLIENT_ID = process.env.GSC_CLIENT_ID!;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET!;
const SITE_URL = 'https://www.mespoilus.com/';
export const GSC_SITE_ORIGIN = 'https://www.mespoilus.com';

export async function getAccessToken(): Promise<string> {
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('GSC_REFRESH_TOKEN manquant');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token GSC invalide : ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function querySearchConsole(accessToken: string, body: object) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GSC API erreur ${res.status}: ${await res.text()}`);
  return res.json();
}

export type GscPageType = 'blog' | 'produit' | 'race' | 'statique' | 'racine';

/** Classe une URL/chemin GSC par type de page pour segmenter les rapports SEO. */
export function classifyPageType(pageUrl: string): GscPageType {
  const path = pageUrl.replace(GSC_SITE_ORIGIN, '') || '/';
  if (path === '/') return 'racine';
  if (path.startsWith('/blog/')) return 'blog';
  if (path.startsWith('/boutique/') || path === '/boutique') return 'produit';
  if (path.startsWith('/races/')) return 'race';
  return 'statique';
}

export interface GscRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Récupère toutes les lignes (page x query) pour une plage de dates donnée, avec pagination.
 * Utilisé par le cron gsc-sync pour historiser au-delà des 16 mois gardés par l'UI GSC.
 */
export async function fetchAllPageQueryRows(startDate: string, endDate: string): Promise<GscRow[]> {
  const accessToken = await getAccessToken();
  const rows: GscRow[] = [];
  const PAGE_SIZE = 25000;
  let startRow = 0;

  for (;;) {
    const data = await querySearchConsole(accessToken, {
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: PAGE_SIZE,
      startRow,
    });
    const batch = (data.rows ?? []) as { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    for (const r of batch) {
      rows.push({
        page: r.keys[0],
        query: r.keys[1],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 1000) / 10,
        position: Math.round(r.position * 10) / 10,
      });
    }
    if (batch.length < PAGE_SIZE) break;
    startRow += PAGE_SIZE;
  }

  return rows;
}

export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPage {
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface GscInsights {
  topQueries: GscQuery[];
  lowCtrQueries: GscQuery[];
  topPages: GscPage[];
  period: string;
}

export async function getGscInsights(): Promise<GscInsights> {
  const accessToken = await getAccessToken();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const period = `${fmt(startDate)} → ${fmt(endDate)}`;

  const baseQuery = {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    rowLimit: 25,
  };

  const [queriesData, pagesData] = await Promise.all([
    querySearchConsole(accessToken, { ...baseQuery, dimensions: ['query'] }),
    querySearchConsole(accessToken, { ...baseQuery, dimensions: ['page'] }),
  ]);

  const topQueries: GscQuery[] = (queriesData.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));

  // Requêtes avec beaucoup d'impressions mais peu de clics (opportunités)
  const lowCtrQueries = topQueries
    .filter(q => q.impressions >= 20 && q.ctr < 3)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const topPages: GscPage[] = (pagesData.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; position: number }) => ({
    page: r.keys[0].replace('https://www.mespoilus.com', ''),
    clicks: r.clicks,
    impressions: r.impressions,
    position: Math.round(r.position * 10) / 10,
  }));

  return { topQueries: topQueries.slice(0, 15), lowCtrQueries, topPages: topPages.slice(0, 10), period };
}

export function formatGscForLucas(insights: GscInsights): string {
  const lines: string[] = [
    `=== DONNÉES GOOGLE SEARCH CONSOLE (${insights.period}) ===`,
    '',
    '--- TOP REQUÊTES (par clics) ---',
    ...insights.topQueries.map(q =>
      `"${q.query}" | ${q.clicks} clics | ${q.impressions} impressions | pos. ${q.position} | CTR ${q.ctr}%`
    ),
    '',
    '--- OPPORTUNITÉS (impressions élevées, CTR < 3%) ---',
    ...insights.lowCtrQueries.map(q =>
      `"${q.query}" | ${q.impressions} impressions | pos. ${q.position} | CTR ${q.ctr}%`
    ),
    '',
    '--- TOP PAGES (par clics) ---',
    ...insights.topPages.map(p =>
      `${p.page} | ${p.clicks} clics | pos. ${p.position}`
    ),
  ];
  return lines.join('\n');
}
