import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_LABEL, ANIMAL_URL, ANIMAL_EMOJI, ANIMAL_GRADIENT, type AnimalType } from '@/lib/breeds-list';
import DirectionalTransition from '@/components/ui/DirectionalTransition';
import ClientWrapper from '@/components/animations/ClientWrapper';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Fiches races animaux de compagnie',
  alternates: { canonical: 'https://www.mespoilus.com/races' },
  description: 'Découvrez nos fiches races détaillées : chiens, chats, oiseaux, rongeurs et reptiles. Caractère, santé, entretien - tout ce qu\'il faut savoir avant d\'adopter.',
};

const ANIMALS: AnimalType[] = ['chien', 'chat', 'oiseau', 'rongeur', 'reptile'];

const ANIMAL_TYPE_MAP: Record<string, AnimalType> = {
  chien: 'chien', chiens: 'chien',
  chat: 'chat', chats: 'chat',
  oiseau: 'oiseau', oiseaux: 'oiseau',
  rongeur: 'rongeur', rongeurs: 'rongeur',
  reptile: 'reptile', reptiles: 'reptile',
};

async function getPhotos(): Promise<Record<AnimalType, string | null>> {
  const result: Record<AnimalType, string | null> = { chien: null, chat: null, oiseau: null, rongeur: null, reptile: null };
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('hero_photos')
      .select('url, animal_type')
      .eq('active', true)
      .not('animal_type', 'is', null);
    if (!data) return result;
    const byType: Record<AnimalType, string[]> = { chien: [], chat: [], oiseau: [], rongeur: [], reptile: [] };
    for (const row of data) {
      const type = ANIMAL_TYPE_MAP[row.animal_type];
      if (type) byType[type].push(row.url);
    }
    for (const animal of ANIMALS) {
      const urls = byType[animal];
      if (urls.length > 0) result[animal] = urls[Math.floor(Math.random() * urls.length)];
    }
    // Fallback breeds pour les animaux sans photo hero
    await Promise.all(ANIMALS.map(async animal => {
      if (result[animal]) return;
      const { data: breeds } = await supabase
        .from('breeds').select('photo_url')
        .eq('animal', animal).eq('status', 'published').not('photo_url', 'is', null).limit(30);
      if (breeds && breeds.length > 0) {
        const pick = breeds[Math.floor(Math.random() * breeds.length)] as { photo_url: string };
        result[animal] = pick.photo_url;
      }
    }));
  } catch { /* fallback null */ }
  return result;
}

async function getCounts(): Promise<Record<AnimalType, number>> {
  const result: Record<AnimalType, number> = { chien: 0, chat: 0, oiseau: 0, rongeur: 0, reptile: 0 };
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('breeds').select('animal').eq('status', 'published').not('content', 'is', null);
    for (const row of data ?? []) {
      const a = row.animal as AnimalType;
      if (a in result) result[a]++;
    }
  } catch { /* fallback 0 */ }
  return result;
}

export default async function RacesPage() {
  const [photos, counts] = await Promise.all([getPhotos(), getCounts()]);

  return (
    <DirectionalTransition>
    <div className="px-6 md:px-8 py-6 space-y-5">

      {/* Header avec animation */}
      <div className="fade-up">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Fiches races</h1>
        <p className="text-gray-500 text-sm">Caractère, santé, entretien : tout ce qu&apos;il faut savoir sur chaque race</p>
      </div>

      {/* Banner avec animation */}
      <div className="fade-up reveal-color">
        <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
          <div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Choisissez une catégorie</p>
            <p className="text-white font-bold text-lg md:text-xl">Toutes les races</p>
          </div>
          <p className="text-white/60 text-sm">{ANIMALS.length} catégories</p>
        </div>
      </div>

      {/* Grille des races avec stagger */}
      <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-5 gap-3 stagger-container">
        {ANIMALS.map((animal, idx) => {
          const photo = photos[animal];
          const count = counts[animal];
          const gradient = ANIMAL_GRADIENT[animal];
          return (
            <Link
              key={animal}
              href={`/races/${ANIMAL_URL[animal]}`}
              className={`stagger-child group relative overflow-hidden rounded-2xl border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 aspect-[2/3]`}
              style={{ transitionDelay: `${idx * 0.05}s` }}
            >
              {photo ? (
                <Image
                  src={photo}
                  alt={ANIMAL_LABEL[animal]}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  unoptimized
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{ANIMAL_EMOJI[animal]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-bold text-white text-sm leading-tight">{ANIMAL_LABEL[animal]}</p>
                <p className="text-white/70 text-xs mt-0.5">
                  {count > 0 ? `${count} race${count > 1 ? 's' : ''}` : 'Bientôt'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer avec animation */}
      <p className="text-xs text-gray-500 text-center fade-up">
        Nouvelles fiches ajoutées régulièrement. Les informations sont des moyennes indicatives.
      </p>

      {/* Section descriptive */}
      <section className="max-w-4xl mx-auto mt-8 pb-10 border-t border-gray-100 pt-8 fade-up text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-4">A quoi servent les fiches races ?</h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            Chaque fiche race de Mes Poilus détaille le caractère, le tempérament, les besoins en exercice, les prédispositions santé, les soins d&apos;entretien et les conseils d&apos;alimentation spécifiques à une race ou une espèce. L&apos;objectif est d&apos;aider les futurs propriétaires à choisir un animal adapté à leur mode de vie, et les propriétaires actuels à mieux comprendre leur compagnon.
          </p>
          <p>
            Nos fiches couvrent cinq catégories : <strong>chiens</strong> (races de toutes tailles, du Chihuahua au Berger Allemand), <strong>chats</strong> (races à poil court, à poil long, hypoallergéniques), <strong>oiseaux</strong> (perruches, perroquets, canaris, pinsons), <strong>rongeurs</strong> (lapins, cochons d&apos;Inde, hamsters, rats, chinchillas) et <strong>reptiles</strong> (geckos, pogonas, serpents des blés, tortues).
          </p>
          <p>
            Avant d&apos;adopter, comparez plusieurs fiches races pour évaluer les exigences réelles de chaque animal en termes de temps, d&apos;espace et de budget. Certaines races de chiens demandent deux heures d&apos;exercice par jour et mal tolèrent la solitude. Certains perroquets vivent 50 ans et nécessitent une stimulation intellectuelle quotidienne. Ces réalités doivent être connues avant l&apos;adoption pour éviter les abandons.
          </p>
          <p>
            Nos fiches s&apos;appuient sur des sources vétérinaires et des éleveurs reconnus. Les informations fournies (espérance de vie, taille adulte, niveau d&apos;entretien) sont des moyennes indicatives : chaque individu est unique, et un suivi régulier chez le vétérinaire reste indispensable.
          </p>
        </div>
      </section>

      <ClientWrapper />
    </div>
    </DirectionalTransition>
  );
}