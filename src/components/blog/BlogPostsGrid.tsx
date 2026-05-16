'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, Dog, Cat, Bird, Mouse, Zap, PawPrint } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BlogCard from '@/components/blog/BlogCard';
import type { Article } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  chiens:   'text-orange-600 bg-orange-100',
  chats:    'text-pink-600 bg-pink-100',
  oiseaux:  'text-blue-600 bg-blue-100',
  rongeurs: 'text-teal-600 bg-teal-100',
  reptiles: 'text-green-600 bg-green-100',
  general:  'text-gray-600 bg-gray-100',
};

const CATEGORY_GRADIENT: Record<string, string> = {
  chiens:   'from-orange-600 to-orange-700',
  chats:    'from-pink-600 to-pink-700',
  oiseaux:  'from-blue-600 to-blue-700',
  rongeurs: 'from-teal-600 to-teal-700',
  reptiles: 'from-green-600 to-green-700',
  general:  'from-gray-600 to-gray-700',
};

const CATEGORY_ICONS: Record<string, typeof PawPrint> = {
  chiens: Dog, chats: Cat, oiseaux: Bird, rongeurs: Mouse, reptiles: Zap, general: PawPrint,
};

function ListRow({ article }: { article: Article }) {
  const colors = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.general;
  const gradient = CATEGORY_GRADIENT[article.category] ?? CATEGORY_GRADIENT.general;
  const IconComponent = CATEGORY_ICONS[article.category] ?? PawPrint;
  const date = article.published_at
    ? format(new Date(article.published_at), 'd MMM yyyy', { locale: fr })
    : '';

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="bg-white border border-gray-200 rounded-xl flex items-center gap-4 px-4 py-3 hover:shadow-md hover:border-orange-300 transition-all duration-200 group"
    >
      <div className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}>
        {article.image_url ? (
          <Image src={article.image_url} alt={article.image_alt || article.title}
            fill className="object-cover" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-40">
            <IconComponent size={28} className="text-white" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors}`}>
            {article.category}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{article.excerpt}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-400 mb-1">{date}</p>
        <p className="text-xs text-gray-400">{article.reading_time} min</p>
      </div>
    </Link>
  );
}

interface Props {
  articles: Article[];
  activeCategory?: string;
  search?: string;
  label: string;
  showFeatured?: boolean;
}

export default function BlogPostsGrid({ articles, activeCategory, search, label, showFeatured }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('blog-view');
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);

  function toggle(v: 'grid' | 'list') {
    setView(v);
    localStorage.setItem('blog-view', v);
  }

  const showFeat = showFeatured ?? (!activeCategory && !search);
  const featured = showFeat ? articles[0] : undefined;
  const displayArticles = featured ? articles.slice(1) : articles;

  if (articles.length === 0) return null;

  return (
    <>
      {featured && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-orange-600 font-semibold uppercase tracking-widest">À la une</span>
          </div>
          <BlogCard article={featured} featured />
        </div>
      )}

      {displayArticles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => toggle('grid')}
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
                aria-label="Vue grille">
                <LayoutGrid size={18} strokeWidth={1.5} />
              </button>
              <button onClick={() => toggle('list')}
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
                aria-label="Vue liste">
                <List size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayArticles.map(article => <BlogCard key={article.id} article={article} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayArticles.map(article => <ListRow key={article.id} article={article} />)}
            </div>
          )}
        </div>
      )}
    </>
  );
}
