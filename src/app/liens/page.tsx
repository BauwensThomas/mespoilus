import { createAdminClient } from '@/lib/supabase/server';
import { Article } from '@/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import AdBanner from '@/components/ui/AdBanner';

const INSTA = 'https://www.instagram.com/mespoilusofficiel';
const FB = 'https://www.facebook.com/profile.php?id=61589487954538';

export const revalidate = 600; // 10 min : les derniers articles restent frais

export const metadata: Metadata = {
  title: 'Nos derniers articles',
  description: 'Les derniers conseils et guides Mes Poilus pour vos animaux de compagnie.',
  // Page "link in bio" : pas indexée (évite le duplicate avec /blog), mais les liens
  // vers les articles restent suivis. AdSense fonctionne malgré le noindex.
  robots: { index: false, follow: true },
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
      .limit(5); // 5 articles + 1 carte blog = grille 3x2
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

export default async function LiensPage() {
  const articles = await getLatestArticles();

  return (
    <div className="min-h-screen px-6 md:px-8 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nos derniers articles</h1>
      </div>

      {/* Mobile : 1 carte par ligne · tablette : 2 · desktop : 3 (grille 3x2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/blog/${a.slug}`}
            className="rounded-2xl overflow-hidden border border-orange-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-300 flex flex-col"
          >
            {a.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.image_url}
                alt={a.title}
                width={600}
                height={400}
                className="w-full h-40 md:h-48 object-cover"
              />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <p className="font-bold text-gray-900 leading-snug line-clamp-3">{a.title}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-orange-600">
                Lire l'article <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}

        {/* Dernière carte : lien vers tout le blog */}
        <Link
          href="/blog"
          className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-600 to-gray-900 text-white flex flex-col items-center justify-center gap-2.5 p-6 text-center hover:brightness-110 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[220px]"
        >
          <BookOpen className="w-9 h-9" strokeWidth={1.5} />
          <span className="text-lg font-bold leading-tight">Tout le blog</span>
          <span className="inline-flex items-center gap-1 text-sm text-white/90">
            Voir tous les articles <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      {articles.length === 0 && (
        <p className="text-center text-sm text-gray-400 mt-6">
          Les premiers articles arrivent bientôt !
        </p>
      )}

      {/* Réseaux */}
      <div className="mt-10 flex items-center justify-center gap-3">
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

      {/* Pub AdSense en bas - bloc dédié "Mes Poilus - Liens - bas de page"
          (s'affiche seulement si AdSense activé + cookies acceptés) */}
      <AdBanner slot="6028658236" variant="display" className="mt-10 max-w-3xl mx-auto" />
    </div>
  );
}
