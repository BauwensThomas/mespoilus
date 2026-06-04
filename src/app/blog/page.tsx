import { createAdminClient } from '@/lib/supabase/server';
import { normalizeSearch } from '@/lib/search';
import BlogPostsGrid from '@/components/blog/BlogPostsGrid';
import { Article } from '@/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/ui/AdBanner';
import BlogSearchBar from '@/components/blog/BlogSearchBar';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, Globe } from 'lucide-react';
import DirectionalTransition from '@/components/ui/DirectionalTransition';

const CATEGORY_SLUGS = ['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles', 'general'];

const BLOG_URL = '/blog';

export const metadata: Metadata = {
  title: 'Blog - Conseils & guides animaux de compagnie',
  description: 'Articles, guides et conseils pratiques sur les animaux de compagnie.',
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

export const revalidate = 3600;

async function getArticles(category?: string, search?: string) {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (category) query = query.or(`category.eq.${category},categories.cs.{${category}}`);
    if (search) query = query.ilike('title_search', `%${normalizeSearch(search)}%`);

    const { data } = await query.limit(24);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: PawPrint, href: '/blog' },
  { id: 'chiens',   label: 'Chiens',   icon: Dog,      href: '/blog/chiens' },
  { id: 'chats',    label: 'Chats',    icon: Cat,      href: '/blog/chats' },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird,     href: '/blog/oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse,    href: '/blog/rongeurs' },
  { id: 'reptiles', label: 'Reptiles', icon: Zap,      href: '/blog/reptiles' },
  { id: 'general',  label: 'Général',  icon: Globe,    href: '/blog/general' },
];

interface Props {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeCategory = sp.category && sp.category !== 'all' && CATEGORY_SLUGS.includes(sp.category)
    ? sp.category
    : undefined;
  const search = sp.q?.trim();
  const activeCat = CATEGORIES.find((c) => c.id === (activeCategory ?? 'all'));
  const articles = await getArticles(activeCategory, search);

  return (
    <DirectionalTransition>
    <div className="min-h-screen px-6 md:px-8 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Blog</h1>
        <p className="text-sm text-gray-500">Conseils, guides et actualités sur les animaux de compagnie</p>
      </div>

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map(({ id, label, icon: IconComponent, href }) => {
          const isActive = (id === 'all' && !activeCategory) || id === activeCategory;
          return (
            <Link
              key={id}
              href={href}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isActive
                  ? 'bg-orange-600 text-white border-orange-600 focus:ring-orange-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:text-orange-600 hover:shadow-md focus:ring-orange-300'
              }`}
            >
              <IconComponent size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Recherche */}
      <BlogSearchBar defaultValue={search ?? ''} />

      {/* Bannière */}
      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Catégorie</p>
          <p className="text-white font-bold text-lg md:text-xl capitalize">{activeCat?.label ?? 'Tous'}</p>
        </div>
        <p className="text-white/60 text-sm">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
          {search ? ` · "${search}"` : ''}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 bg-orange-50 rounded-3xl border border-orange-100">
          <p className="text-gray-600 font-medium text-lg">Les premiers articles arrivent bientôt !</p>
        </div>
      ) : (
        <BlogPostsGrid
          articles={articles}
          activeCategory={activeCategory}
          search={search}
          label={activeCategory ? `Articles · ${activeCat?.label}` : 'Derniers articles'}
        />
      )}

      <AdBanner slot="1266534148" variant="in-article" className="mt-6" />
    </div>
    </DirectionalTransition>
  );
}
