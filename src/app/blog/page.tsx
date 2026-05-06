import { createAdminClient } from '@/lib/supabase/server';
import BlogCard from '@/components/blog/BlogCard';
import { Article } from '@/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getHeroPhotos, getBannerPhotos, CATEGORY_QUERIES } from '@/lib/unsplash';
import AdBanner from '@/components/ui/AdBanner';

const BLOG_URL = '/blog';

export const metadata: Metadata = {
  title: 'Blog - Conseils & guides animaux de compagnie',
  description: 'Articles, guides et conseils sur les animaux de compagnie, rédigés par Marie notre IA rédactrice.',
  robots: { index: true, follow: true },
  alternates: { canonical: BLOG_URL },
  openGraph: {
    title: 'Blog Mes Poilus - Conseils & guides animaux',
    description: 'Articles, guides et conseils sur les animaux de compagnie.',
    type: 'website',
    url: BLOG_URL,
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary',
    title: 'Blog Mes Poilus - Conseils & guides animaux',
    description: 'Articles, guides et conseils sur les animaux de compagnie.',
  },
};

export const revalidate = 60;

async function getArticles(category?: string) {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (category) query = query.contains('categories', [category]);

    const { data } = await query.limit(24);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: '🐾' },
  { id: 'chiens',   label: 'Chiens',   icon: '🐕' },
  { id: 'chats',    label: 'Chats',    icon: '🐈' },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: '🦜' },
  { id: 'rongeurs', label: 'Rongeurs', icon: '🐹' },
  { id: 'reptiles', label: 'Reptiles', icon: '🦎' },
  { id: 'general',  label: 'Général',  icon: '📝' },
];

interface Props {
  searchParams: { category?: string };
}

export default async function BlogPage({ searchParams }: Props) {
  const activeCategory = searchParams.category && searchParams.category !== 'all'
    ? searchParams.category
    : undefined;

  const activeCat = CATEGORIES.find((c) => c.id === (activeCategory ?? 'all'));
  const bannerQuery = activeCategory && CATEGORY_QUERIES[activeCategory];

  const [articles, allPhotos] = await Promise.all([
    getArticles(activeCategory),
    bannerQuery ? getBannerPhotos(bannerQuery) : getHeroPhotos(),
  ]);
  const [featured, ...rest] = articles;

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Blog Mes Poilus</h1>
        <p className="text-gray-400 text-sm mt-1">
          Conseils, guides et actualités sur les animaux de compagnie
        </p>
      </div>

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ id, label, icon }) => {
          const isActive = (id === 'all' && !activeCategory) || id === activeCategory;
          return (
            <Link
              key={id}
              href={id === 'all' ? '/blog' : `/blog?category=${id}`}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-black border-amber-500 font-semibold'
                  : 'bg-transparent text-gray-400 border-[#333] hover:border-amber-500/50 hover:text-amber-400'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bannière */}
      <div className="relative h-28 rounded-2xl overflow-hidden bg-[#111]">

        {/* Photo plein-format en fond */}
        {allPhotos[0] && (
          <Image src={allPhotos[0].url} alt={allPhotos[0].alt} fill className="object-cover object-center" />
        )}

        {/* Dégradé amber recouvrant 65% à gauche */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 from-30% via-amber-500/80 via-55% to-transparent pointer-events-none" />

        {/* Texte */}
        <div className="absolute inset-0 flex items-center px-6 z-10">
          <div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium">Catégorie</p>
            <p className="text-white font-bold text-xl capitalize">{activeCat?.label}</p>
            <p className="text-white/60 text-xs mt-0.5">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-gray-500">Les premiers articles arrivent bientôt !</p>
        </div>
      ) : (
        <>
          {/* Article vedette */}
          {featured && !activeCategory && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-amber-400 font-medium uppercase tracking-wide">À la une</span>
              </div>
              <BlogCard article={featured} featured />
            </div>
          )}

          {/* Grille articles */}
          <div>
            {rest.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-white mb-4">
                  {activeCategory ? `Articles · ${activeCat?.label}` : 'Derniers articles'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(featured && !activeCategory ? rest : articles).map((article) => (
                    <BlogCard key={article.id} article={article} />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <AdBanner slot="1266534148" variant="in-article" className="mt-6" />
    </div>
  );
}
