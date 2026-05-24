import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CheckCircle2, XCircle, Activity, MapPin, Scale, Heart } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { ANIMAL_URL_MAP, ANIMAL_LABEL, ANIMAL_EMOJI, ANIMAL_GRADIENT, ANIMAL_URL, type Breed } from '@/lib/breeds-list';
import type { Article } from '@/types';

export const revalidate = 3600;

interface Props { params: Promise<{ animal: string; slug: string }> }

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('breeds')
      .select('animal, slug')
      .eq('status', 'published')
      .not('content', 'is', null);
    return (data ?? []).map(r => ({
      animal: ANIMAL_URL[r.animal as keyof typeof ANIMAL_URL] ?? r.animal,
      slug: r.slug,
    }));
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { animal, slug } = await params;
  const animalType = ANIMAL_URL_MAP[animal];
  if (!animalType) return {};
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('breeds')
    .select('name, content')
    .eq('animal', animalType)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!data) return {};
  return {
    title: `${data.name} - Caractère, Santé, Entretien | Mes Poilus`,
    description: data.content?.excerpt ?? `Tout sur le ${data.name} : caractère, santé, entretien et conseils.`,
  };
}

const ACTIVITE_COLORS: Record<string, string> = {
  'faible':     'bg-green-100 text-green-700',
  'modéré':     'bg-yellow-100 text-yellow-700',
  'élevé':      'bg-orange-100 text-orange-600',
  'très élevé': 'bg-red-100 text-red-700',
};

export default async function BreedPage({ params }: Props) {
  const { animal, slug } = await params;
  const animalType = ANIMAL_URL_MAP[animal];
  if (!animalType) notFound();

  const supabase = createAdminClient();
  const { data: breed } = (await (supabase
    .from('breeds')
    .select('*')
    .eq('animal', animalType)
    .eq('slug', slug)
    .eq('status', 'published')
    .single() as unknown as Promise<{ data: Breed | null }>));

  const photo = breed?.photo_url ?? null;

  if (!breed || !breed.content) notFound();

  const category = ANIMAL_URL[animalType];

  type AdoptionPreview = { id: string; breed: string | null; age: string | null; gender: string; region: string; photo_urls: string[] };
  type ProductPreview  = { catalog_id: string; name: string; image_url: string | null; price: number; currency: string; merchant_name: string; affiliate_url: string };
  type ArticlePreview  = Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'image_url' | 'reading_time'>;

  let adoptionPosts: AdoptionPreview[] = [];
  let products: ProductPreview[] = [];
  let articles: ArticlePreview[] = [];

  try {
    const [{ data: a }, { data: p }, { data: ar }] = await Promise.all([
      supabase
        .from('adoption_posts')
        .select('id, breed, age, gender, region, photo_urls')
        .eq('status', 'approved')
        .eq('animal_type', animalType)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('catalog_best_offer')
        .select('catalog_id, name, image_url, price, currency, merchant_name, affiliate_url')
        .or(`category.eq.${category},categories.cs.{${category}}`)
        .order('price', { ascending: true })
        .limit(4),
      supabase
        .from('articles')
        .select('id, title, slug, excerpt, image_url, reading_time')
        .eq('status', 'published')
        .eq('category', category)
        .order('published_at', { ascending: false })
        .limit(3),
    ]);
    adoptionPosts = (a ?? []) as AdoptionPreview[];
    products      = (p ?? []) as ProductPreview[];
    articles      = (ar ?? []) as ArticlePreview[];
  } catch { /* fail silently - le contenu principal reste visible */ }

  const c = breed.content;
  const gradient = ANIMAL_GRADIENT[animalType];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';
  const breedUrl = `${appUrl}/races/${animal}/${slug}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: appUrl },
      { '@type': 'ListItem', position: 2, name: 'Races', item: `${appUrl}/races` },
      { '@type': 'ListItem', position: 3, name: ANIMAL_LABEL[animalType], item: `${appUrl}/races/${animal}` },
      { '@type': 'ListItem', position: 4, name: breed.name, item: breedUrl },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${breed.name} - Caractère, Santé, Entretien`,
    description: c.excerpt ?? `Tout sur le ${breed.name} : caractère, santé, entretien et conseils.`,
    ...(photo ? { image: { '@type': 'ImageObject', url: photo, alt: `${breed.name} - ${ANIMAL_LABEL[animalType]}` } } : {}),
    datePublished: breed.generated_at ?? undefined,
    dateModified: breed.generated_at ?? undefined,
    author: { '@type': 'Organization', name: 'Mes Poilus', url: appUrl },
    publisher: { '@type': 'Organization', name: 'Mes Poilus', url: appUrl, logo: { '@type': 'ImageObject', url: `${appUrl}/favicon.ico` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': breedUrl },
    inLanguage: 'fr',
    url: breedUrl,
  };

  const CONVIENT_LABELS: Record<string, string> = {
    appartement: 'Appartement',
    jardin:      'Jardin',
    enfants:     'Enfants',
    debutants:   'Débutants',
    seniors:     'Seniors',
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-8 py-6 space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Fil d'ariane + titre */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
          <Link href="/races" className="hover:text-orange-600 transition-colors">Races</Link>
          <span>/</span>
          <Link href={`/races/${animal}`} className="hover:text-orange-600 transition-colors">{ANIMAL_LABEL[animalType]}</Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{breed.name}</h1>
        {c.excerpt && <p className="text-gray-500 text-sm mt-1">{c.excerpt}</p>}
      </div>

      {/* Bannière orange */}
      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Fiche race</p>
          <p className="text-white font-bold text-lg md:text-xl">{breed.name}</p>
        </div>
        <p className="text-white/60 text-sm">{ANIMAL_LABEL[animalType]}</p>
      </div>

      <Link href={`/races/${animal}`} className="inline-block text-sm text-orange-600 hover:underline">
        &larr; {ANIMAL_LABEL[animalType]}
      </Link>

      <div className="max-w-6xl mx-auto space-y-4">

        {/* Photo centrée */}
        <div className="max-w-xs mx-auto relative aspect-[3/4] rounded-2xl overflow-hidden">
          {photo ? (
            <Image
              src={photo}
              alt={`${breed.name} - ${ANIMAL_LABEL[animalType]}`}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-8xl">{ANIMAL_EMOJI[animalType]}</span>
            </div>
          )}
        </div>

        {/* Stats clés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MapPin,   label: 'Origine',          value: c.origine },
            { icon: Scale,    label: 'Poids',             value: c.poids },
            { icon: Heart,    label: 'Espérance de vie',  value: c.esperance_vie },
            { icon: Activity, label: 'Taille',            value: c.taille },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <Icon size={18} strokeWidth={1.5} className="text-orange-500 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="font-semibold text-gray-900 text-base capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Caractère + Niveau d'activité */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          {c.caractere && c.caractere.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Caractère</h2>
              <div className="flex flex-wrap gap-2">
                {c.caractere.map((trait: string) => (
                  <span key={trait} className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          {c.niveau_activite && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Niveau d&apos;activité :</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${ACTIVITE_COLORS[c.niveau_activite] ?? 'bg-gray-100 text-gray-700'}`}>
                {c.niveau_activite}
              </span>
            </div>
          )}
        </div>

        {/* Convient pour */}
        {c.convient_pour && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Convient pour</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(c.convient_pour).map(([key, value]) => (
                <div key={key} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${value ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                  {value
                    ? <CheckCircle2 size={16} strokeWidth={1.5} className="text-green-600 shrink-0" />
                    : <XCircle     size={16} strokeWidth={1.5} className="text-red-400 shrink-0" />}
                  <span className={`text-sm font-medium ${value ? 'text-green-800' : 'text-red-600'}`}>
                    {CONVIENT_LABELS[key] ?? key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {c.description && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">À propos du {breed.name}</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: c.description }}
            />
          </div>
        )}

        {/* Soins */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Entretien',    text: c.entretien    },
            { title: 'Alimentation', text: c.alimentation },
            { title: 'Santé',        text: c.sante        },
          ].filter(s => s.text).map(({ title, text }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Les informations sont des moyennes indicatives. Chaque animal est unique.
        </p>

        {/* Annonces d'adoption */}
        {adoptionPosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{ANIMAL_LABEL[animalType]} à adopter</h2>
              <Link href={`/adoption?animal=${animalType}`} className="text-sm text-orange-600 hover:underline">
                Voir tout &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {adoptionPosts.map(post => (
                <Link
                  key={post.id}
                  href={`/adoption?animal=${animalType}`}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="relative h-32">
                    {post.photo_urls?.[0] ? (
                      <Image
                        src={post.photo_urls[0]}
                        alt={post.breed ?? ANIMAL_LABEL[animalType]}
                        fill unoptimized
                        className="object-cover"
                        sizes="300px"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <span className="text-4xl">{ANIMAL_EMOJI[animalType]}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm">{post.breed ?? ANIMAL_LABEL[animalType]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[
                        post.age,
                        post.gender === 'male' ? 'Mâle' : post.gender === 'female' ? 'Femelle' : null,
                        post.region,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Produits recommandés */}
        {products.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Produits pour {ANIMAL_LABEL[animalType].toLowerCase()}</h2>
              <Link href={`/boutique?category=${category}`} className="text-sm text-orange-600 hover:underline">
                Voir tout &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {products.map(p => (
                <a
                  key={p.catalog_id}
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
                >
                  <div className="relative h-28 bg-gray-50">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill unoptimized
                        className="object-contain p-2"
                        sizes="200px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl">{ANIMAL_EMOJI[animalType]}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <p className="text-xs text-gray-700 font-medium line-clamp-2 flex-1">{p.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{p.price.toFixed(2)} {p.currency || '€'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.merchant_name}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Articles & conseils */}
        {articles.length > 0 && (
          <div className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Articles & conseils</h2>
              <Link href={`/blog/${category}`} className="text-sm text-orange-600 hover:underline">
                Voir tout &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {articles.map(a => (
                <Link
                  key={a.id}
                  href={`/blog/${a.slug}`}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
                >
                  <div className="relative h-32">
                    {a.image_url ? (
                      <Image
                        src={a.image_url}
                        alt={a.title}
                        fill unoptimized
                        className="object-cover"
                        sizes="300px"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <span className="text-4xl">{ANIMAL_EMOJI[animalType]}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">{a.title}</p>
                    {a.excerpt && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.excerpt}</p>}
                    {a.reading_time && (
                      <p className="text-[10px] text-orange-500 mt-1.5">{a.reading_time} min de lecture</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
