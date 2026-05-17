import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_URL_MAP, ANIMAL_LABEL, ANIMAL_URL, type Breed } from '@/lib/breeds-list';
import BreedsList from '@/components/races/BreedsList';
import BreedsSearchBar from '@/components/races/BreedsSearchBar';

export type Critere = 'appartement' | 'enfants' | 'debutants' | 'seniors';

export const CRITERE_LABEL: Record<Critere, string> = {
  appartement: 'Appartement',
  enfants:     'Enfants',
  debutants:   'Débutants',
  seniors:     'Seniors',
};

const CRITERE_INTRO: Record<Critere, (animal: string) => string> = {
  appartement: (a) => `Vous vivez en appartement et souhaitez adopter un ${a} ? Voici les races les mieux adaptées à la vie en intérieur, calmes et peu encombrantes.`,
  enfants:     (a) => `Vous avez des enfants et cherchez un ${a} compatible ? Ces races sont reconnues pour leur tempérament doux et patient avec les plus jeunes.`,
  debutants:   (a) => `Vous adoptez un ${a} pour la première fois ? Ces races sont idéales pour les propriétaires débutants, faciles à éduquer et peu exigeantes.`,
  seniors:     (a) => `À la recherche d'un compagnon calme et attachant ? Ces races conviennent particulièrement aux personnes seniors, sans demande excessive d'exercice.`,
};

const ALL_CRITERES: Critere[] = ['appartement', 'enfants', 'debutants', 'seniors'];

export function getStaticAnimals() {
  return ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles'].map(animal => ({ animal }));
}

export async function getBreedCritereMetadata(
  params: { animal: string },
  critere: Critere
): Promise<Metadata> {
  const animalType = ANIMAL_URL_MAP[params.animal];
  if (!animalType) return {};
  const animalLabel = ANIMAL_LABEL[animalType].toLowerCase();
  const label = CRITERE_LABEL[critere].toLowerCase();
  return {
    title: `Meilleure race de ${animalLabel} pour ${label} | Mes Poilus`,
    description: CRITERE_INTRO[critere](animalLabel),
    alternates: { canonical: `/races/${params.animal}/${critere}` },
  };
}

interface Props {
  params: { animal: string };
  critere: Critere;
  searchParams?: { q?: string; view?: string };
}

export default async function BreedCriterePage({ params, critere, searchParams }: Props) {
  const animalType = ANIMAL_URL_MAP[params.animal];
  if (!animalType) notFound();

  const q = searchParams?.q?.trim() ?? '';

  const supabase = createAdminClient();
  const { data: allBreeds } = await supabase
    .from('breeds')
    .select('name, slug, content, photo_url')
    .eq('animal', animalType)
    .eq('status', 'published')
    .not('content', 'is', null)
    .order('name', { ascending: true });

  const breeds = ((allBreeds ?? []) as Breed[]).filter(b => {
    if (b.content?.convient_pour?.[critere] !== true) return false;
    if (q) return b.name.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  const label = CRITERE_LABEL[critere];
  const animalLabel = ANIMAL_LABEL[animalType];
  const animalUrl = ANIMAL_URL[animalType];
  const animalLabelLower = animalLabel.toLowerCase().replace(/s$/, '');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Meilleures races de ${animalLabel.toLowerCase()} pour ${label.toLowerCase()}`,
    description: CRITERE_INTRO[critere](animalLabelLower),
    url: `${appUrl}/races/${params.animal}/${critere}`,
    inLanguage: 'fr',
  };

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-6 space-y-5">
      <div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          {animalLabel}
        </h1>
        <p className="text-gray-500 text-sm">Fiches races pour {label.toLowerCase()} : caractère, santé, entretien</p>
      </div>

      {/* Onglets filtres */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/races/${params.animal}`}
          className="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
        >
          Toutes
        </Link>
        {ALL_CRITERES.map(c => (
          <Link
            key={c}
            href={`/races/${params.animal}/${c}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              c === critere
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            {CRITERE_LABEL[c]}
          </Link>
        ))}
      </div>

      <Suspense>
        <BreedsSearchBar defaultValue={q} />
      </Suspense>

      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">{animalLabel} · {label}</p>
          <p className="text-white font-bold text-lg md:text-xl">Races pour {label.toLowerCase()}</p>
        </div>
        <p className="text-white/60 text-sm">
          {breeds.length > 0 ? `${breeds.length} race${breeds.length > 1 ? 's' : ''}` : 'Aucune'}
        </p>
      </div>

      <Link href="/races" className="inline-block text-sm text-orange-600 hover:underline">
        &larr; Toutes les catégories
      </Link>

      {breeds.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-600 font-medium">Aucune race disponible pour ce critère</p>
          <Link href={`/races/${params.animal}`} className="mt-4 inline-block text-sm text-orange-600 hover:underline">
            Voir toutes les races
          </Link>
        </div>
      ) : (
        <BreedsList breeds={breeds} animalUrl={animalUrl} view={searchParams?.view === 'list' ? 'list' : 'grid'} />
      )}
    </div>
  );
}
