import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { getPhotoForArticle, getHeroPhotos, CATEGORY_PLACEHOLDER } from '@/lib/unsplash';
import NewsletterForm from '@/components/landing/NewsletterForm';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AdBanner from '@/components/ui/AdBanner';
import type { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Mes Poilus - Conseils & guides animaux de compagnie',
  description:
    "Blog de conseils pratiques, guides vétérinaires et boutique d'accessoires pour tous les amoureux des animaux de compagnie.",
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mes Poilus - Conseils & guides animaux de compagnie',
    description: "Blog, guides pratiques et boutique pour vos animaux de compagnie.",
    type: 'website',
    url: '/',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
};

const CATEGORIES = [
  { id: 'chiens',   label: 'Chiens',   icon: '🐕', color: 'from-amber-400 to-orange-400' },
  { id: 'chats',    label: 'Chats',    icon: '🐈', color: 'from-purple-400 to-pink-400' },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: '🦜', color: 'from-sky-400 to-blue-400' },
  { id: 'rongeurs', label: 'Rongeurs', icon: '🐹', color: 'from-emerald-400 to-teal-400' },
  { id: 'reptiles', label: 'Reptiles', icon: '🦎', color: 'from-lime-400 to-green-500' },
];

const CATEGORY_LABELS: Record<string, string> = {
  chiens: '🐕 Chiens', chats: '🐈 Chats', oiseaux: '🦜 Oiseaux',
  rongeurs: '🐹 Rongeurs', reptiles: '🦎 Reptiles', general: '🐾 Général',
};

async function getLandingData() {
  const [heroPhotos, articles, ...catPhotos] = await Promise.all([
    getHeroPhotos(),
    (async () => {
      try {
        const supabase = createAdminClient();
        const { data } = await supabase
          .from('articles')
          .select('id,title,slug,excerpt,category,image_url,image_alt,image_credit,image_credit_url,published_at,reading_time,seo_keywords')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(3);
        return (data as Article[]) ?? [];
      } catch {
        return [] as Article[];
      }
    })(),
    ...CATEGORIES.map((c) => getPhotoForArticle(c.label, c.id)),
  ]);

  return {
    heroPhotos,
    articles,
    catPhotos,
  };
}

export default async function LandingPage() {
  const { heroPhotos, articles, catPhotos } = await getLandingData();

  return (
    <div className="bg-white text-gray-900">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <nav className="px-6 py-5 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-2xl">🐾</span>
            <span className="font-bold text-white text-lg tracking-tight drop-shadow">Mes Poilus</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 mx-auto">
            {[
              { href: '/blog',        label: 'Blog'       },
              { href: '#categories',  label: 'Animaux'    },
              { href: '/adoption',    label: 'Adoption'   },
              { href: '#newsletter',  label: 'Newsletter' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors duration-150 drop-shadow"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/boutique"
              className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-1 rounded-lg
                         transition-colors duration-150 shadow-md"
            >
              Boutique
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] overflow-hidden bg-gray-900 flex items-center">

        {/* Côté droit : grille de 4 photos d'animaux */}
        <div className="absolute right-0 top-0 bottom-0 w-[52%] hidden lg:block">
          {/* Dégradé gauche : fond → transparent */}
          <div className="absolute left-0 top-0 bottom-0 w-48 z-10 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
          {/* Dégradé haut */}
          <div className="absolute left-0 right-0 top-0 h-32 z-10 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none" />
          {/* Dégradé bas */}
          <div className="absolute left-0 right-0 bottom-0 h-32 z-10 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />

          {/* 2 colonnes décalées */}
          <div className="flex gap-3 h-full px-4 py-8">
            {/* Colonne 1 - décalée vers le bas */}
            <div className="flex flex-col gap-3 flex-1 mt-12">
              {[heroPhotos[0], heroPhotos[2]].map((photo, i) =>
                photo ? (
                  <div key={i} className="relative flex-1 rounded-2xl overflow-hidden min-h-0">
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      fill
                      priority={i === 0}
                      className="object-cover"
                      sizes="25vw"
                    />
                  </div>
                ) : (
                  <div key={i} className="flex-1 rounded-2xl bg-gray-800 min-h-0" />
                )
              )}
            </div>
            {/* Colonne 2 - décalée vers le haut */}
            <div className="flex flex-col gap-3 flex-1 -mt-12">
              {[heroPhotos[1], heroPhotos[3]].map((photo, i) =>
                photo ? (
                  <div key={i} className="relative flex-1 rounded-2xl overflow-hidden min-h-0">
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  </div>
                ) : (
                  <div key={i} className="flex-1 rounded-2xl bg-gray-800 min-h-0" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Côté gauche : texte + CTAs */}
        <div className="relative z-10 w-full lg:w-[52%] px-8 md:px-16 py-32 lg:py-40">
          <span className="inline-block bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold
                           px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Blog & boutique animaux
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Le compagnon digital des{' '}
            <span className="text-amber-400">amoureux des animaux</span>
          </h1>
          <p className="text-white/70 text-lg max-w-lg mb-10 leading-relaxed">
            Conseils vétérinaires, guides pratiques et produits soigneusement sélectionnés
            pour chiens, chats, oiseaux et bien plus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/blog"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-3.5
                         rounded-xl transition-colors duration-150 text-base shadow-lg shadow-amber-500/30"
            >
              Découvrir nos conseils
            </Link>
            <Link
              href="#categories"
              className="border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-3.5
                         rounded-xl transition-colors duration-150 text-base"
            >
              Explorer par animal
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce lg:left-[26%]">
          <div className="w-0.5 h-6 bg-white/30 rounded" />
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
        </div>
      </section>

      {/* ── DERNIERS ARTICLES ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-amber-600 text-sm font-semibold uppercase tracking-widest">Le blog</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Nos derniers conseils</h2>
            </div>
            <Link href="/blog" className="hidden md:flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors">
              Voir tous les articles →
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <p className="text-gray-500">Les premiers articles arrivent bientôt !</p>
              <Link href="/blog" className="inline-block mt-4 text-amber-600 font-medium hover:underline">
                Voir le blog →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(articles as Article[]).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link href="/blog" className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:text-amber-700">
              Voir tous les articles →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ────────────────────────────────────────────────────── */}
      <section id="categories" className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-amber-600 text-sm font-semibold uppercase tracking-widest">Explorer</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Par type d'animal</h2>
            <p className="text-gray-500 mt-2">Trouvez les conseils adaptés à votre compagnon</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, i) => {
              const photo = catPhotos[i];
              const placeholder = CATEGORY_PLACEHOLDER[cat.id];
              const imgSrc = photo?.url ?? placeholder;

              return (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.id}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-gray-200 block"
                >
                  <Image
                    src={imgSrc}
                    alt={cat.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    unoptimized={imgSrc.endsWith('.svg')}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 text-center">
                    <span className="text-white font-bold text-base drop-shadow">{cat.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section id="newsletter" className="py-20 px-6 bg-gradient-to-br from-amber-500 to-orange-500">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-4xl mb-4 block">🐾</span>
          <h2 className="text-3xl font-bold text-white mb-3">
            Rejoignez notre communauté
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Recevez nos meilleurs conseils chaque semaine - conseils vétérinaires,
            astuces éducation et bons plans pour vos animaux.
          </p>
          <NewsletterForm />
          <p className="text-white/50 text-xs mt-4">
            Pas de spam. Désinscription à tout moment sur simple demande. Conformité RGPD.
          </p>
        </div>
      </section>

      {/* ── PUB ───────────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <AdBanner slot="2276363485" />
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl">🐾</span>
                <span className="font-bold text-white text-lg">Mes Poilus</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
                Blog de conseils et boutique d'accessoires pour tous les amoureux des animaux
                de compagnie.
              </p>
              <div className="flex gap-4 mt-5">
                <a
                  href="https://www.instagram.com/mespoilusofficiel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61589487954538"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Facebook
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Navigation</h3>
              <ul className="space-y-2.5">
                {[
                  { href: '/blog',                  label: 'Blog'      },
                  { href: '/adoption',              label: 'Adoption'  },
                  { href: '/blog?category=chiens',  label: 'Chiens'    },
                  { href: '/blog?category=chats',   label: 'Chats'     },
                  { href: '/blog?category=oiseaux', label: 'Oiseaux'   },
                  { href: '/blog?category=rongeurs', label: 'Rongeurs' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm hover:text-amber-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Légal</h3>
              <ul className="space-y-2.5">
                {[
                  { href: '/mentions-legales', label: 'Mentions légales' },
                  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
                  { href: '/cgu', label: "Conditions d'utilisation" },
                  { href: '/cookies', label: 'Cookies' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm hover:text-amber-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-xs text-gray-400">
              © 2026 Mes Poilus. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Contenu rédigé par IA avec supervision humaine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Article Card (light version pour landing) ────────────────────────────── */
function ArticleCard({ article }: { article: Article }) {
  const imgSrc = article.image_url ?? CATEGORY_PLACEHOLDER[article.category] ?? '/images/categories/general.svg';
  const date = article.published_at
    ? format(new Date(article.published_at), 'd MMM yyyy', { locale: fr })
    : '';

  return (
    <Link href={`/blog/${article.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-shadow duration-200">
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <Image
          src={imgSrc}
          alt={article.image_alt ?? article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized={imgSrc.endsWith('.svg')}
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{date}</span>
          {article.reading_time && <span>{article.reading_time} min de lecture</span>}
        </div>
      </div>
    </Link>
  );
}
