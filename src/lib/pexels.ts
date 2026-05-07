const BASE_URL = 'https://api.pexels.com/v1';

const CATEGORY_QUERIES: Record<string, string> = {
  chiens:   'dog puppy cute',
  chats:    'cat kitten cute',
  oiseaux:  'bird parrot pet',
  rongeurs: 'rabbit hamster guinea pig',
  reptiles: 'lizard gecko reptile',
  general:  'pet animal cute',
};

interface PexelsPhoto {
  id: number;
  alt: string;
  photographer: string;
  photographer_url: string;
  src: { large2x: string; large: string };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

export interface CategoryPhoto {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

export async function getPhotoForCategory(category: string): Promise<CategoryPhoto | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.log('[pexels] PEXELS_API_KEY absent');
    return null;
  }

  const query = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES.general;
  try {
    const res = await fetch(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: key }, cache: 'no-store' }
    );
    if (!res.ok) {
      console.error('[pexels] API erreur:', res.status, res.statusText);
      return null;
    }
    const data = await res.json() as PexelsResponse;
    if (!data.photos?.length) {
      console.log('[pexels] aucun résultat pour:', query);
      return null;
    }
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    return {
      url: photo.src.large2x || photo.src.large,
      alt: photo.alt || `Photo ${category}`,
      credit: photo.photographer,
      creditUrl: photo.photographer_url,
    };
  } catch (err) {
    console.error('[pexels] exception:', err instanceof Error ? err.message : err);
    return null;
  }
}
