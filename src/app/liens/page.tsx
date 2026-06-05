import { createAdminClient } from '@/lib/supabase/server';
import { Article } from '@/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

const INSTA = 'https://www.instagram.com/mespoilusofficiel';
const FB = 'https://www.facebook.com/profile.php?id=61589487954538';

export const revalidate = 600; // 10 min : les derniers articles restent frais

export const metadata: Metadata = {
  title: 'Nos derniers articles',
  description: 'Les derniers conseils et guides Mes Poilus pour vos animaux de compagnie.',
  alternates: { canonical: '/liens' },
  openGraph: {
    title: 'Mes Poilus - Nos derniers articles',
    description: 'Les derniers conseils et guides pour vos animaux.',
    type: 'website',
    url: '/liens',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
};

async function getLatestArticles(): Promise<Article[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

export default async function LiensPage() {
  const articles = await getLatestArticles();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">

        <h1 className="text-center text-xl font-extrabold tracking-tight text-gray-900 mb-1">
          Nos derniers articles
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Conseils & guides pour vos animaux 🐾
        </p>

        {/* Grille 3 colonnes : 5 derniers articles + 1 cadre vers le blog */}
        <div className="grid grid-cols-3 gap-2.5">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/blog/${a.slug}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-orange-50 border border-orange-100 group focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.image_url}
                  alt={a.title}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <p className="absolute bottom-0 left-0 right-0 p-2 text-white text-[11px] font-semibold leading-tight line-clamp-3">
                {a.title}
              </p>
            </Link>
          ))}

          {/* 6e cadre : lien vers tout le blog */}
          <Link
            href="/blog"
            className="aspect-square rounded-xl bg-gradient-to-br from-orange-600 to-gray-900 text-white flex flex-col items-center justify-center gap-1.5 px-2 text-center hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <BookOpen className="w-6 h-6" strokeWidth={1.75} />
            <span className="text-xs font-bold leading-tight">Tout le blog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {articles.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Les premiers articles arrivent bientôt !
          </p>
        )}

        {/* Réseaux */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href={INSTA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#e1306c] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
          >
            Instagram
          </a>
          <a
            href={FB}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
          >
            Facebook
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          <a href="https://www.mespoilus.com" className="hover:text-orange-600">mespoilus.com</a>
        </p>
      </div>
    </div>
  );
}
