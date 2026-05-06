import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import AdoptionPostForm from './AdoptionPostForm';
import type { AdoptionPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { getHeroPhotos, getBannerPhotos } from '@/lib/unsplash';

export const metadata: Metadata = {
  title: 'Adoption animaux',
  description: 'Trouvez un animal à adopter ou déposez une annonce pour donner un animal. Chiens, chats, oiseaux et plus.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/adoption' },
};

export const revalidate = 60;

const ANIMAL_TYPES = [
  { id: 'all',     label: 'Tous',     emoji: '🐾' },
  { id: 'chien',   label: 'Chiens',   emoji: '🐕' },
  { id: 'chat',    label: 'Chats',    emoji: '🐈' },
  { id: 'oiseau',  label: 'Oiseaux',  emoji: '🦜' },
  { id: 'rongeur', label: 'Rongeurs', emoji: '🐹' },
  { id: 'reptile', label: 'Reptiles', emoji: '🦎' },
  { id: 'autre',   label: 'Autre',    emoji: '🐾' },
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
  chien:   { border: 'border-amber-500/30',   badge: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  chat:    { border: 'border-purple-500/30',  badge: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  oiseau:  { border: 'border-sky-500/30',     badge: 'text-sky-400',     bg: 'bg-sky-500/10'     },
  rongeur: { border: 'border-emerald-500/30', badge: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  reptile: { border: 'border-lime-500/30',    badge: 'text-lime-400',    bg: 'bg-lime-500/10'    },
  autre:   { border: 'border-gray-500/30',    badge: 'text-gray-400',    bg: 'bg-gray-500/10'    },
};

async function getPosts(animal?: string): Promise<AdoptionPost[]> {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('adoption_posts')
      .select('id,poster_name,animal_type,breed,age,gender,region,description,contact_info,photo_urls,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);
    if (animal && animal !== 'all') q = q.eq('animal_type', animal);
    const { data } = await q;
    return (data as AdoptionPost[]) ?? [];
  } catch {
    return [];
  }
}

interface Props {
  searchParams: { animal?: string };
}

export default async function AdoptionPage({ searchParams }: Props) {
  const animal = searchParams.animal;
  const bannerQuery = animal && ADOPTION_BANNER_QUERIES[animal];
  const [posts, allPhotos] = await Promise.all([
    getPosts(animal),
    bannerQuery ? getBannerPhotos(bannerQuery) : getHeroPhotos(),
  ]);
  const activeType = ANIMAL_TYPES.find(t => t.id === (animal ?? 'all')) ?? ANIMAL_TYPES[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="px-8 py-8 space-y-8">
        <BackButton label="← Accueil" href="/" />

        {/* Hero */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Animaux à adopter</h1>
            <p className="text-gray-500 text-sm mt-1">
              Trouvez un compagnon près de chez vous, ou aidez un animal à trouver un foyer aimant.
            </p>
          </div>
          <a
            href="#deposer"
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Déposer une annonce
          </a>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {ANIMAL_TYPES.map(t => {
            const isActive = (t.id === 'all' && !animal) || t.id === animal;
            return (
              <Link
                key={t.id}
                href={t.id === 'all' ? '/adoption' : `/adoption?animal=${t.id}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-black border-amber-500 font-semibold'
                    : 'bg-transparent text-gray-400 border-[#333] hover:border-amber-500/50 hover:text-amber-400'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bandeau */}
        <div className="relative h-28 rounded-2xl overflow-hidden bg-[#111]">
          <div className="absolute right-0 top-0 bottom-0 w-[55%] flex gap-0.5">
            {allPhotos.filter(Boolean).map((photo, i) => (
              <div key={i} className="relative flex-1">
                <Image src={photo!.url} alt={photo!.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-[50%] bg-gradient-to-r from-amber-600 via-amber-500/70 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-center px-6 z-10">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium">Filtre</p>
              <p className="text-white font-bold text-xl">{activeType.emoji} {activeType.label}</p>
              <p className="text-white/60 text-xs mt-0.5">{posts.length} annonce{posts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Grille */}
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <p className="text-gray-500">Aucune annonce pour le moment.</p>
            <p className="text-gray-500 text-sm mt-1">Soyez le premier à déposer une annonce !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {posts.map(post => <AdoptionCard key={post.id} post={post} />)}
          </div>
        )}

        {/* Formulaire */}
        <div id="deposer" className="pt-8 border-t border-gray-800">
          <AdoptionPostForm />
        </div>
      </div>
    </div>
  );
}

function AdoptionCard({ post }: { post: AdoptionPost }) {
  const colors = TYPE_COLOR[post.animal_type] ?? TYPE_COLOR.autre;
  const typeInfo = ANIMAL_TYPES.find(t => t.id === post.animal_type);
  const date = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  return (
    <div className={`bg-[#111] rounded-2xl border ${colors.border} overflow-hidden flex flex-col`}>
      {/* Photo principale */}
      {post.photo_urls?.length > 0 ? (
        <div className="relative h-44 overflow-hidden bg-gray-800">
          <Image
            src={post.photo_urls[0]}
            alt={`${typeInfo?.label ?? post.animal_type} à adopter`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {post.photo_urls.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              +{post.photo_urls.length - 1} photo{post.photo_urls.length > 2 ? 's' : ''}
            </span>
          )}
        </div>
      ) : null}

      {/* Header coloré */}
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
        <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${colors.badge}`}>
          <span>{typeInfo?.emoji ?? '🐾'}</span>
          {typeInfo?.label ?? post.animal_type}
        </span>
        <span className="text-[10px] text-gray-500">{date}</span>
      </div>

      {/* Corps */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Tags race / âge / genre */}
        <div className="flex flex-wrap gap-1.5">
          {post.breed  && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{post.breed}</span>}
          {post.age    && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{post.age}</span>}
          {post.gender !== 'inconnu' && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full capitalize">{post.gender}</span>}
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1">
          📍 <span>{post.region}</span>
        </p>

        <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 flex-1">
          {post.description}
        </p>

        {/* Footer carte */}
        <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-600">Par {post.poster_name}</span>
          <span className={`text-xs font-medium ${colors.badge} truncate max-w-[140px]`}>
            {post.contact_info}
          </span>
        </div>
      </div>
    </div>
  );
}
