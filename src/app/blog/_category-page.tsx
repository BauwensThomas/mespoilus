import { createAdminClient } from '@/lib/supabase/server';
import { normalizeSearch } from '@/lib/search';
import BlogPostsGrid from '@/components/blog/BlogPostsGrid';
import { Article } from '@/types';
import Link from 'next/link';
import AdBanner from '@/components/ui/AdBanner';
import BlogSearchBar from '@/components/blog/BlogSearchBar';
import { Dog, Cat, Bird, Mouse, Zap, PawPrint, Globe } from 'lucide-react';

export const CATEGORY_META: Record<string, {
  label: string;
  title: string; description: string; intro: string;
}> = {
  chiens: {
    label: 'Chiens',
    title: 'Conseils chiens : alimentation, éducation, santé',
    description: 'Tout ce qu\'il faut savoir pour bien s\'occuper de son chien : alimentation, éducation, races, comportement et santé. Guides pratiques en français.',
    intro: 'Guides pratiques sur l\'alimentation, l\'éducation, la santé et les soins pour votre chien.',
  },
  chats: {
    label: 'Chats',
    title: 'Conseils chats : comportement, soins et alimentation',
    description: 'Mieux comprendre votre chat : comportement, alimentation, soins, races et bien-être. Guides pratiques pour propriétaires de chats en français.',
    intro: 'Guides sur l\'alimentation, le comportement, la santé et le bien-être de votre félin.',
  },
  oiseaux: {
    label: 'Oiseaux',
    title: 'Conseils oiseaux de compagnie : soins, alimentation, habitat',
    description: 'Perruche, perroquet, canari ou pie grièche : apprenez à bien soigner vos oiseaux de compagnie. Alimentation, cage, apprivoisement et santé.',
    intro: 'Guides pour offrir à vos oiseaux un environnement épanouissant et des soins adaptés.',
  },
  rongeurs: {
    label: 'Rongeurs',
    title: 'Conseils rongeurs : lapin, hamster, cobaye et plus',
    description: 'Lapin, hamster, cochon d\'Inde, rat ou gerbille : tout sur l\'alimentation, le logement et la santé de vos petits compagnons.',
    intro: 'Guides pour lapins, cochons d\'Inde, hamsters et autres petits compagnons.',
  },
  reptiles: {
    label: 'Reptiles',
    title: 'Conseils reptiles : tortue, lézard, serpent et terrarium',
    description: 'Tortues, lézards, serpents, geckos : guides sur le terrarium, l\'alimentation et les soins pour bien s\'occuper de vos reptiles.',
    intro: 'Conseils sur l\'habitat, l\'alimentation et les soins pour vos reptiles.',
  },
  general: {
    label: 'Général',
    title: 'Conseils généraux pour tous les animaux',
    description: 'Actualités, conseils et guides généraux pour tous les propriétaires d\'animaux de compagnie.',
    intro: 'Actualités, bons plans et conseils pour tous les propriétaires d\'animaux.',
  },
};

const CATEGORIES = [
  { id: 'all',      label: 'Tous',     icon: PawPrint, href: '/blog' },
  { id: 'chiens',   label: 'Chiens',   icon: Dog,      href: '/blog/chiens' },
  { id: 'chats',    label: 'Chats',    icon: Cat,      href: '/blog/chats' },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird,     href: '/blog/oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse,    href: '/blog/rongeurs' },
  { id: 'reptiles', label: 'Reptiles', icon: Zap,      href: '/blog/reptiles' },
  { id: 'general',  label: 'Général',  icon: Globe,    href: '/blog/general' },
];

async function getArticles(category: string, search?: string): Promise<Article[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(24);
    if (search) query = query.ilike('title_search', `%${normalizeSearch(search)}%`);
    const { data } = await query;
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

export async function CategoryPageContent({ category, search }: { category: string; search?: string }) {
  const meta = CATEGORY_META[category];
  const articles = await getArticles(category, search);

  return (
    <div className="min-h-screen px-6 md:px-8 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{meta.label}</h1>
        <p className="text-sm text-gray-500 truncate">{meta.intro}</p>
      </div>

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map(({ id, label, icon: IconComponent, href }) => (
          <Link
            key={id}
            href={href}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              id === category
                ? 'bg-orange-600 text-white border-orange-600 focus:ring-orange-300'
                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:text-orange-600 hover:shadow-md focus:ring-orange-300'
            }`}
          >
            <IconComponent size={18} strokeWidth={1.5} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Recherche */}
      <BlogSearchBar defaultValue={search ?? ''} basePath={`/blog/${category}`} />

      {/* Bannière */}
      <div className="h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 to-gray-900 shadow flex items-center px-6 md:px-8 justify-between">
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Catégorie</p>
          <p className="text-white font-bold text-lg md:text-xl capitalize">{meta.label}</p>
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
          activeCategory={category}
          search={search}
          label={`Articles · ${meta.label}`}
          showFeatured={!search}
        />
      )}

      <AdBanner slot="1266534148" variant="in-article" className="mt-6" />
    </div>
  );
}
