import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import type { AdoptionPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import AdBanner from '@/components/ui/AdBanner';
import AdoptionSearchBar from '@/components/adoption/AdoptionSearchBar';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, Heart, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Adoption animaux',
  description: 'Trouvez un animal à adopter ou déposez une annonce pour donner un animal. Chiens, chats, oiseaux et plus.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/adoption' },
};

export const revalidate = 60;

const ANIMAL_TYPES = [
  { id: 'all',     label: 'Tous',     icon: PawPrint },
  { id: 'chien',   label: 'Chiens',   icon: Dog },
  { id: 'chat',    label: 'Chats',    icon: Cat },
  { id: 'oiseau',  label: 'Oiseaux',  icon: Bird },
  { id: 'rongeur', label: 'Rongeurs', icon: Mouse },
  { id: 'reptile', label: 'Reptiles', icon: Zap },
  { id: 'autre',   label: 'Autre',    icon: Heart },
];

const ADOPTION_BANNER_QUERIES: Record<string, string> = {
  chien:   'cute dog puppy',
  chat:    'cute cat kitten',
  oiseau:  'pet bird parrot',
  rongeur: 'rabbit hamster guinea pig',
  reptile: 'lizard reptile gecko',
  autre:   'pet animal cute',
};

const TYPE_COLOR: Record<string, { border: string; badge: string; bg: string }> = {
  chien:   { border: 'border-orange-300',   badge: 'text-orange-700',   bg: 'bg-orange-100'   },
  chat:    { border: 'border-pink-300',     badge: 'text-pink-700',     bg: 'bg-pink-100'     },
  oiseau:  { border: 'border-blue-300',     badge: 'text-blue-700',     bg: 'bg-blue-100'     },
  rongeur: { border: 'border-teal-300',     badge: 'text-teal-700',     bg: 'bg-teal-100'     },
  reptile: { border: 'border-green-300',    badge: 'text-green-700',    bg: 'bg-green-100'    },
  autre:   { border: 'border-gray-300',     badge: 'text-gray-700',     bg: 'bg-gray-100'     },
};

async function getPosts(animal?: string, search?: string): Promise<AdoptionPost[]> {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('adoption_posts')
      .select('id,poster_name,animal_type,breed,age,gender,region,description,photo_urls,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);
    if (animal && animal !== 'all') q = q.eq('animal_type', animal);
    if (search) q = q.or(`breed.ilike.%${search}%,description.ilike.%${search}%,region.ilike.%${search}%`);
    const { data } = await q;
    return (data as AdoptionPost[]) ?? [];
  } catch {
    return [];
  }
}

interface Props {
  searchParams: { animal?: string; q?: string };
}

export default async function AdoptionPage({ searchParams }: Props) {
  const animal = searchParams.animal;
  const search = searchParams.q?.trim();
  const posts = await getPosts(animal, search);
  const activeType = ANIMAL_TYPES.find(t => t.id === (animal ?? 'all')) ?? ANIMAL_TYPES[0];

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Animaux à adopter</h1>
        <p className="text-sm text-gray-500">Trouvez un compagnon ou aidez un animal à trouver un foyer</p>
      </div>

      {/* Filtres + bouton */}
      <div className="flex flex-wrap gap-3">
        {ANIMAL_TYPES.map(t => {
          const isActive = (t.id === 'all' && !animal) || t.id === animal;
          const IconComponent = t.icon;
          return (
            <Link
              key={t.id}
              href={t.id === 'all' ? '/adoption' : `/adoption?animal=${t.id}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isActive
                  ? 'bg-orange-600 text-white border-orange-600 focus:ring-orange-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:text-orange-600 hover:shadow-md focus:ring-orange-300'
              }`}
            >
              <IconComponent size={18} strokeWidth={1.5} />
              <span>{t.label}</span>
            </Link>
          );
        })}
        <Link
          href="/adoption/deposer"
          className="ml-auto text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 font-medium bg-rose-500 hover:bg-rose-600 text-white border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
        >
          <Heart size={16} strokeWidth={1.5} />
          Déposer une annonce
        </Link>
      </div>

      {/* Recherche */}
      <AdoptionSearchBar defaultValue={search ?? ''} />

      {/* Banner */}
      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Filtré par</p>
          <p className="text-white font-bold text-lg md:text-xl capitalize">{activeType.label}</p>
        </div>
        <p className="text-white/60 text-sm">{posts.length} annonce{posts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-orange-50 rounded-3xl border border-orange-100">
          <p className="text-gray-700 font-medium text-lg">Aucune annonce pour le moment.</p>
          <p className="text-gray-600 text-base mt-2">Soyez le premier à déposer une annonce !</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {posts.length} annonce{posts.length !== 1 ? 's' : ''}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map(post => <AdoptionCard key={post.id} post={post} />)}
          </div>
        </div>
      )}

      <AdBanner slot="1148710530" className="mt-12" />

    </div>
  );
}

function AdoptionCard({ post }: { post: AdoptionPost }) {
  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const IconComponent = typeInfo?.icon ?? PawPrint;
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  return (
    <Link href={`/adoption/${post.id}`} className={`bg-white rounded-2xl border ${colors.border} shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group focus-within:ring-2 focus-within:ring-orange-300`}>
      {post.photo_urls?.length > 0 ? (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-blue-100">
          <Image
            src={post.photo_urls[0]}
            alt={`${typeInfo?.label ?? post.animal_type} à adopter`}
            fill
            className="object-cover group-hover:scale-105 transition-smooth"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {post.photo_urls.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              +{post.photo_urls.length - 1} photo{post.photo_urls.length > 2 ? 's' : ''}
            </span>
          )}
        </div>
      ) : null}

      <div className={`${colors.bg} px-4 py-4 flex items-center justify-between border-b ${colors.border}`}>
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
          <MapPin size={16} strokeWidth={1.5} />
          <span>{post.region}</span>
        </p>

        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 flex-1">
          {post.description}
        </p>

        <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">Par <span className="font-medium text-gray-700">{post.poster_name}</span></span>
          <span className="text-xs font-medium text-orange-600 hover:underline">Voir l'annonce →</span>
        </div>
      </div>
    </Link>
  );
}
