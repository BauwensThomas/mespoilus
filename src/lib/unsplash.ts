const BASE_URL = 'https://api.unsplash.com';

function getKey(): string | null {
  return process.env.UNSPLASH_ACCESS_KEY || null;
}

async function unsplashGet<T>(path: string): Promise<T | null> {
  const key = getKey();
  if (!key) return null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Client-ID ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[unsplash] API erreur:', res.status, res.statusText, path.slice(0, 100));
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error('[unsplash] exception:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function trackDownload(downloadLocation: string): Promise<void> {
  const key = getKey();
  if (!key) return;
  fetch(downloadLocation, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
}

// ─── Types internes Unsplash REST ──────────────────────────────────────────────

interface UnsplashRawPhoto {
  urls: { regular: string; small: string };
  alt_description: string | null;
  user: { name: string; links: { html: string } };
  links: { download_location: string };
}

interface SearchResponse {
  results: UnsplashRawPhoto[];
}

// ─── Type public ───────────────────────────────────────────────────────────────

export interface UnsplashPhoto {
  url: string;
  thumbUrl: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

// ─── Requêtes par catégorie / agent ───────────────────────────────────────────

export const CATEGORY_QUERIES: Record<string, string> = {
  chiens: 'cute dog puppy',
  chats: 'cute cat kitten',
  oiseaux: 'pet bird parrot',
  rongeurs: 'rabbit hamster guinea pig',
  reptiles: 'lizard reptile gecko',
  general: 'pet animal cute',
};

const AGENT_QUERIES: Record<string, string> = {
  thomas: 'business leader professional office',
  marie: 'writing creative content desk',
  lucas: 'seo analytics data computer',
  emma: 'social media phone creative colorful',
  maxime: 'developer laptop code programming',
  lea: 'customer service support smile',
  antoine: 'finance accounting business report',
  nathalie: 'cybersecurity security shield technology',
};

// ─── Placeholders locaux ───────────────────────────────────────────────────────

export const CATEGORY_PLACEHOLDER: Record<string, string> = {
  chiens: '/images/categories/chiens.svg',
  chats: '/images/categories/chats.svg',
  oiseaux: '/images/categories/oiseaux.svg',
  rongeurs: '/images/categories/rongeurs.svg',
  reptiles: '/images/categories/reptiles.svg',
  general: '/images/categories/general.svg',
};

export const AGENT_PLACEHOLDER: Record<string, string> = {
  thomas: '/images/agents/thomas.svg',
  marie: '/images/agents/marie.svg',
  lucas: '/images/agents/lucas.svg',
  emma: '/images/agents/emma.svg',
  maxime: '/images/agents/maxime.svg',
  lea: '/images/agents/lea.svg',
  antoine: '/images/agents/antoine.svg',
  nathalie: '/images/agents/nathalie.svg',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mapPhoto(raw: UnsplashRawPhoto): UnsplashPhoto {
  return {
    url: raw.urls.regular,
    thumbUrl: raw.urls.small,
    alt: raw.alt_description ?? 'Photo animaux de compagnie',
    credit: raw.user.name,
    creditUrl: `${raw.user.links.html}?utm_source=mespoilus&utm_medium=referral`,
  };
}

function buildArticleQuery(title: string, category: string): string {
  const base = CATEGORY_QUERIES[category] ?? 'pet animal';
  const words = title
    .toLowerCase()
    .replace(/[^\wÀ-ÿ\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 2)
    .join(' ');
  return encodeURIComponent(`${base} ${words}`.trim());
}

// ─── API publiques ─────────────────────────────────────────────────────────────

export async function getPhotoForArticle(
  title: string,
  category: string
): Promise<UnsplashPhoto | null> {
  const query = buildArticleQuery(title, category);
  const data = await unsplashGet<SearchResponse>(
    `/search/photos?query=${query}&per_page=3&orientation=landscape&content_filter=high`
  );
  if (!data?.results.length) return null;

  const raw = pickRandom(data.results);
  await trackDownload(raw.links.download_location);
  return mapPhoto(raw);
}

export async function getPhotoForAgent(agentId: string): Promise<UnsplashPhoto | null> {
  const query = AGENT_QUERIES[agentId];
  if (!query) return null;

  const data = await unsplashGet<SearchResponse>(
    `/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&content_filter=high`
  );
  if (!data?.results.length) return null;

  const raw = pickRandom(data.results);
  await trackDownload(raw.links.download_location);
  return mapPhoto(raw);
}

export async function getBannerPhotos(query: string): Promise<(UnsplashPhoto | null)[]> {
  // per_page=5 matches getHeroPhotos -shares the Next.js fetch cache for the same query
  const data = await unsplashGet<SearchResponse>(
    `/search/photos?query=${encodeURIComponent(query)}&per_page=5&content_filter=high`
  );
  if (!data?.results.length) return [null];

  const raw = pickRandom(data.results);
  await trackDownload(raw.links.download_location);
  return [mapPhoto(raw)];
}

export async function getHeroPhotos(): Promise<(UnsplashPhoto | null)[]> {
  const animals = ['chiens', 'chats', 'oiseaux', 'rongeurs'] as const;
  return Promise.all(
    animals.map(async (cat) => {
      const query = encodeURIComponent(CATEGORY_QUERIES[cat]);
      const data = await unsplashGet<SearchResponse>(
        `/search/photos?query=${query}&per_page=5&content_filter=high`
      );
      if (!data?.results.length) return null;
      const raw = pickRandom(data.results);
      await trackDownload(raw.links.download_location);
      return mapPhoto(raw);
    })
  );
}
