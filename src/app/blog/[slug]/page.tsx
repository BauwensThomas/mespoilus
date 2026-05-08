import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { marked } from 'marked';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import AdBanner from '@/components/ui/AdBanner';

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
      .maybeSingle();
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

  const heroImage = article.image_url || null;
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
    author: { '@type': 'Person', name: 'Marie', url: `${appUrl}/agents/marie` },
    publisher: { '@type': 'Organization', name: 'Mes Poilus', url: appUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    inLanguage: 'fr',
    url: articleUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero image */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden bg-gray-200">
        {heroImage && (
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {article.image_credit && (
          <a
            href={article.image_credit_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="absolute bottom-3 right-4 text-[10px] text-white/60 hover:text-white/90 transition-colors bg-black/30 px-2 py-0.5 rounded backdrop-blur-sm"
          >
            📷 {article.image_credit} / Pexels
          </a>
        )}

        <div className="absolute bottom-4 left-6">
          <span className="text-xs text-white bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-6 py-10">
        <div className="max-w-2xl mx-auto">

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-amber-600 text-sm font-medium transition-colors mb-8"
          >
            ← Retour au blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>

            {article.excerpt && (
              <p className="text-gray-500 text-base leading-relaxed mb-6">{article.excerpt}</p>
            )}

            <div className="flex items-center gap-4 py-4 border-t border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-sm">
                  ✍️
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-800">Marie</div>
                  <div className="text-[10px] text-gray-400">Rédactrice IA</div>
                </div>
              </div>
              {publishedDate && (
                <div className="text-xs text-gray-400">Publié le {publishedDate}</div>
              )}
              {article.reading_time && (
                <div className="text-xs text-gray-400">{article.reading_time} min de lecture</div>
              )}
            </div>
          </header>

          {/* Mots-clés */}
          {article.seo_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.seo_keywords.map((kw) => (
                <span key={kw} className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Corps de l'article */}
          <div
            className="article-content prose prose-base max-w-none
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2
              prose-p:text-gray-700 prose-p:leading-[1.85] prose-p:my-5
              prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:text-gray-700 prose-ul:my-5
              prose-ol:text-gray-700 prose-ol:my-5
              prose-li:my-1.5 prose-li:leading-relaxed
              prose-hr:border-gray-200 prose-hr:my-8
              prose-blockquote:border-l-2 prose-blockquote:border-l-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:my-8 prose-blockquote:text-gray-600
              prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-pre:my-8
              prose-table:w-full prose-table:my-8
              prose-thead:border-b prose-thead:border-gray-200
              prose-th:text-gray-900 prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:text-left prose-th:bg-gray-50
              prose-td:py-3 prose-td:px-4 prose-td:text-gray-700 prose-td:border-b prose-td:border-gray-100"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <AdBanner slot="1266534148" variant="in-article" className="my-10" />

          <footer className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs text-gray-400">
              Article rédigé par Marie — IA Mes Poilus
            </div>
            <Link href="/blog" className="text-sm text-amber-600 hover:text-amber-500 font-medium transition-colors">
              ← Retour au blog
            </Link>
          </footer>

        </div>
      </div>
    </div>
  );
}
