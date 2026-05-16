'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { BreedContent } from '@/lib/breeds-list';

interface BreedItem {
  name: string;
  slug: string;
  content: BreedContent | null;
}

interface Props {
  breeds: BreedItem[];
  animalUrl: string;
  photos?: string[];
  search?: string;
  view?: 'grid' | 'list';
}

function GridCard({ breed, animalUrl, photo }: { breed: BreedItem; animalUrl: string; photo?: string }) {
  return (
    <Link
      href={`/races/${animalUrl}/${breed.slug}`}
      className="group bg-white border border-gray-200 hover:border-orange-300 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      <div className="relative h-36 bg-gradient-to-br from-orange-50 to-blue-50 overflow-hidden">
        {photo && (
          <Image
            src={photo}
            alt={breed.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        )}
      </div>
      <div className="p-4">
        <h2 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">{breed.name}</h2>
        {breed.content?.excerpt && (
          <p className="text-gray-500 text-sm line-clamp-2">{breed.content.excerpt}</p>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {breed.content?.taille && (
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs capitalize">{breed.content.taille}</span>
          )}
          {breed.content?.niveau_activite && (
            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs capitalize">{breed.content.niveau_activite}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ListRow({ breed, animalUrl, photo }: { breed: BreedItem; animalUrl: string; photo?: string }) {
  return (
    <Link
      href={`/races/${animalUrl}/${breed.slug}`}
      className="group bg-white border border-gray-200 hover:border-orange-300 rounded-xl flex items-center gap-4 px-4 py-3 transition-all duration-200 hover:shadow-md"
    >
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-blue-50">
        {photo && (
          <Image
            src={photo}
            alt={breed.name}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">{breed.name}</h2>
        {breed.content?.excerpt && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{breed.content.excerpt}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {breed.content?.taille && (
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs capitalize hidden sm:inline">{breed.content.taille}</span>
        )}
        {breed.content?.niveau_activite && (
          <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs capitalize hidden sm:inline">{breed.content.niveau_activite}</span>
        )}
        <span className="text-orange-600 text-xs font-semibold">Voir →</span>
      </div>
    </Link>
  );
}

export default function BreedsList({ breeds, animalUrl, photos = [], search, view = 'grid' }: Props) {
  return (
    <div className="space-y-4">
      {search && (
        <p className="text-sm text-gray-500">{breeds.length} race{breeds.length !== 1 ? 's' : ''} pour &quot;{search}&quot;</p>
      )}

      {breeds.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-600 font-medium">Aucune race trouvée{search ? ` pour "${search}"` : ''}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {breeds.map((b, i) => (
            <GridCard
              key={b.slug}
              breed={b}
              animalUrl={animalUrl}
              photo={photos.length > 0 ? photos[i % photos.length] : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {breeds.map((b, i) => (
            <ListRow
              key={b.slug}
              breed={b}
              animalUrl={animalUrl}
              photo={photos.length > 0 ? photos[i % photos.length] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
