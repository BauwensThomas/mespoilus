import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_URL_MAP, ANIMAL_LABEL, ANIMAL_EMOJI, ANIMAL_URL } from '@/lib/breeds-list';
import BreedsList from '@/components/races/BreedsList';
import BreedsSearchBar from '@/components/races/BreedsSearchBar';

export const revalidate = 3600;

interface Props {
  params: Promise<{ animal: string }>;
  searchParams: Promise<{ q?: string; view?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { animal } = await params;
  const animalType = ANIMAL_URL_MAP[animal];
  if (!animalType) return {};
  return {
    title: `Races de ${ANIMAL_LABEL[animalType].toLowerCase()} - Fiches complètes | Mes Poilus`,
    description: `Toutes nos fiches races ${ANIMAL_LABEL[animalType].toLowerCase()} : caractère, santé, entretien. Trouvez la race qui vous correspond.`,
  };
}

export default async function AnimalRacesPage({ params, searchParams }: Props) {
  const { animal } = await params;
  const { q: qParam, view } = await searchParams;
  const animalType = ANIMAL_URL_MAP[animal];
  if (!animalType) notFound();

  const q = qParam?.trim() ?? '';
  const supabase = createAdminClient();

  let query = supabase
    .from('breeds')
    .select('name, slug, content, photo_url')
    .eq('animal', animalType)
    .eq('status', 'published')
    .not('content', 'is', null)
    .order('name', { ascending: true });

  if (q) query = query.ilike('name', `%${q}%`);

  const [{ data: breeds }, { count: total }] = await Promise.all([
    query,
    supabase
      .from('breeds')
      .select('*', { count: 'exact', head: true })
      .eq('animal', animalType)
      .eq('status', 'published')
      .not('content', 'is', null),
  ]);

  const totalCount = total ?? 0;

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-6 space-y-5">

      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          {ANIMAL_LABEL[animalType]}
        </h1>
        <p className="text-gray-500 text-sm">Fiches races : caractère, santé, entretien</p>
      </div>

      {/* Onglets filtres */}
      <div className="flex flex-wrap gap-2">
        <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-orange-500 border border-orange-500 text-white">
          Toutes
        </span>
        {[
          { href: `/races/${animal}/appartement`, label: 'Appartement' },
          { href: `/races/${animal}/enfants`,     label: 'Enfants' },
          { href: `/races/${animal}/debutants`,   label: 'Débutants' },
          { href: `/races/${animal}/seniors`,     label: 'Seniors' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors">
            {label}
          </Link>
        ))}
      </div>

      <Suspense>
        <BreedsSearchBar defaultValue={q} />
      </Suspense>

      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Fiches races</p>
          <p className="text-white font-bold text-lg md:text-xl">{ANIMAL_LABEL[animalType]}</p>
        </div>
        <p className="text-white/60 text-sm">
          {totalCount > 0 ? `${totalCount} race${totalCount > 1 ? 's' : ''}` : 'En cours…'}
        </p>
      </div>

      <Link href="/races" className="inline-block text-sm text-orange-600 hover:underline">
        &larr; Toutes les catégories
      </Link>

      {totalCount === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">{ANIMAL_EMOJI[animalType]}</p>
          <p className="text-gray-600 font-medium">Fiches en cours de génération</p>
          <p className="text-gray-400 text-sm mt-1">Revenez bientôt !</p>
        </div>
      ) : (
        <BreedsList
          breeds={breeds ?? []}
          animalUrl={ANIMAL_URL[animalType]}
          search={q || undefined}
          view={view === 'list' ? 'list' : 'grid'}
        />
      )}

    </div>
  );
}
