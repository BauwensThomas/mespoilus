import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import NewsletterForm from '@/components/landing/NewsletterForm';
import AdBanner from '@/components/ui/AdBanner';
import type { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PartenairesSection from '@/components/landing/PartenairesSection';
import AdoptionPreviewSection from '@/components/landing/AdoptionPreviewSection';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, ChevronRight, UtensilsCrossed, Calculator, HelpCircle, Sparkles, BookOpen, ClipboardList } from 'lucide-react';

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
  { id: 'chiens',   label: 'Chiens',   icon: Dog, color: 'cat-dogs' },
  { id: 'chats',    label: 'Chats',    icon: Cat, color: 'cat-cats' },
  { id: 'oiseaux',  label: 'Oiseaux',  icon: Bird, color: 'cat-birds' },
  { id: 'rongeurs', label: 'Rongeurs', icon: Mouse, color: 'cat-rodents' },
  { id: 'reptiles', label: 'Reptiles', icon: Zap, color: 'cat-reptiles' },
];

const CATEGORY_LABELS: Record<string, string> = {
  chiens: 'Chiens', chats: 'Chats', oiseaux: 'Oiseaux',
  rongeurs: 'Rongeurs', reptiles: 'Reptiles', general: 'Général',
};

type HeroPhoto = { url: string; alt: string };


// Ordre fixe des 4 cases du hero
const HERO_SLOTS = ['chiens', 'chats', 'oiseaux', 'rongeurs'];

async function getHeroPhotosFromDB(): Promise<(HeroPhoto | null)[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('hero_photos')
      .select('id, url, alt, animal_type, last_used_at')
      .eq('active', true)
      .order('last_used_at', { ascending: true, nullsFirst: true });
    if (!data || data.length === 0) return [null, null, null, null];

    // Groupe par type, déjà trié par last_used_at ASC → première = la moins récente
    const byType: Record<string, { id: string; url: string; alt: string }[]> = {};
    for (const row of data) {
      const key = ANIMAL_TYPE_MAP[row.animal_type] ?? row.animal_type;
      if (!byType[key]) byType[key] = [];
      byType[key].push({ id: row.id, url: row.url, alt: row.alt });
    }

    // Prend la première (moins récemment utilisée) par slot
    const selected: (HeroPhoto | null)[] = HERO_SLOTS.map(type => {
      const photos = byType[type];
      if (!photos || photos.length === 0) return null;
      return { url: photos[0].url, alt: photos[0].alt };
    });

    // Met à jour last_used_at pour les photos sélectionnées
    const selectedIds = HERO_SLOTS
      .map(type => byType[type]?.[0]?.id)
      .filter(Boolean) as string[];
    if (selectedIds.length > 0) {
      await supabase
        .from('hero_photos')
        .update({ last_used_at: new Date().toISOString() })
        .in('id', selectedIds);
    }

    // Fallback breeds pour les slots sans photo hero
    const SLOT_TO_ANIMAL: Record<string, string> = { chiens: 'chien', chats: 'chat', oiseaux: 'oiseau', rongeurs: 'rongeur' };
    const final = await Promise.all(selected.map(async (photo, i) => {
      if (photo) return photo;
      const animalType = SLOT_TO_ANIMAL[HERO_SLOTS[i]];
      if (!animalType) return null;
      const { data: breeds } = await supabase
        .from('breeds').select('photo_url, name')
        .eq('animal', animalType).eq('status', 'published').not('photo_url', 'is', null).limit(30);
      if (!breeds || breeds.length === 0) return null;
      const pick = breeds[Math.floor(Math.random() * breeds.length)] as { photo_url: string; name: string };
      return { url: pick.photo_url, alt: pick.name };
    }));
    return final;
  } catch {
    return [null, null, null, null];
  }
}

const ANIMAL_TYPE_MAP: Record<string, string> = {
  chien: 'chiens', chiens: 'chiens',
  chat: 'chats', chats: 'chats',
  oiseau: 'oiseaux', oiseaux: 'oiseaux',
  rongeur: 'rongeurs', rongeurs: 'rongeurs',
  reptile: 'reptiles', reptiles: 'reptiles',
};

async function getCategoryPhotosFromDB(): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('hero_photos')
      .select('url, animal_type')
      .eq('active', true)
      .not('animal_type', 'is', null);
    if (!data || data.length === 0) return {};
    const byType: Record<string, string[]> = {};
    for (const row of data) {
      const key = ANIMAL_TYPE_MAP[row.animal_type] ?? row.animal_type;
      if (!byType[key]) byType[key] = [];
      byType[key].push(row.url);
    }
    const result: Record<string, string> = {};
    for (const [type, urls] of Object.entries(byType)) {
      result[type] = urls[Math.floor(Math.random() * urls.length)];
    }
    // Fallback breeds pour les catégories sans photo hero
    const CAT_TO_ANIMAL: Record<string, string> = { chiens: 'chien', chats: 'chat', oiseaux: 'oiseau', rongeurs: 'rongeur', reptiles: 'reptile' };
    await Promise.all(Object.entries(CAT_TO_ANIMAL).map(async ([cat, animalType]) => {
      if (result[cat]) return;
      const { data: breeds } = await supabase
        .from('breeds').select('photo_url')
        .eq('animal', animalType).eq('status', 'published').not('photo_url', 'is', null).limit(30);
      if (breeds && breeds.length > 0) {
        const pick = breeds[Math.floor(Math.random() * breeds.length)] as { photo_url: string };
        result[cat] = pick.photo_url;
      }
    }));
    return result;
  } catch {
    return {};
  }
}

async function getLandingData() {
  const [heroPhotos, catPhotos, articles] = await Promise.all([
    getHeroPhotosFromDB(),
    getCategoryPhotosFromDB(),
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
  ]);

  return { heroPhotos, catPhotos, articles };
}

export default async function LandingPage() {
  const { heroPhotos, catPhotos, articles } = await getLandingData();

  return (
    <div className="bg-orange-50 text-gray-900 min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-40 overflow-hidden bg-gradient-to-b from-orange-50 via-white to-blue-50 flex items-center">

        {/* Côté droit : grille de 4 photos d'animaux */}
        <div className="absolute right-0 top-0 bottom-0 w-[52%] hidden lg:block">
          {/* Dégradé gauche : fond → transparent */}
          <div className="absolute left-0 top-0 bottom-0 w-48 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          {/* Dégradé haut */}
          <div className="absolute left-0 right-0 top-0 h-16 z-10 bg-gradient-to-b from-white to-transparent pointer-events-none" />
          {/* Dégradé bas */}
          <div className="absolute left-0 right-0 bottom-0 h-16 z-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />

          {/* 2 colonnes décalées */}
          <div className="flex gap-3 h-full px-4 py-3">
            {/* Colonne 1 - décalée vers le bas */}
            <div className="flex flex-col gap-3 flex-1 mt-8">
              {[heroPhotos[0], heroPhotos[2]].map((photo, i) =>
                photo ? (
                  <div key={i} className="relative flex-1 rounded-3xl overflow-hidden min-h-0 shadow-lg">
                    <Image src={photo.url} alt={photo.alt} fill priority unoptimized className="object-cover" sizes="25vw" />
                  </div>
                ) : (
                  <div key={i} className="flex-1 rounded-3xl bg-gradient-to-br from-orange-100 to-blue-100 min-h-0" />
                )
              )}
            </div>
            {/* Colonne 2 - décalée vers le haut */}
            <div className="flex flex-col gap-3 flex-1 -mt-8">
              {[heroPhotos[1], heroPhotos[3]].map((photo, i) =>
                photo ? (
                  <div key={i} className="relative flex-1 rounded-3xl overflow-hidden min-h-0 shadow-lg">
                    <Image src={photo.url} alt={photo.alt} fill priority unoptimized className="object-cover" sizes="25vw" />
                  </div>
                ) : (
                  <div key={i} className="flex-1 rounded-3xl bg-gradient-to-br from-blue-100 to-orange-100 min-h-0" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Côté gauche : texte + CTAs */}
        <div className="relative z-10 w-full lg:w-[52%] px-6 md:px-12 lg:px-16">
          <span className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold
                           px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-orange-600 rounded-full" />
            Blog & boutique animaux
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Le compagnon digital des{' '}
            <span className="text-gradient-pet">amoureux des animaux</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-lg mb-10 leading-relaxed">
            Conseils vétérinaires, guides pratiques et produits soigneusement sélectionnés
            pour chiens, chats, oiseaux, rongeurs, reptiles et bien plus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/blog"
              className="bg-orange-700 hover:bg-orange-600 text-white font-semibold px-8 py-4
                         rounded-xl transition-smooth text-base shadow-lg shadow-orange-700/20 focus-ring"
              aria-label="Découvrir nos conseils"
            >
              Découvrir nos conseils
            </Link>
            <Link
              href="#categories"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4
                         rounded-xl transition-smooth text-base focus-ring"
              aria-label="Explorer par type d'animal"
            >
              Explorer par animal
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 lg:left-[26%]">
          <p className="text-xs text-gray-500 font-medium">Scroll pour explorer</p>
          <div className="w-0.5 h-6 bg-gray-300 rounded animate-pulse" />
        </div>

      </section>

      {/* ── DERNIERS ARTICLES ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-orange-700 text-sm font-semibold uppercase tracking-widest">Le blog</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Nos derniers conseils</h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-gray-600 font-medium">Les premiers articles arrivent bientôt !</p>
              <Link href="/blog" className="inline-flex items-center gap-2 mt-4 text-orange-700 font-semibold hover:text-orange-800 focus-ring">
                Voir le blog <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(articles as Article[]).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/blog" className="inline-flex items-center gap-2 text-orange-700 font-semibold hover:text-orange-800 focus-ring">
              Voir tous les articles <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ────────────────────────────────────────────────────── */}
      <section id="categories" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-orange-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-orange-700 text-sm font-semibold uppercase tracking-widest">Explorer</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Par type d'animal</h2>
            <p className="text-gray-600 mt-3 text-lg">Trouvez les conseils adaptés à votre compagnon</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => {
              const imgSrc = catPhotos[cat.id];
              const IconComponent = cat.icon;

              return (
                <Link
                  key={cat.id}
                  href={`/blog/${cat.id}`}
                  className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[3/4] block shadow-md hover:shadow-xl transition-shadow duration-300 focus-ring ${!imgSrc ? cat.color : 'bg-gray-200'}`}
                  aria-label={`Articles sur les ${cat.label}`}
                >
                  {imgSrc && (
                    <Image
                      src={imgSrc}
                      alt={`${cat.label}`}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-smooth"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end text-center pb-4">
                    <IconComponent size={40} className="text-white opacity-90 mb-2" strokeWidth={1.5} />
                    <span className="text-white font-bold text-sm drop-shadow-md">{cat.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── OUTILS ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-orange-700 text-sm font-semibold uppercase tracking-widest">Gratuit</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Outils pratiques</h2>
            <p className="text-gray-500 mt-3 text-base">Calculez, testez et trouvez en quelques secondes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: '/outils/nutrition', icon: UtensilsCrossed, iconBg: 'bg-teal-100',   iconColor: 'text-teal-600',   label: 'Ration journalière',    desc: "Croquettes ou pâtée selon le poids et l'activité." },
              { href: '/outils/age',       icon: Calculator,      iconBg: 'bg-orange-100', iconColor: 'text-orange-600', label: "Calculateur d'âge",      desc: "Âge animal en équivalent humain. Chien, chat, oiseau, rongeur, reptile." },
              { href: '/outils/quiz',      icon: HelpCircle,      iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   label: 'Quel animal pour moi ?', desc: "6 questions pour trouver l'animal idéal selon votre mode de vie." },
              { href: '/outils/prenom',    icon: Sparkles,        iconBg: 'bg-purple-100', iconColor: 'text-purple-600', label: 'Générateur de prénom',   desc: 'Des centaines de suggestions pour votre nouvel animal.' },
              { href: '/guides',           icon: BookOpen,        iconBg: 'bg-green-100',  iconColor: 'text-green-600',  label: 'Guides PDF gratuits',    desc: 'Checklists adoption, alimentation, soins et sécurité.' },
              { href: '/races',            icon: ClipboardList,   iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  label: 'Fiches races',           desc: "Caractère, santé et entretien de chaque race." },
            ].map(({ href, icon: Icon, iconBg, iconColor, label, desc }) => (
              <Link key={href} href={href} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm hover:border-gray-200 transition-all group">
                <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} strokeWidth={1.5} className={iconColor} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-snug">{label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-1">{desc}</p>
                </div>
                <ChevronRight size={14} className={`${iconColor} flex-shrink-0 ml-auto opacity-60 group-hover:opacity-100 transition-opacity`} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADOPTION ──────────────────────────────────────────────────────── */}
      <AdoptionPreviewSection />
      {/* ── PARTENAIRES ───────────────────────────────────────────────────── */}
      <PartenairesSection />
      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section id="newsletter" className="py-20 px-6 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white/20 rounded-full">
              <PawPrint size={40} className="text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Rejoignez notre communauté
          </h2>
          <p className="text-white/90 text-lg mb-10 leading-relaxed">
            Recevez nos meilleurs conseils chaque semaine - conseils vétérinaires,
            astuces éducation et bons plans pour vos animaux.
          </p>
          <NewsletterForm />
          <p className="text-white/70 text-xs mt-6">
            Pas de spam. Désinscription à tout moment sur simple demande. Conformité RGPD.
          </p>
        </div>
      </section>

      {/* ── PUB ───────────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-6">
        <div className="max-w-4xl mx-auto">
          <AdBanner slot="2276363485" />
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-6 border-b border-gray-800">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-600 rounded-lg text-white">
                  <PawPrint size={20} strokeWidth={1.5} />
                </div>
                <span className="font-bold text-white text-lg">Mes Poilus</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
                Conseils vétérinaires, guides pratiques et boutique pour chiens, chats, oiseaux, rongeurs et reptiles.
              </p>
              <div className="flex gap-4 mt-4">
                <a href="https://www.instagram.com/mespoilusofficiel" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-400 transition-colors focus-ring" aria-label="Suivez-nous sur Instagram">Instagram</a>
                <a href="https://www.facebook.com/profile.php?id=61589487954538" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-400 transition-colors focus-ring" aria-label="Suivez-nous sur Facebook">Facebook</a>
                <a href="https://www.pinterest.com/mespoilus_officiel/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-400 transition-colors focus-ring" aria-label="Suivez-nous sur Pinterest">Pinterest</a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Navigation</h3>
              <ul className="space-y-2">
                {[
                  { href: '/blog',                   label: 'Blog'     },
                  { href: '/adoption',               label: 'Adoption' },
                  { href: '/blog?category=chiens',   label: 'Chiens'   },
                  { href: '/blog?category=chats',    label: 'Chats'    },
                  { href: '/blog?category=oiseaux',  label: 'Oiseaux'  },
                  { href: '/blog?category=rongeurs', label: 'Rongeurs' },
                  { href: '/blog?category=reptiles', label: 'Reptiles' },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="text-sm hover:text-orange-400 transition-colors focus-ring">{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Légal</h3>
              <ul className="space-y-2">
                {[
                  { href: '/mentions-legales',          label: 'Mentions légales'             },
                  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
                  { href: '/cgu',                       label: "Conditions d'utilisation"     },
                  { href: '/cookies',                   label: 'Cookies'                      },
                  { href: '/presse',                    label: 'Presse & partenaires'         },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="text-sm hover:text-orange-400 transition-colors focus-ring">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4">
            <p className="text-xs text-gray-500">
              © 2026 Mes Poilus. Tous droits réservés.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant les conditions requises.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Article Card (light version pour landing) ────────────────────────────── */
function ArticleCard({ article }: { article: Article }) {
  const imgSrc = article.image_url ?? null;
  const date = article.published_at
    ? format(new Date(article.published_at), 'd MMM yyyy', { locale: fr })
    : '';

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-200 transition-smooth focus-ring"
      aria-label={`Lire l'article: ${article.title}`}
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200">
        {imgSrc && (
          <Image
            src={imgSrc}
            alt={article.image_alt ?? article.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-smooth"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-3 py-1.5 rounded-full">
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <time dateTime={article.published_at ?? ''}>{date}</time>
          {article.reading_time && <span>{article.reading_time} min de lecture</span>}
        </div>
      </div>
    </Link>
  );
}
