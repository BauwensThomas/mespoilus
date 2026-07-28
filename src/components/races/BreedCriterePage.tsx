import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_URL_MAP, ANIMAL_LABEL, ANIMAL_URL, type Breed } from '@/lib/breeds-list';
import BreedsList from '@/components/races/BreedsList';
import BreedsSearchBar from '@/components/races/BreedsSearchBar';

const CRITERE_EXPLAINER: Record<Critere, string> = {
  appartement: `Un animal adapté à la vie en appartement se distingue par un niveau d'énergie maîtrisable, une taille compatible avec l'espace disponible, et une tendance à rester calme en intérieur. Le niveau d'activité et le tempérament comptent souvent plus que le gabarit brut.`,
  debutants: `Pour un premier animal, la facilité d'éducation et la tolérance aux erreurs de débutant priment sur tout le reste. Les races les plus dociles et prévisibles limitent le risque de découragement.`,
  enfants: `Le tempérament doux, la patience et la robustesse physique (capacité à supporter les manipulations parfois brusques des enfants) sont les critères clés pour une bonne cohabitation.`,
  seniors: `Un compagnon pour senior doit demander peu d'exercice intensif, être facile à entretenir au quotidien, et offrir une présence rassurante sans excès d'énergie.`,
};

function getFaqItems(critere: Critere, animalLabelLower: string): { q: string; a: string }[] {
  const faqs: Record<Critere, { q: string; a: string }[]> = {
    appartement: [
      { q: `Un ${animalLabelLower} peut-il vraiment vivre en appartement sans souffrir ?`, a: `Oui, à condition de choisir une race avec un niveau d'activité faible à modéré et de compenser l'absence de jardin par des sorties régulières ou des jeux stimulants en intérieur.` },
      { q: `Faut-il un jardin pour un ${animalLabelLower} calme ?`, a: `Non, un jardin n'est pas indispensable pour les races calmes : ce qui compte le plus est le temps consacré à la stimulation physique et mentale au quotidien.` },
      { q: `Quelle taille privilégier en appartement ?`, a: `Les petites et moyennes tailles sont généralement plus faciles à loger, mais certaines grandes races calmes s'adaptent très bien tant que l'espace de repos est suffisant.` },
    ],
    debutants: [
      { q: `Quel est le principal critère pour un premier ${animalLabelLower} ?`, a: `La facilité d'éducation et un tempérament prévisible : cela évite les erreurs de débutant les plus pénalisantes.` },
      { q: `Un ${animalLabelLower} difficile peut-il convenir à un débutant motivé ?`, a: `C'est possible mais déconseillé : mieux vaut gagner en expérience avec une race docile avant de se tourner vers un profil plus exigeant.` },
      { q: `Combien de temps prévoir pour l'adaptation ?`, a: `Comptez plusieurs semaines de routine régulière avant que les habitudes (alimentation, sorties, repos) se stabilisent des deux côtés.` },
    ],
    enfants: [
      { q: `Comment savoir si un ${animalLabelLower} est adapté aux enfants ?`, a: `Les fiches de cette page se basent sur le tempérament (patience, tolérance) et la robustesse physique de chaque race, deux facteurs clés pour la cohabitation.` },
      { q: `Faut-il toujours surveiller les interactions ?`, a: `Oui, quel que soit le tempérament de l'animal : la supervision reste indispensable, surtout avec de jeunes enfants.` },
      { q: `Le gabarit de l'animal compte-t-il ?`, a: `Il compte moins que le caractère, mais un animal trop fragile ou au contraire trop imposant demande une vigilance accrue.` },
    ],
    seniors: [
      { q: `Quel niveau d'activité privilégier pour un senior ?`, a: `Un niveau faible à modéré est idéal : assez de dynamisme pour de bonnes routines, sans excès d'énergie difficile à suivre au quotidien.` },
      { q: `Un animal calme demande-t-il moins d'entretien ?`, a: `Pas forcément pour le toilettage, mais généralement moins de dépense physique quotidienne à organiser.` },
      { q: `Ces races conviennent-elles aussi aux personnes à mobilité réduite ?`, a: `Beaucoup, oui : privilégiez les profils au niveau d'activité faible et à l'entretien simple pour limiter les contraintes physiques.` },
    ],
  };
  return faqs[critere];
}

interface BreedStats {
  total: number;
  tailleDominante: string | null;
  activiteDominante: string | null;
  topTraits: string[];
}

function computeStats(breeds: Breed[]): BreedStats | null {
  if (breeds.length === 0) return null;
  const tailleCounts: Record<string, number> = {};
  const activiteCounts: Record<string, number> = {};
  const caractereCounts: Record<string, number> = {};

  for (const b of breeds) {
    const c = b.content;
    if (!c) continue;
    if (c.taille) tailleCounts[c.taille] = (tailleCounts[c.taille] ?? 0) + 1;
    if (c.niveau_activite) activiteCounts[c.niveau_activite] = (activiteCounts[c.niveau_activite] ?? 0) + 1;
    for (const trait of c.caractere ?? []) {
      // la casse des traits generes par IA est incoherente ("Affectueux" / "affectueux") - on normalise pour ne pas les compter comme 2 traits distincts
      const key = trait.trim().toLowerCase();
      if (key) caractereCounts[key] = (caractereCounts[key] ?? 0) + 1;
    }
  }

  const top = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const topTraits = Object.entries(caractereCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  return {
    total: breeds.length,
    tailleDominante: top(tailleCounts),
    activiteDominante: top(activiteCounts),
    topTraits,
  };
}

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

  const stats = computeStats(breeds);
  const faqItems = getFaqItems(critere, animalLabelLower);
  const topPicks = breeds.slice(0, 3);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const statsIntro = stats
    ? `${stats.total} race${stats.total > 1 ? 's' : ''} de ${animalLabel.toLowerCase()} correspond${stats.total > 1 ? 'ent' : ''} à ce critère.`
    : '';

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-6 space-y-5">
      <div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {breeds.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        )}
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
        <div className="space-y-6">
          {stats && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <p className="text-sm text-gray-700">{statsIntro}</p>
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                <div className="bg-white rounded-xl border border-gray-200 p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Taille</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{stats.tailleDominante ?? '—'}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Activité</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{stats.activiteDominante ?? '—'}</p>
                </div>
              </div>
              {stats.topTraits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {stats.topTraits.map(t => (
                    <span key={t} className="text-[11px] bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full capitalize">{t}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-200">{CRITERE_EXPLAINER[critere]}</p>
            </div>
          )}

          {topPicks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">À la une pour {label.toLowerCase()}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topPicks.map(b => (
                  <Link
                    key={b.slug}
                    href={`/races/${params.animal}/${b.slug}`}
                    className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <p className="font-bold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {b.content?.taille} · activité {b.content?.niveau_activite}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Toutes les races compatibles</p>
            <BreedsList breeds={breeds} animalUrl={animalUrl} view={searchParams?.view === 'list' ? 'list' : 'grid'} />
          </div>

          {faqItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Questions fréquentes</p>
              {faqItems.map(f => (
                <details key={f.q} className="group bg-orange-50 border border-orange-100 rounded-2xl p-4 open:bg-white open:shadow-sm">
                  <summary className="text-sm font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-orange-500 group-open:rotate-45 transition-transform shrink-0">+</span>
                  </summary>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
