import Link from 'next/link';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_LABEL, ANIMAL_URL, ANIMAL_EMOJI, ANIMAL_GRADIENT, type AnimalType } from '@/lib/breeds-list';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Fiches races animaux - Caractère, Santé, Entretien | Mes Poilus',
  description: 'Découvrez nos fiches races détaillées : chiens, chats, oiseaux, rongeurs et reptiles. Caractère, santé, entretien — tout ce qu\'il faut savoir avant d\'adopter.',
};

const ANIMALS: AnimalType[] = ['chien', 'chat', 'oiseau', 'rongeur', 'reptile'];

export default async function RacesPage() {
  const supabase = createAdminClient();

  const { data: counts } = await supabase
    .from('breeds')
    .select('animal')
    .eq('status', 'published')
    .not('content', 'is', null);

  const countByAnimal = (counts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.animal] = (acc[r.animal] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Fiches races</h1>
          <p className="text-gray-500 text-sm">Caractère, santé, entretien — tout ce qu&apos;il faut savoir sur chaque race</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ANIMALS.map(animal => {
            const count = countByAnimal[animal] ?? 0;
            const gradient = ANIMAL_GRADIENT[animal];
            return (
              <Link
                key={animal}
                href={`/races/${ANIMAL_URL[animal]}`}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md"
              >
                <div className={`bg-gradient-to-br ${gradient} h-28 flex items-center justify-center`}>
                  <span className="text-6xl">{ANIMAL_EMOJI[animal]}</span>
                </div>
                <div className="p-5 bg-white">
                  <h2 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                    {ANIMAL_LABEL[animal]}
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {count > 0 ? `${count} race${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}` : 'Bientôt disponible'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-10">
          Nouvelles fiches ajoutées régulièrement. Les informations sont des moyennes — chaque animal est unique.
        </p>
      </div>
    </div>
  );
}
