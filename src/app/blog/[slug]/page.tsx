import { notFound } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { marked } from 'marked';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import DirectionalTransition from '@/components/ui/DirectionalTransition';
import AdBanner from '@/components/ui/AdBanner';
import CommentForm from '@/components/blog/CommentForm';
import { Dog, Cat, Bird, Mouse, Zap, PawPrint, PenTool, MessageCircle, Pencil } from 'lucide-react';
import ClientWrapper from '@/components/animations/ClientWrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const article = await getArticle(slug);
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
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const htmlContent = await marked(article.content, { gfm: true });
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: fr })
    : '';

  const heroImage = article.image_url || null;
  const heroAlt = article.image_alt || article.title;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';
  const articleUrl = `${appUrl}/blog/${article.slug}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: appUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${appUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: CATEGORY_LABELS[article.category] ?? article.category, item: `${appUrl}/blog/${article.category}` },
      { '@type': 'ListItem', position: 4, name: article.title, item: articleUrl },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description ?? article.excerpt,
    ...(article.image_url ? {
      image: { '@type': 'ImageObject', url: article.image_url, alt: article.image_alt ?? article.title },
    } : {}),
    keywords: article.seo_keywords?.join(', '),
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at ?? article.published_at ?? undefined,
    author: { '@type': 'Person', name: 'Marie', url: `${appUrl}/agents/marie` },
    publisher: { '@type': 'Organization', name: 'Mes Poilus', url: appUrl, logo: { '@type': 'ImageObject', url: `${appUrl}/icon.svg` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    inLanguage: 'fr',
    url: articleUrl,
  };

  const faqList = Array.isArray(article.faq) ? article.faq.filter(f => f?.q && f?.a) : [];
  const faqLd = faqList.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  const CategoryIcon = CATEGORY_ICONS[article.category] || PawPrint;

  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  const isAdmin = !!user;

  return (
    <DirectionalTransition>
    <div className="min-h-screen animate-fade-in">
      {isAdmin && (
        <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 bg-gray-900/95 backdrop-blur text-white text-xs fade-up">
          <Pencil size={13} strokeWidth={1.5} className="text-orange-400" />
          <span className="text-gray-400">Mode admin</span>
          <Link href={`/blog-admin/${article.slug}/edit`}
            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-white rounded-md font-medium transition-colors">
            Modifier l'article
          </Link>
          <Link href="/blog-admin?tab=articles"
            className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors">
            Tous les articles
          </Link>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      {/* Hero image - responsive mobile/tablette avec fond orange-50 */}
      <div className="relative w-full bg-orange-50 overflow-hidden" style={{ viewTransitionName: `article-${slug}` }}>
        <div className="relative max-w-6xl mx-auto">
          {heroImage ? (
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9]">
              <Image
                src={heroImage}
                alt={heroAlt}
                fill
                priority
                unoptimized
                className="object-cover sm:object-contain md:object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 100vw"
              />
            </div>
          ) : (
            <div className="w-full h-48 sm:h-64 md:h-80 bg-orange-50 flex items-center justify-center">
              <PawPrint size={48} className="text-orange-200 sm:text-orange-300" strokeWidth={1} />
            </div>
          )}
          
          {/* Dégradé en bas - plus léger sur mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Crédit image - plus petit sur mobile */}
          {article.image_credit && (
            <a
              href={article.image_credit_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="absolute bottom-2 right-2 sm:bottom-3 sm:right-4 text-[8px] sm:text-[10px] text-white/50 hover:text-white/80 transition-colors bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm z-10"
            >
              © {article.image_credit} / Pexels
            </a>
          )}

          {/* Catégorie badge - adapté mobile */}
          <div className="absolute bottom-2 left-3 sm:bottom-4 sm:left-6 flex items-center gap-1.5 sm:gap-2 z-10">
            <CategoryIcon size={14} strokeWidth={1.5} className="text-white sm:text-white drop-shadow-sm" />
            <span className="text-[10px] sm:text-xs text-white bg-black/40 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full backdrop-blur-sm">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-6 py-10">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8" style={{ color: '#111827' }}>

          {/* Retour au blog */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-orange-600 text-sm font-medium transition-colors mb-8 fade-up"
          >
            ← Retour au blog
          </Link>

          {/* Header avec animations */}
          <header className="mb-8 fade-up">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4" style={{ color: '#111827' }}>
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-base leading-relaxed mb-6 text-gray-600">{article.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-sm">
                  <PenTool size={16} strokeWidth={1.5} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">Marie</div>
                  <div className="text-[10px] text-gray-500">Rédactrice</div>
                </div>
              </div>
              {publishedDate && (
                <div className="text-xs text-gray-700">Publié le {publishedDate}</div>
              )}
              {article.reading_time && (
                <div className="text-xs text-gray-700">{article.reading_time} min de lecture</div>
              )}
            </div>
          </header>

          {/* Mots-clés */}
          {article.seo_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 fade-up">
              {article.seo_keywords.map((kw) => (
                <span key={kw} className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full border border-orange-200">
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Corps de l'article */}
          <div
            className="article-content prose prose-base max-w-none
              prose-headings:font-semibold prose-headings:scroll-mt-20
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
              prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-pre:my-8
              prose-img:rounded-xl prose-img:shadow-md"
            style={{ color: '#1f2937' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* FAQ Section */}
          {faqList.length > 0 && (
            <section className="mt-12 fade-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
              <div className="space-y-3">
                {faqList.map((f, i) => (
                  <details key={i} className="group border border-gray-200 rounded-xl bg-gray-50 open:bg-white open:shadow-sm transition-colors">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-5 py-4 font-semibold text-gray-900">
                      <span>{f.q}</span>
                      <span className="text-orange-500 shrink-0 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                    </summary>
                    <p className="px-5 pb-4 -mt-1 text-gray-700 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <AdBanner slot="1266534148" variant="in-article" className="my-10" />

          <footer className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs text-gray-600">
              Article rédigé par Marie
            </div>
            <Link href="/blog" className="text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors">
              ← Retour au blog
            </Link>
          </footer>

          {/* Commentaires */}
          <section id="commentaires" className="mt-10 space-y-6">
            <CommentsSection slug={slug} />
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <CommentForm slug={slug} />
            </div>
          </section>

        </div>
      </div>
      
      <ClientWrapper />
    </div>
    </DirectionalTransition>
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
    <div className="fade-up">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={17} strokeWidth={1.5} className="text-orange-600" />
        <h2 className="font-bold text-gray-900">{comments.length} commentaire{comments.length > 1 ? 's' : ''}</h2>
      </div>
      <div className="space-y-3">
        {comments.map((c, idx) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 stagger-child" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-900">{c.author_name}</span>
              <span className="text-xs text-gray-600">
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