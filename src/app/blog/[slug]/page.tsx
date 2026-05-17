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
import CommentForm from '@/components/blog/CommentForm';
import { Dog, Cat, Bird, Mouse, Zap, PawPrint, PenTool, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

const CATEGORY_ICONS: Record<string, typeof Dog> = {
  chiens: Dog,
  chats: Cat,
  oiseaux: Bird,
  rongeurs: Mouse,
  reptiles: Zap,
  general: PawPrint,
};

const CATEGORY_LABELS: Record<string, string> = {
  chiens: 'Chiens',
  chats: 'Chats',
  oiseaux: 'Oiseaux',
  rongeurs: 'Rongeurs',
  reptiles: 'Reptiles',
  general: 'Général',
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

  const CategoryIcon = CATEGORY_ICONS[article.category] || PawPrint;

  return (
    <div className="min-h-screen bg-white animate-fade-in">
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
            © {article.image_credit} / Pexels
          </a>
        )}

        <div className="absolute bottom-4 left-6 flex items-center gap-2">
          <CategoryIcon size={18} strokeWidth={1.5} className="text-white" />
          <span className="text-xs text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-6 py-10">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm p-8" style={{ color: '#111827' }}>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-orange-600 text-sm font-medium transition-colors mb-8"
          >
            ← Retour au blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: '#111827' }}>{article.title}</h1>

            {article.excerpt && (
              <p className="text-base leading-relaxed mb-6" style={{ color: '#4b5563' }}>{article.excerpt}</p>
            )}

            <div className="flex items-center gap-4 py-4 border-t border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-sm">
                  <PenTool size={16} strokeWidth={1.5} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#1f2937' }}>Marie</div>
                  <div className="text-[10px]" style={{ color: '#9ca3af' }}>Rédactrice</div>
                </div>
              </div>
              {publishedDate && (
                <div className="text-xs" style={{ color: '#9ca3af' }}>Publié le {publishedDate}</div>
              )}
              {article.reading_time && (
                <div className="text-xs" style={{ color: '#9ca3af' }}>{article.reading_time} min de lecture</div>
              )}
            </div>
          </header>

          {/* Mots-clés */}
          {article.seo_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.seo_keywords.map((kw) => (
                <span key={kw} className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200">
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Corps de l'article */}
          <div
            className="article-content prose prose-base max-w-none
              prose-headings:font-semibold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2
              prose-p:leading-[1.85] prose-p:my-5
              prose-a:text-orange-600 prose-a:underline prose-a:decoration-orange-400 prose-a:underline-offset-2 prose-a:font-medium hover:prose-a:text-orange-500
              prose-strong:font-semibold
              prose-ul:my-5 prose-ol:my-5
              prose-li:my-1.5 prose-li:leading-relaxed
              prose-hr:border-gray-200 prose-hr:my-8
              prose-blockquote:border-l-2 prose-blockquote:border-l-orange-400 prose-blockquote:bg-orange-50 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:my-8
              prose-code:text-orange-700 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-pre:my-8"
            style={{ color: '#1f2937' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <AdBanner slot="1266534148" variant="in-article" className="my-10" />

          <footer className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs" style={{ color: '#9ca3af' }}>
              Article rédigé par Marie
            </div>
            <Link href="/blog" className="text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors">
              ← Retour au blog
            </Link>
          </footer>

          {/* Commentaires */}
          <section className="mt-10 space-y-6">
            <CommentsSection slug={params.slug} />
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <CommentForm slug={params.slug} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

async function CommentsSection({ slug }: { slug: string }) {
  const supabase = createAdminClient();
  const { data: comments } = await supabase
    .from('article_comments')
    .select('id, author_name, content, created_at')
    .eq('article_slug', slug)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (!comments || comments.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={17} strokeWidth={1.5} className="text-orange-600" />
        <h2 className="font-bold text-gray-900">{comments.length} commentaire{comments.length > 1 ? 's' : ''}</h2>
      </div>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-900">{c.author_name}</span>
              <span className="text-xs text-gray-400">
                {format(new Date(c.created_at), 'd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
