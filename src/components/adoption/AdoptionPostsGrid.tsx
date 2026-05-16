'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, PawPrint, Dog, Cat, Bird, Mouse, Zap, Heart, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AdoptionPost } from '@/types';

const ANIMAL_TYPES = [
  { id: 'chien',   label: 'Chien',   icon: Dog },
  { id: 'chat',    label: 'Chat',    icon: Cat },
  { id: 'oiseau',  label: 'Oiseau',  icon: Bird },
  { id: 'rongeur', label: 'Rongeur', icon: Mouse },
  { id: 'reptile', label: 'Reptile', icon: Zap },
  { id: 'autre',   label: 'Autre',   icon: Heart },
];

const TYPE_COLOR: Record<string, { border: string; badge: string; bg: string }> = {
  chien:   { border: 'border-orange-300', badge: 'text-orange-700', bg: 'bg-orange-100' },
  chat:    { border: 'border-pink-300',   badge: 'text-pink-700',   bg: 'bg-pink-100'   },
  oiseau:  { border: 'border-blue-300',   badge: 'text-blue-700',   bg: 'bg-blue-100'   },
  rongeur: { border: 'border-teal-300',   badge: 'text-teal-700',   bg: 'bg-teal-100'   },
  reptile: { border: 'border-green-300',  badge: 'text-green-700',  bg: 'bg-green-100'  },
  autre:   { border: 'border-gray-300',   badge: 'text-gray-700',   bg: 'bg-gray-100'   },
};

function GridCard({ post }: { post: AdoptionPost }) {
  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const IconComponent = typeInfo?.icon ?? PawPrint;
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  return (
    <Link href={`/adoption/${post.id}`} className={`bg-white rounded-2xl border ${colors.border} shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group focus-within:ring-2 focus-within:ring-orange-300`}>
      {post.photo_urls?.length > 0 ? (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-blue-100">
          <Image src={post.photo_urls[0]} alt={`${typeInfo?.label ?? post.animal_type} à adopter`}
            fill className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
          {post.photo_urls.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              +{post.photo_urls.length - 1} photo{post.photo_urls.length > 2 ? 's' : ''}
            </span>
          )}
        </div>
      ) : null}
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between border-b ${colors.border}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${colors.badge}`}>
          <IconComponent size={16} strokeWidth={1.5} />
          {typeInfo?.label ?? post.animal_type}
        </span>
        <span className="text-xs text-gray-500 font-medium">{date}</span>
      </div>
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-wrap gap-2">
          {post.breed  && <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">{post.breed}</span>}
          {post.age    && <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">{post.age}</span>}
          {post.gender !== 'inconnu' && <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium capitalize">{post.gender}</span>}
        </div>
        <p className="text-sm text-gray-600 flex items-center gap-2 font-medium">
          <MapPin size={16} strokeWidth={1.5} /><span>{post.region}</span>
        </p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 flex-1">{post.description}</p>
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">Par <span className="font-medium text-gray-700">{post.poster_name}</span></span>
          <span className="text-xs font-medium text-orange-600 hover:underline">Voir l'annonce →</span>
        </div>
      </div>
    </Link>
  );
}

function ListRow({ post }: { post: AdoptionPost }) {
  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const IconComponent = typeInfo?.icon ?? PawPrint;
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  return (
    <Link href={`/adoption/${post.id}`} className={`bg-white border ${colors.border} rounded-xl flex items-center gap-4 px-4 py-3 hover:shadow-md transition-all duration-200 group`}>
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-blue-100">
        {post.photo_urls?.length > 0 ? (
          <Image src={post.photo_urls[0]} alt={typeInfo?.label ?? post.animal_type}
            fill className="object-cover" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint size={24} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold flex items-center gap-1 ${colors.badge}`}>
            <IconComponent size={12} strokeWidth={1.5} />
            {typeInfo?.label ?? post.animal_type}
          </span>
          {post.breed  && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.breed}</span>}
          {post.age    && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.age}</span>}
          {post.gender !== 'inconnu' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{post.gender}</span>}
        </div>
        <p className="text-sm text-gray-700 truncate">{post.description}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin size={11} strokeWidth={1.5} />{post.region}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-400 mb-1">{date}</p>
        <span className="text-xs font-medium text-orange-600 group-hover:underline">Voir →</span>
      </div>
    </Link>
  );
}

export default function AdoptionPostsGrid({ posts }: { posts: AdoptionPost[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('adoption-view');
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);

  function toggle(v: 'grid' | 'list') {
    setView(v);
    localStorage.setItem('adoption-view', v);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {posts.length} annonce{posts.length !== 1 ? 's' : ''}
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => toggle('grid')}
            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
            aria-label="Vue grille">
            <LayoutGrid size={18} strokeWidth={1.5} />
          </button>
          <button onClick={() => toggle('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
            aria-label="Vue liste">
            <List size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map(post => <GridCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map(post => <ListRow key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
