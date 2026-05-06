import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { marked } from 'marked';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORY_PLACEHOLDER } from '@/lib/unsplash';

interface Props {
  params: { slug: string };
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    return data as Article | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Article introuvable' };

  const canonicalUrl = `/blog/${article.slug}`;
  const description = article.meta_description ?? article.excerpt;
  const ogImages = article.image_url
    ? [{ url: article.image_url, alt: article.image_alt ?? article.title, width: 1200, height: 630 }]
    : [];

  return {
    title: article.title,
    description,
    keywords: article.seo_keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: description ?? '',
      type: 'article',
      url: canonicalUrl,
      siteName: 'Mes Poilus',
      locale: 'fr_FR',
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? undefined,
      authors: ['Marie - Mes Poilus'],
      tags: article.seo_keywords,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: description ?? '',
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  chiens: '🐕 Chiens',
  chats: '🐈 Chats',
  oiseaux: '🦜 Oiseaux',
  rongeurs: '🐹 Rongeurs',
  reptiles: '🦎 Reptiles',
  general: '🐾 Général',
};

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const htmlContent = await marked(article.content, { gfm: true });
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: fr })
    : '';

  const heroImage = article.image_url || CATEGORY_PLACEHOLDER[article.category] || '/images/categories/general.svg';
  const heroAlt = article.image_alt || article.title;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com';
  const articleUrl = `${appUrl}/blog/${article.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description ?? article.excerpt,
    image: article.image_url ?? undefined,
    keywords: article.seo_keywords?.join(', '),
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at ?? article.published_at ?? undefined,
    author: {
      '@type': 'Person',
      name: 'Marie',
      url: `${appUrl}/agents/marie`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mes Poilus',
      url: appUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    inLanguage: 'fr',
    url: articleUrl,
  };

  return (
    <div className="animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Barre de navigation */}
      <div className="px-8 py-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors duration-150"
        >
          ← Retour au blog
        </Link>
      </div>

      {/* Hero image pleine largeur */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden bg-[#0d0d0d]">
        <Image
          src={heroImage}
          alt={heroAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          unoptimized={heroImage.endsWith('.svg')}
        />
        {/* Overlay dégradé profond */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

        {/* Crédit photo */}
        {article.image_credit && (
          <a
            href={article.image_credit_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="absolute bottom-4 right-6 text-[10px] text-white/40 hover:text-white/70 transition-colors bg-black/40 px-2 py-1 rounded backdrop-blur-sm"
          >
            📷 {article.image_credit} / Unsplash
          </a>
        )}

        {/* Catégorie en overlay bas */}
        <div className="absolute bottom-6 left-8">
          <span className="text-xs text-gray-400 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
        </div>
      </div>

      {/* Contenu de l'article */}
      <div className="px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Article Header */}
          <header className="space-y-6 mb-12 -mt-2">
            <div className="flex items-center gap-3 flex-wrap">
              {article.reading_time && (
                <span className="text-xs text-gray-500">{article.reading_time} min de lecture</span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white leading-tight">{article.title}</h1>

            {article.excerpt && (
              <p className="text-gray-400 text-base leading-relaxed">{article.excerpt}</p>
            )}

            <div className="flex items-center gap-4 pt-2 border-t border-[#222]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-sm">
                  ✍️
                </div>
                <div>
                  <div className="text-xs font-medium text-white">Marie</div>
                  <div className="text-[10px] text-gray-600">Rédactrice IA</div>
                </div>
              </div>
              {publishedDate && (
                <div className="text-xs text-gray-500">Publié le {publishedDate}</div>
              )}
            </div>
          </header>

          {/* SEO keywords */}
          {article.seo_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-[#1a1a1a]">
              {article.seo_keywords.map((kw) => (
                <span key={kw} className="text-[10px] bg-[#1a1a1a] text-gray-500 px-2 py-1 rounded-full border border-[#222]">
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Article content */}
          <div
            className="article-content prose prose-invert prose-base max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-5
              prose-h3:text-xl prose-h3:mt-9 prose-h3:mb-4
              prose-h4:text-base prose-h4:mt-7 prose-h4:mb-3
              prose-p:text-gray-300 prose-p:leading-[1.85] prose-p:my-6
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-ul:text-gray-300 prose-ul:my-6
              prose-ol:text-gray-300 prose-ol:my-6
              prose-li:my-2 prose-li:leading-relaxed
              prose-hr:border-[#333] prose-hr:my-10
              prose-blockquote:border-l-2 prose-blockquote:border-l-purple-400 prose-blockquote:bg-purple-400/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:my-8
              prose-code:text-emerald-400 prose-code:bg-[#1a1a1a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-[#333] prose-pre:rounded-xl prose-pre:my-8
              prose-table:w-full prose-table:my-8
              prose-thead:border-b prose-thead:border-[#444]
              prose-th:text-white prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:text-left prose-th:bg-[#1a1a1a]
              prose-td:py-3 prose-td:px-4 prose-td:text-gray-300 prose-td:border-b prose-td:border-[#222]
              prose-tr:border-b prose-tr:border-[#222]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Footer article */}
          <footer className="mt-12 pt-6 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-xs text-gray-600">
                Article généré par l'IA Marie de Mes Poilus
              </div>
              <Link href="/blog" className="btn-ghost text-sm">
                ← Retour au blog
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
