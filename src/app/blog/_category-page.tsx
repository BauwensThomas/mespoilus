import { createAdminClient } from '@/lib/supabase/server';
import BlogCard from '@/components/blog/BlogCard';
import { Article } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { getBannerPhotos, CATEGORY_QUERIES } from '@/lib/unsplash';
import AdBanner from '@/components/ui/AdBanner';

export const CATEGORY_META: Record<string, {
  label: string; icon: string;
  title: string; description: string; intro: string;
}> = {
  chiens: {
    label: 'Chiens', icon: '🐕',
    title: 'Conseils et guides pour chiens — Mes Poilus',
    description: 'Guides pratiques, conseils santé et bien-être pour votre chien. Alimentation, éducation, soins vétérinaires pour les propriétaires de chiens francophones.',
    intro: 'Votre chien mérite le meilleur. Retrouvez nos guides pratiques sur l\'alimentation, l\'éducation, la santé et les soins pour accompagner votre compagnon à quatre pattes au quotidien.',
  },
  chats: {
    label: 'Chats', icon: '🐈',
    title: 'Conseils et guides pour chats — Mes Poilus',
    description: 'Tout savoir sur les soins, l\'alimentation et le comportement de votre chat. Guides pratiques pour les propriétaires de chats francophones.',
    intro: 'Mystérieux et attachants, les chats ont des besoins bien particuliers. Découvrez nos guides sur l\'alimentation, le comportement, la santé et le bien-être de votre félin.',
  },
  oiseaux: {
    label: 'Oiseaux', icon: '🦜',
    title: 'Conseils et guides pour oiseaux — Mes Poilus',
    description: 'Guides pratiques sur les soins, l\'alimentation et le bien-être de vos oiseaux de compagnie. Perroquets, canaris, perruches et autres.',
    intro: 'Perroquets, perruches, canaris… nos guides couvrent tout ce qu\'il faut savoir pour offrir à vos oiseaux un environnement épanouissant, une alimentation équilibrée et des soins adaptés.',
  },
  rongeurs: {
    label: 'Rongeurs', icon: '🐹',
    title: 'Conseils et guides pour rongeurs — Mes Poilus',
    description: 'Guides pratiques pour lapins, cochons d\'Inde, hamsters et autres rongeurs. Alimentation, habitat et soins pour vos petits compagnons.',
    intro: 'Lapins, cochons d\'Inde, hamsters, rats… les rongeurs sont des compagnons attachants aux besoins spécifiques. Nos guides vous aident à leur offrir une vie saine et épanouie.',
  },
  reptiles: {
    label: 'Reptiles', icon: '🦎',
    title: 'Conseils et guides pour reptiles — Mes Poilus',
    description: 'Guides pratiques pour tortues, lézards, serpents et autres reptiles. Habitat, alimentation et soins pour vos reptiles de compagnie.',
    intro: 'Tortues, geckos, serpents, caméléons… les reptiles fascinent autant qu\'ils surprennent. Retrouvez nos conseils sur l\'habitat, l\'alimentation et les soins pour ces animaux extraordinaires.',
  },
};

const PILLS = [
  { id: 'all',      label: 'Tous',     icon: '🐾', href: '/blog' },
  { id: 'chiens',   label: 'Chiens',   icon: '🐕', href: '/blog/chiens' },
  { id: 'chats',    label: 'Chats',    icon: '🐈', href: '/blog/chats' },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: '🦜', href: '/blog/oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs', icon: '🐹', href: '/blog/rongeurs' },
  { id: 'reptiles', label: 'Reptiles', icon: '🦎', href: '/blog/reptiles' },
  { id: 'general',  label: 'Général',  icon: '📝', href: '/blog?category=general' },
];

async function getArticles(category: string): Promise<Article[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .or(`category.eq.${category},categories.cs.{${category}}`)
      .order('published_at', { ascending: false })
      .limit(24);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

export async function CategoryPageContent({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  const [articles, photos] = await Promise.all([
    getArticles(category),
    getBannerPhotos(CATEGORY_QUERIES[category] ?? category),
  ]);
  const [featured, ...rest] = articles;

  return (
    <div className="px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold dark:text-white text-gray-900 tracking-tight">
          {meta.icon} {meta.label}
        </h1>
        <p className="dark:text-gray-400 text-gray-600 text-sm mt-1 max-w-2xl">{meta.intro}</p>
      </div>

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-2">
        {PILLS.map(({ id, label, icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
              id === category
                ? 'bg-amber-500 text-black border-amber-500 font-semibold'
                : 'bg-transparent dark:text-gray-400 text-gray-600 dark:border-[#333] border-gray-300 hover:border-amber-500/50 hover:text-amber-400'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Bannière */}
      <div className="relative h-28 rounded-2xl overflow-hidden dark:bg-[#111] bg-gray-200">
        {photos[0] && (
          <Image src={photos[0].url} alt={photos[0].alt} fill className="object-cover object-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 from-30% via-amber-500/80 via-55% to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center px-6 z-10">
          <div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium">Catégorie</p>
            <p className="text-white font-bold text-xl">{meta.label}</p>
            <p className="text-white/60 text-xs mt-0.5">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="dark:text-gray-400 text-gray-500">Les premiers articles arrivent bientôt !</p>
        </div>
      ) : (
        <>
          {featured && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-amber-400 font-medium uppercase tracking-wide">À la une</span>
              </div>
              <BlogCard article={featured} featured />
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold dark:text-white text-gray-900 mb-4">Articles · {meta.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rest.map((article) => (
                  <BlogCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AdBanner slot="1266534148" variant="in-article" className="mt-6" />
    </div>
  );
}
