'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dog, Cat, Bird, Mouse, Zap, PawPrint } from 'lucide-react';
import clsx from 'clsx';
import { toHashtag } from '@/lib/hashtag';

const CATEGORY_COLORS: Record<string, string> = {
  chiens: 'text-orange-600 bg-orange-100 border-orange-200',
  chats: 'text-pink-600 bg-pink-100 border-pink-200',
  oiseaux: 'text-blue-600 bg-blue-100 border-blue-200',
  rongeurs: 'text-teal-600 bg-teal-100 border-teal-200',
  reptiles: 'text-green-600 bg-green-100 border-green-200',
  general: 'text-gray-600 bg-gray-100 border-gray-200',
};

const CATEGORY_GRADIENT: Record<string, string> = {
  chiens: 'from-orange-600 to-orange-700',
  chats: 'from-pink-600 to-pink-700',
  oiseaux: 'from-blue-600 to-blue-700',
  rongeurs: 'from-teal-600 to-teal-700',
  reptiles: 'from-green-600 to-green-700',
  general: 'from-gray-600 to-gray-700',
};

const CATEGORY_ICONS: Record<string, typeof PawPrint> = {
  chiens: Dog,
  chats: Cat,
  oiseaux: Bird,
  rongeurs: Mouse,
  reptiles: Zap,
  general: PawPrint,
};

function getTeaser(raw: string, max = 650): string {
  const plain = raw
    .replace(/<[^>]+>/g, ' ')   // HTML tags
    .replace(/#{1,6}\s+/g, ' ') // ## headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // **bold** / *italic*
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')   // __bold__ / _italic_
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')      // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')   // ![img](url)
    .replace(/^\s*[-*>]\s+/gm, ' ')          // list items / blockquotes
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

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
  const IconComponent = CATEGORY_ICONS[article.category] ?? PawPrint;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className={clsx(
        'block group focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 rounded-2xl',
        featured
          ? 'flex flex-col md:flex-row md:items-center gap-6 p-5 bg-orange-50/40 border border-orange-300 rounded-2xl transition-all duration-300 hover:shadow-lg'
          : 'bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-200 transition-all duration-300 h-full flex flex-col'
      )}
      aria-label={`Lire l'article: ${article.title}`}
    >
      {/* Image de l'article */}
      {featured ? (
        /* Vedette : conteneur carré = image carrée → 0 bord gris */
        <div className={clsx('relative w-full h-64 md:w-96 md:h-96 flex-shrink-0 bg-gradient-to-br', gradient)} style={{ overflow: 'hidden', borderRadius: '1rem', border: '2px solid rgba(251,146,60,0.6)', viewTransitionName: `article-${article.slug}` }}>
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                unoptimized
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 384px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <div className={clsx('absolute inset-0 flex items-center justify-center bg-gradient-to-br opacity-80', gradient)}>
              <IconComponent size={64} className="text-white" strokeWidth={1} />
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
            <span className={clsx('badge border text-xs font-semibold px-3 py-1.5', categoryStyle)}>{article.category}</span>
            <span className="badge bg-orange-500 text-white border border-orange-400 text-xs font-semibold px-3 py-1.5">À la une</span>
          </div>
          {article.image_credit && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(article.image_credit_url ?? '#', '_blank', 'noopener,noreferrer'); }}
              aria-label={`Photo par ${article.image_credit} (ouvre dans un nouvel onglet)`}
              className="absolute bottom-2 right-2 text-[10px] text-white/70 hover:text-white transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded"
            >
              © {article.image_credit}
            </button>
          )}
        </div>
      ) : (
        /* Carte normale : hauteur fixe, object-cover */
        <div className={clsx('relative w-full h-48 flex-shrink-0 bg-gradient-to-br', gradient)} style={{ overflow: 'hidden', borderRadius: '0 0 1rem 1rem', borderBottom: '2px solid rgba(251,146,60,0.6)', viewTransitionName: `article-${article.slug}` }}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              unoptimized
              className="object-cover object-center transition-smooth group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <IconComponent size={64} className="text-white" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
            <span className={clsx('badge border text-xs font-semibold px-3 py-1.5', categoryStyle)}>{article.category}</span>
          </div>
          {article.image_credit && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(article.image_credit_url ?? '#', '_blank', 'noopener,noreferrer'); }}
              aria-label={`Photo par ${article.image_credit} (ouvre dans un nouvel onglet)`}
              className="absolute bottom-2 right-2 text-[10px] text-white/70 hover:text-white transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded"
            >
              © {article.image_credit}
            </button>
          )}
        </div>
      )}

        {/* Contenu */}
        {featured ? (
          <div className="flex flex-col justify-between flex-1">
            {/* Haut */}
            <div className="flex flex-col gap-3">
              <p className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-snug">
                {article.title}
              </p>
              {article.excerpt && (
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
              {article.content && (
                <p className="text-sm text-gray-500 leading-relaxed italic border-l-2 border-orange-200 pl-3 mt-2">
                  {getTeaser(article.content)}
                </p>
              )}
              {article.seo_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-6">
                  {article.seo_keywords.slice(0, 5).map((kw) => (
                    <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                      #{toHashtag(kw)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Bas */}
            <div className="flex items-center gap-3 pt-4 border-t border-orange-100 mt-4">
              <span className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                Lire l'article →
              </span>
              <div className="flex flex-col text-xs text-gray-500">
                <time dateTime={article.published_at ?? ''}>{publishedDate}</time>
                <span>{article.reading_time} min de lecture</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-5 flex-1 bg-white">
            <p className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">
              {article.title}
            </p>
            {article.excerpt && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 flex-1">
                {article.excerpt}
              </p>
            )}
            {article.seo_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {article.seo_keywords.slice(0, 2).map((kw) => (
                  <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                    #{toHashtag(kw)}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
              <time dateTime={article.published_at ?? ''} className="text-xs text-gray-500">{publishedDate}</time>
              <span className="text-xs text-gray-500 font-medium">{article.reading_time} min</span>
            </div>
          </div>
        )}
    </Link>
  );
}
