import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { normalizeSearch } from '@/lib/search';
import type { AdoptionPost } from '@/types';
import Link from 'next/link';
import AdBanner from '@/components/ui/AdBanner';
import AdoptionSearchBar from '@/components/adoption/AdoptionSearchBar';
import AdoptionFilters from '@/components/adoption/AdoptionFilters';
import AdoptionPostsGrid from '@/components/adoption/AdoptionPostsGrid';
import AdoptionAlertForm from '@/components/adoption/AdoptionAlertForm';
import { Suspense } from 'react';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, Heart } from 'lucide-react';
import DirectionalTransition from '@/components/ui/DirectionalTransition';

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


async function getPosts(animal?: string, search?: string, pays?: string, gender?: string, race?: string, ageUnit?: string): Promise<AdoptionPost[]> {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('adoption_posts')
      .select('id,poster_name,animal_type,breed,age,gender,region,description,photo_urls,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);
    if (animal && animal !== 'all') q = q.eq('animal_type', animal);
    if (search)   q = q.ilike('search_text', `%${normalizeSearch(search)}%`);
    if (pays)     q = q.ilike('region', `%${pays}`);
    if (gender)   q = q.eq('gender', gender);
    if (race)     q = q.ilike('breed', `%${race}%`);
    if (ageUnit)  q = q.ilike('age', `%${ageUnit}`);
    const { data } = await q;
    return (data as AdoptionPost[]) ?? [];
  } catch {
    return [];
  }
}

async function getAvailableFilters(animal?: string, pays?: string, gender?: string, race?: string, ageUnit?: string) {
  try {
    const supabase = createAdminClient();
    let q = supabase
      .from('adoption_posts')
      .select('gender,breed,age,region')
      .eq('status', 'approved');
    if (animal && animal !== 'all') q = q.eq('animal_type', animal);
    if (pays)    q = q.ilike('region', `%${pays}`);
    if (gender)  q = q.eq('gender', gender);
    if (race)    q = q.ilike('breed', `%${race}%`);
    if (ageUnit) q = q.ilike('age', `%${ageUnit}`);
    const { data } = await q;
    if (!data) return { countries: [], breeds: [], ageUnits: [], genders: [] };

    const countries = [...new Set(data.map(p => {
      if (!p.region) return null;
      const parts = p.region.split(', ');
      return parts.length > 1 ? parts[parts.length - 1] : null;
    }).filter(Boolean))].sort() as string[];

    const breeds = [...new Set(data.map(p => p.breed).filter(Boolean))].sort() as string[];

    const ageUnits = [...new Set(data.map(p => {
      if (!p.age) return null;
      return p.age.includes('mois') ? 'mois' : 'ans';
    }).filter(Boolean))] as string[];

    const genders = [...new Set(data.map(p => p.gender).filter(g => g && g !== 'inconnu'))] as string[];

    return { countries, breeds, ageUnits, genders };
  } catch {
    return { countries: [], breeds: [], ageUnits: [], genders: [] };
  }
}

interface Props {
  searchParams: Promise<{ animal?: string; q?: string; pays?: string; gender?: string; race?: string; age_unit?: string; view?: string; alert_ok?: string; alert_off?: string; alert_error?: string }>;
}

export default async function AdoptionPage({ searchParams }: Props) {
  const sp      = await searchParams;
  const animal  = sp.animal;
  const search  = sp.q?.trim();
  const pays    = sp.pays?.trim();
  const gender  = sp.gender?.trim();
  const race    = sp.race?.trim();
  const ageUnit = sp.age_unit?.trim();

  const [posts, availableFilters] = await Promise.all([
    getPosts(animal, search, pays, gender, race, ageUnit),
    getAvailableFilters(animal, pays, gender, race, ageUnit),
  ]);
  const activeType = ANIMAL_TYPES.find(t => t.id === (animal ?? 'all')) ?? ANIMAL_TYPES[0];

  return (
    <DirectionalTransition>
    <div className="min-h-screen px-6 md:px-8 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Animaux à adopter</h1>
        <p className="text-sm text-gray-500">Trouvez un compagnon ou aidez un animal à trouver un foyer</p>
      </div>

      {/* Filtres + bouton */}
      <div className="flex flex-wrap items-center gap-3">
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

        {/* Séparateur visuel */}
        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Filtres dynamiques */}
        <Suspense fallback={null}>
          <AdoptionFilters available={availableFilters} />
        </Suspense>

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
        <AdoptionPostsGrid posts={posts} view={sp.view === 'list' ? 'list' : 'grid'} />
      )}

      {/* Bouton flottant alertes + modal (fixed, toujours visible) */}
      <AdoptionAlertForm />

      {/* Banners confirmation / désinscription */}
      {sp.alert_ok && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="font-semibold text-green-800">Alerte activée !</p>
          <p className="text-green-700 text-sm mt-1">Vous recevrez un email à chaque nouvelle annonce correspondant à vos critères.</p>
        </div>
      )}
      {sp.alert_off && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <p className="font-semibold text-gray-700">Alerte désactivée.</p>
          <p className="text-gray-500 text-sm mt-1">Vous ne recevrez plus de notifications pour cette alerte.</p>
        </div>
      )}
      {sp.alert_error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="font-semibold text-red-700">Lien invalide ou expiré.</p>
        </div>
      )}

      <AdBanner slot="1148710530" className="mt-12" />

    </div>
    </DirectionalTransition>
  );
}

