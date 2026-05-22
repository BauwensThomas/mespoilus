'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import type { BreedContent } from '@/lib/breeds-list';

interface BreedItem {
  name: string;
  slug: string;
  content: BreedContent | null;
  photo_url?: string | null;
}

interface Props {
  breeds: BreedItem[];
  animalUrl: string;
  search?: string;
  view?: 'grid' | 'list';
}

function GridCard({ breed, animalUrl }: { breed: BreedItem; animalUrl: string }) {
  return (
    <Link
      href={`/races/${animalUrl}/${breed.slug}`}
      className="group bg-white border border-gray-200 hover:border-orange-300 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      <div className="relative h-80 bg-gray-50 overflow-hidden flex items-center justify-center">
        {breed.photo_url ? (
          <Image
            src={breed.photo_url}
            alt={breed.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
            <ImageOff size={18} strokeWidth={1.5} className="text-gray-300" />
            <span className="text-xs text-gray-300 font-semibold tracking-wide">NO IMAGE</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h2 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-sm mb-1 truncate">{breed.name}</h2>
        {breed.content?.excerpt && (
          <p className="text-gray-500 text-xs line-clamp-2">{breed.content.excerpt}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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

function ListRow({ breed, animalUrl }: { breed: BreedItem; animalUrl: string }) {
  return (
    <Link
      href={`/races/${animalUrl}/${breed.slug}`}
      className="group bg-white border border-gray-200 hover:border-orange-300 rounded-xl flex items-center gap-4 px-4 py-3 transition-all duration-200 hover:shadow-md"
    >
      <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
        {breed.photo_url ? (
          <Image
            src={breed.photo_url}
            alt={breed.name}
            fill
            unoptimized
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <ImageOff size={16} strokeWidth={1.5} className="text-gray-300" />
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
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs capitalize hidden sm:inline min-w-[5rem] text-center">{breed.content.taille}</span>
        )}
        {breed.content?.niveau_activite && (
          <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs capitalize hidden sm:inline min-w-[4.5rem] text-center">{breed.content.niveau_activite}</span>
        )}
        <span className="text-orange-600 text-xs font-semibold">Voir →</span>
      </div>
    </Link>
  );
}

export default function BreedsList({ breeds, animalUrl, search, view = 'grid' }: Props) {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {breeds.map((b) => (
            <GridCard key={b.slug} breed={b} animalUrl={animalUrl} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {breeds.map((b) => (
            <ListRow key={b.slug} breed={b} animalUrl={animalUrl} />
          ))}
        </div>
      )}
    </div>
  );
}
