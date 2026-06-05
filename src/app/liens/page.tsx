import { createAdminClient } from '@/lib/supabase/server';
import { Article } from '@/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Gamepad2, ShoppingBag, BookOpen, Wrench, PawPrint, ArrowRight } from 'lucide-react';

const SITE = 'https://www.mespoilus.com';
const INSTA = 'https://www.instagram.com/mespoilusofficiel';
const FB = 'https://www.facebook.com/profile.php?id=61589487954538';

export const revalidate = 600; // 10 min : le dernier article reste frais sans page 100 % dynamique

export const metadata: Metadata = {
  title: 'Tous nos liens',
  description: 'Le dernier article, la Grille Mystère, la boutique, les outils gratuits et l\'adoption — tous les liens Mes Poilus au même endroit.',
  alternates: { canonical: '/liens' },
  openGraph: {
    title: 'Mes Poilus - Tous nos liens',
    description: 'Dernier article, Grille Mystère, boutique, outils et adoption.',
    type: 'website',
    url: '/liens',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
};

async function getLatestArticle(): Promise<Article | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1);
    return ((data as Article[]) ?? [])[0] ?? null;
  } catch {
    return null;
  }
}

const LINKS = [
  { href: '/grille', label: 'Grille Mystère', sub: 'Le jeu solidaire qui aide les refuges', icon: Gamepad2 },
  { href: '/boutique', label: 'La boutique', sub: 'Nos sélections pour vos compagnons', icon: ShoppingBag },
  { href: '/blog', label: 'Tous les articles', sub: 'Conseils & guides animaux', icon: BookOpen },
  { href: '/outils', label: 'Outils gratuits', sub: 'Calculateurs, quiz et plus', icon: Wrench },
  { href: '/adoption', label: 'Adoption', sub: 'Donner ou adopter un animal', icon: PawPrint },
];

export default async function LiensPage() {
  const latest = await getLatestArticle();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md mx-auto">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl" aria-hidden="true">🐾</span>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">Mes Poilus</span>
          </div>
          <p className="text-gray-500 text-sm">Conseils, jeux et bons plans pour vos animaux</p>
        </div>

        {/* Dernier article en vedette */}
        {latest && (
          <Link
            href={`/blog/${latest.slug}`}
            className="block mb-6 rounded-2xl overflow-hidden border border-orange-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {latest.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latest.image_url}
                alt={latest.title}
                width={640}
                height={320}
                className="w-full h-44 object-cover"
              />
            )}
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600 mb-1">
                Dernier article
              </p>
              <p className="font-bold text-gray-900 leading-snug">{latest.title}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-orange-600">
                Lire l'article <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        )}

        {/* Boutons principaux */}
        <div className="space-y-3">
          {LINKS.map(({ href, label, sub, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm hover:border-orange-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-gray-900">{label}</span>
                <span className="block text-xs text-gray-500 truncate">{sub}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>

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

        {/* Pied */}
        <p className="mt-8 text-center text-xs text-gray-400">
          <a href={SITE} className="hover:text-orange-600">mespoilus.com</a>
        </p>
      </div>
    </div>
  );
}
