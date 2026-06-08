'use client';

import { PawPrint, Dog, Cat, Bird, Mouse, Zap, Heart, MapPin } from 'lucide-react';
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

function GridCard({ post, index }: { post: AdoptionPost; index: number }) {
  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const IconComponent = typeInfo?.icon ?? PawPrint;
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
  
  // Déterminer si c'est une annonce récente (moins de 3 jours)
  const isNew = (new Date().getTime() - new Date(post.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link 
      href={`/adoption/${post.id}`} 
      className={`stagger-child group bg-white rounded-2xl border ${colors.border} shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-orange-300`}
    >
      {post.photo_urls?.length > 0 ? (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-blue-100">
          <Image 
            src={post.photo_urls[0]} 
            alt={`${typeInfo?.label ?? post.animal_type} à adopter`}
            fill 
            unoptimized 
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" 
          />
          {/* Badge Nouveau */}
          {isNew && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
              NOUVEAU
            </span>
          )}
          {post.photo_urls.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              +{post.photo_urls.length - 1} photo{post.photo_urls.length > 2 ? 's' : ''}
            </span>
          )}
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <PawPrint size={48} className="text-gray-300" strokeWidth={1} />
        </div>
      )}
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between border-b ${colors.border}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${colors.badge}`}>
          <IconComponent size={16} strokeWidth={1.5} />
          {typeInfo?.label ?? post.animal_type}
        </span>
        <span className="text-xs text-gray-500 font-medium">{date}</span>
      </div>
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-wrap gap-2">
          {post.breed  && <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">{post.breed}</span>}
          {post.age    && <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">{post.age}</span>}
          {post.gender !== 'inconnu' && (
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium capitalize hover:bg-gray-200 transition-colors">
              {post.gender === 'male' ? '♂ Mâle' : '♀ Femelle'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 flex items-center gap-2 font-medium">
          <MapPin size={16} strokeWidth={1.5} /><span>{post.region}</span>
        </p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 flex-1">{post.description}</p>
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">Par <span className="font-medium text-gray-700">{post.poster_name}</span></span>
          <span className="text-xs font-medium text-orange-600 group-hover:underline group-hover:translate-x-1 transition-all duration-300 flex items-center gap-1">
            Voir l'annonce <span className="text-orange-600">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function ListRow({ post, index }: { post: AdoptionPost; index: number }) {
  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const IconComponent = typeInfo?.icon ?? PawPrint;
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
  const isNew = (new Date().getTime() - new Date(post.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link 
      href={`/adoption/${post.id}`} 
      className={`stagger-child bg-white border ${colors.border} rounded-xl flex items-center gap-4 px-4 py-3 hover:shadow-md hover:scale-[1.01] transition-all duration-300 group`}
    >
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-blue-100">
        {post.photo_urls?.length > 0 ? (
          <Image 
            src={post.photo_urls[0]} 
            alt={typeInfo?.label ?? post.animal_type}
            fill 
            unoptimized 
            className="object-cover group-hover:scale-110 transition-transform duration-300" 
            sizes="64px" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint size={24} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
        {isNew && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-semibold flex items-center gap-1 ${colors.badge}`}>
            <IconComponent size={12} strokeWidth={1.5} />
            {typeInfo?.label ?? post.animal_type}
          </span>
          {isNew && (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              NOUVEAU
            </span>
          )}
          {post.breed  && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.breed}</span>}
          {post.age    && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.age}</span>}
          {post.gender !== 'inconnu' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {post.gender === 'male' ? '♂ Mâle' : '♀ Femelle'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 truncate">{post.description}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin size={11} strokeWidth={1.5} />{post.region}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-500 mb-1">{date}</p>
        <span className="text-xs font-medium text-orange-600 group-hover:underline group-hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-1">
          Voir →
        </span>
      </div>
    </Link>
  );
}

export default function AdoptionPostsGrid({ posts, view = 'grid' }: { posts: AdoptionPost[]; view?: 'grid' | 'list' }) {
  return (
    <div className="stagger-container">
      <div className="mb-6 fade-up">
        <h2 className="text-2xl font-bold text-gray-900">
          {posts.length} annonce{posts.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map((post, index) => <GridCard key={post.id} post={post} index={index} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post, index) => <ListRow key={post.id} post={post} index={index} />)}
        </div>
      )}
    </div>
  );
}