import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_URL_MAP, ANIMAL_LABEL, ANIMAL_EMOJI, ANIMAL_GRADIENT, ANIMAL_URL } from '@/lib/breeds-list';

export const revalidate = 3600;

interface Props { params: { animal: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const animalType = ANIMAL_URL_MAP[params.animal];
  if (!animalType) return {};
  return {
    title: `Races de ${ANIMAL_LABEL[animalType].toLowerCase()} - Fiches complètes | Mes Poilus`,
    description: `Toutes nos fiches races ${ANIMAL_LABEL[animalType].toLowerCase()} : caractère, santé, entretien. Trouvez la race qui vous correspond.`,
  };
}

export default async function AnimalRacesPage({ params }: Props) {
  const animalType = ANIMAL_URL_MAP[params.animal];
  if (!animalType) notFound();

  const supabase = createAdminClient();
  const { data: breeds } = await supabase
    .from('breeds')
    .select('name, slug, content')
    .eq('animal', animalType)
    .eq('status', 'published')
    .not('content', 'is', null)
    .order('name', { ascending: true });

  const gradient = ANIMAL_GRADIENT[animalType];

  return (
    <div className="min-h-screen bg-white">

      {/* Bannière */}
      <div className={`bg-gradient-to-r ${gradient} px-6 md:px-8 py-8`}>
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <span className="text-5xl">{ANIMAL_EMOJI[animalType]}</span>
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-0.5">Fiches races</p>
            <h1 className="text-2xl font-bold text-white">{ANIMAL_LABEL[animalType]}</h1>
            <p className="text-white/80 text-sm mt-0.5">
              {breeds && breeds.length > 0
                ? `${breeds.length} race${breeds.length > 1 ? 's' : ''} disponible${breeds.length > 1 ? 's' : ''}`
                : 'Fiches en cours de génération'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-4">
            <Link href="/races" className="text-sm text-orange-600 hover:underline">← Toutes les catégories</Link>
          </div>

          {!breeds || breeds.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-4xl mb-3">{ANIMAL_EMOJI[animalType]}</p>
              <p className="text-gray-600 font-medium">Fiches en cours de génération</p>
              <p className="text-gray-400 text-sm mt-1">Revenez bientôt !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {breeds.map(breed => (
                <Link
                  key={breed.slug}
                  href={`/races/${ANIMAL_URL[animalType]}/${breed.slug}`}
                  className="group bg-white border border-gray-200 hover:border-orange-300 rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
                >
                  <h2 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
                    {breed.name}
                  </h2>
                  {breed.content?.excerpt && (
                    <p className="text-gray-500 text-sm line-clamp-2">{breed.content.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    {breed.content?.taille && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">{breed.content.taille}</span>
                    )}
                    {breed.content?.niveau_activite && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">{breed.content.niveau_activite}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
