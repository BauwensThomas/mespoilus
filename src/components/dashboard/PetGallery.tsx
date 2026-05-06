import Image from 'next/image';
import { getRandomPetPhotos, type UnsplashPhoto } from '@/lib/unsplash';

// Photos de secours statiques (pas besoin de clé API pour afficher quelque chose)
const FALLBACK_PHOTOS = [
  { src: '/images/categories/chiens.svg', alt: 'Chiens', label: 'Chiens' },
  { src: '/images/categories/chats.svg', alt: 'Chats', label: 'Chats' },
  { src: '/images/categories/oiseaux.svg', alt: 'Oiseaux', label: 'Oiseaux' },
  { src: '/images/categories/rongeurs.svg', alt: 'Rongeurs', label: 'Rongeurs' },
];

export default async function PetGallery() {
  let photos: UnsplashPhoto[] = [];
  try {
    photos = await getRandomPetPhotos(4);
  } catch {
    // Fallback sur les SVGs locaux
  }

  const hasPhoots = photos.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Photos animaux
        </h2>
        {!hasPhoots && (
          <span className="text-[10px] text-gray-600">
            Configurez UNSPLASH_ACCESS_KEY pour des vraies photos
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {hasPhoots
          ? photos.map((photo, i) => (
              <div
                key={i}
                className="relative h-32 rounded-xl overflow-hidden bg-[#111] group"
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Attribution */}
                <a
                  href={photo.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="absolute bottom-2 left-2 right-2 text-[8px] text-white/50 hover:text-white/80 transition-colors truncate"
                >
                  {photo.credit}
                </a>
              </div>
            ))
          : FALLBACK_PHOTOS.map((p, i) => (
              <div
                key={i}
                className="relative h-32 rounded-xl overflow-hidden bg-[#111] group"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="25vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-3 text-[10px] text-white/60 font-medium">
                  {p.label}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
