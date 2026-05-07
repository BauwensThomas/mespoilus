'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

const CATEGORY_COLORS: Record<string, string> = {
  chiens: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  chats: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  oiseaux: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  rongeurs: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  reptiles: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  general: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const CATEGORY_GRADIENT: Record<string, string> = {
  chiens: 'from-amber-900/40 to-amber-950/80',
  chats: 'from-purple-900/40 to-purple-950/80',
  oiseaux: 'from-blue-900/40 to-blue-950/80',
  rongeurs: 'from-orange-900/40 to-orange-950/80',
  reptiles: 'from-emerald-900/40 to-emerald-950/80',
  general: 'from-gray-800/40 to-gray-900/80',
};

const CATEGORY_EMOJI: Record<string, string> = {
  chiens: '🐕',
  chats: '🐈',
  oiseaux: '🦜',
  rongeurs: '🐹',
  reptiles: '🦎',
  general: '🐾',
};

interface BlogCardProps {
  article: Article;
  featured?: boolean;
}

export default function BlogCard({ article, featured }: BlogCardProps) {
  const categoryStyle = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.general;
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: fr })
    : '';

  const imageSrc = article.image_url || null;
  const imageAlt = article.image_alt || article.title;
  const gradient = CATEGORY_GRADIENT[article.category] ?? CATEGORY_GRADIENT.general;
  const emoji = CATEGORY_EMOJI[article.category] ?? '🐾';

  return (
    <Link href={`/blog/${article.slug}`} className="block group">
      <article
        className={clsx(
          'card-hover h-full flex flex-col overflow-hidden',
          featured && 'border-purple-400/20'
        )}
      >
        {/* Image de l'article */}
        <div className={clsx('relative w-full h-44 overflow-hidden flex-shrink-0 bg-gradient-to-br', gradient)}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20 select-none">
              {emoji}
            </div>
          )}
          {/* Overlay dégradé */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-60" />

          {/* Badge catégorie en overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={clsx('badge border backdrop-blur-sm bg-black/40', categoryStyle)}>
              {article.category}
            </span>
            {featured && (
              <span className="badge bg-purple-500/80 text-white border border-purple-400/30 backdrop-blur-sm">
                ✨ À la une
              </span>
            )}
          </div>

          {/* Crédit photo Unsplash (attribution requise) */}
          {article.image_credit && (
            <a
              href={article.image_credit_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 text-[9px] text-white/50 hover:text-white/80 transition-colors bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm"
            >
              📷 {article.image_credit} / Unsplash
            </a>
          )}
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          {/* Title */}
          <h2 className="text-sm font-semibold text-white group-hover:text-gray-200 transition-colors leading-snug line-clamp-2">
            {article.title}
          </h2>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
              {article.excerpt}
            </p>
          )}

          {/* Keywords */}
          {article.seo_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.seo_keywords.slice(0, 3).map((kw) => (
                <span key={kw} className="text-[10px] bg-gray-700/40 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600/50">
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a] mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-[10px]">
                ✍️
              </div>
              <span className="text-[10px] text-gray-500">Marie</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              {publishedDate && <span>{publishedDate}</span>}
              <span>{article.reading_time} min</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
