import Link from 'next/link';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';
import NewsletterForm from '@/components/landing/NewsletterForm';
import AdBanner from '@/components/ui/AdBanner';
import type { Article } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PartenairesSection from '@/components/landing/PartenairesSection';
import AdoptionPreviewSection from '@/components/landing/AdoptionPreviewSection';
import GrilleSection from '@/components/landing/GrilleSection';
import { PawPrint, Dog, Cat, Bird, Mouse, Zap, ChevronRight, UtensilsCrossed, Calculator, HelpCircle, Sparkles, BookOpen, ClipboardList } from 'lucide-react';
import ClientWrapper from '@/components/animations/ClientWrapper';
import ScrollIndicator from '@/components/ui/ScrollIndicator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes Poilus - Conseils animaux, adoption et boutique en ligne',
  description: 'Conseils pratiques pour chiens, chats, oiseaux, rongeurs et reptiles. Trouvez un animal à adopter, explorez la boutique et téléchargez nos guides PDF gratuits.',
  alternates: { canonical: 'https://www.mespoilus.com' },
};

export const revalidate = 3600;

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

    const byType: Record<string, { id: string; url: string; alt: string }[]> = {};
    for (const row of data) {
      const key = ANIMAL_TYPE_MAP[row.animal_type] ?? row.animal_type;
      if (!byType[key]) byType[key] = [];
      byType[key].push({ id: row.id, url: row.url, alt: row.alt });
    }

    // Sélectionne 4 animaux aléatoirement
    const allTypes = Object.keys(byType);
    const shuffled = [...allTypes].sort(() => Math.random() - 0.5);
    const selectedTypes = shuffled.slice(0, 4);

    const selected: (HeroPhoto | null)[] = selectedTypes.map(type => {
      const photos = byType[type];
      if (!photos || photos.length === 0) return null;
      return { url: photos[0].url, alt: photos[0].alt };
    });

    // Si moins de 4 types, complète avec null
    while (selected.length < 4) selected.push(null);

    const selectedIds = HERO_SLOTS
      .map(type => byType[type]?.[0]?.id)
      .filter(Boolean) as string[];
    if (selectedIds.length > 0) {
      await supabase
        .from('hero_photos')
        .update({ last_used_at: new Date().toISOString() })
        .in('id', selectedIds);
    }

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

            {/* ── HERO RESPONSIVE ──────────────────────────────────────────────── */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
        
        {/* Contexte avec dégradé subtil */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-200/20 via-transparent to-transparent" />
        
        {/* Cercles décoratifs flous - cachés sur tablette/mobile */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl hidden xl:block" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl hidden xl:block" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 xl:py-12">
          
          {/* ========== MOBILE/TABLETTE (visible jusqu'à xl = 1280px) ========== */}
          <div className="flex flex-col gap-6 xl:hidden">
            
            {/* TEXTE MOBILE */}
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-2 bg-orange-100/80 backdrop-blur-sm border border-orange-200/50 rounded-full px-3 py-1 mb-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-600" />
                </span>
                <span className="text-[11px] font-medium text-orange-700">Blog & boutique</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
                Le compagnon digital des
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                  amoureux des animaux
                </span>
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-5 leading-relaxed">
                Conseils, guides pratiques et produits pour chiens, chats, oiseaux, rongeurs et reptiles.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link href="/blog" className="inline-flex items-center justify-center gap-1 px-4 py-2.5 text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg font-semibold text-xs shadow-md hover:scale-105 transition-all duration-300">
                  Découvrir
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="#categories" className="inline-flex items-center justify-center gap-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg font-semibold text-xs hover:border-orange-300 hover:bg-orange-50 hover:scale-105 transition-all duration-300">
                  Explorer
                </Link>
              </div>
            </div>

            {/* GRILLE 2x2 MOBILE */}
            <div className="grid grid-cols-2 gap-2 max-w-[280px] mx-auto w-full">
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md group transform -rotate-3 hover:rotate-0 transition-all duration-300">
                {heroPhotos[0] ? <Image src={heroPhotos[0].url} alt={heroPhotos[0].alt} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="40vw" /> : <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-200" />}
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md group transform rotate-3 hover:rotate-0 transition-all duration-300">
                {heroPhotos[1] ? <Image src={heroPhotos[1].url} alt={heroPhotos[1].alt} fill priority className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="40vw" /> : <div className="w-full h-full bg-gradient-to-br from-orange-300 to-amber-300" />}
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md group transform -rotate-2 hover:rotate-0 transition-all duration-300">
                {heroPhotos[2] ? <Image src={heroPhotos[2].url} alt={heroPhotos[2].alt} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="40vw" /> : <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-200" />}
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md group transform rotate-2 hover:rotate-0 transition-all duration-300">
                {heroPhotos[3] ? <Image src={heroPhotos[3].url} alt={heroPhotos[3].alt} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="40vw" /> : <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-200" />}
              </div>
            </div>
          </div>

          {/* ========== DESKTOP (visible à partir de xl = 1280px) ========== */}
          <div className="hidden xl:grid xl:grid-cols-2 gap-12 2xl:gap-16 items-center">
            
            {/* COLONNE GAUCHE - TEXTE */}
            <div className="text-center xl:text-left">
              <div className="inline-flex items-center gap-2 bg-orange-100/80 backdrop-blur-sm border border-orange-200/50 rounded-full px-4 py-1.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
                </span>
                <span className="text-sm font-medium text-orange-700">Blog & boutique animaux</span>
              </div>
              <p className="text-5xl 2xl:text-6xl font-bold tracking-tight text-gray-900 mb-6" aria-hidden="true">
                Le compagnon digital des
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                  amoureux des animaux
                </span>
              </p>
              <p className="text-lg text-gray-600 max-w-xl mx-auto xl:mx-0 mb-8 leading-relaxed">
                Conseils vétérinaires, guides pratiques et produits sélectionnés pour chiens, chats, oiseaux, rongeurs, reptiles et bien plus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center xl:justify-start">
                <Link href="/blog" className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl font-semibold shadow-lg shadow-orange-500/25 hover:scale-105 transition-all duration-300">
                  Découvrir nos conseils
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="#categories" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-gray-700 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:border-orange-300 hover:bg-orange-50 hover:scale-105 transition-all duration-300">
                  Explorer par animal
                </Link>
              </div>
            </div>

            {/* COLONNE DROITE - IMAGES MOSAÏQUE */}
            <div className="relative w-full max-w-md mx-auto xl:max-w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] w-full">
                {heroPhotos[1] ? (
                  <Image src={heroPhotos[1].url} alt={heroPhotos[1].alt} fill priority className="object-cover" sizes="(max-width: 1280px) 50vw, 40vw" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 2xl:-bottom-8 2xl:-left-8 w-28 h-28 2xl:w-36 2xl:h-36 rounded-xl overflow-hidden shadow-lg border-4 border-white rotate-[-8deg] group">
                {heroPhotos[0] ? <Image src={heroPhotos[0].url} alt={heroPhotos[0].alt} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="15vw" /> : <div className="w-full h-full bg-gradient-to-br from-orange-300 to-amber-300" />}
              </div>
              <div className="absolute -top-6 -right-6 2xl:-top-8 2xl:-right-8 w-24 h-24 2xl:w-32 2xl:h-32 rounded-xl overflow-hidden shadow-lg border-4 border-white rotate-[12deg] group">
                {heroPhotos[2] ? <Image src={heroPhotos[2].url} alt={heroPhotos[2].alt} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="15vw" /> : <div className="w-full h-full bg-gradient-to-br from-amber-300 to-orange-300" />}
              </div>
              <div className="absolute bottom-8 -right-8 2xl:bottom-12 2xl:-right-10 w-20 h-20 2xl:w-28 2xl:h-28 rounded-xl overflow-hidden shadow-lg border-4 border-white rotate-[6deg] group">
                {heroPhotos[3] ? <Image src={heroPhotos[3].url} alt={heroPhotos[3].alt} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="15vw" /> : <div className="w-full h-full bg-gradient-to-br from-orange-300 to-amber-300" />}
              </div>
            </div>
          </div>
        </div>

      </section>
      
      {/* ── DERNIERS ARTICLES ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white reveal-color">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">Le blog</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Nos derniers conseils</h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-orange-50 rounded-2xl border border-orange-100 fade-up">
              <p className="text-gray-600 font-medium">Les premiers articles arrivent bientôt !</p>
              <Link href="/blog" className="inline-flex items-center gap-2 mt-4 text-orange-600 font-semibold hover:text-orange-500 focus-ring">
                Voir le blog <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-container">
              {(articles as Article[]).map((article) => (
                <div key={article.id} className="stagger-child">
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10 fade-up">
            <Link href="/blog" className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-500 focus-ring">
              Voir tous les articles <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ────────────────────────────────────────────────────── */}
      <section id="categories" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-orange-50 reveal-color">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">Explorer</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Par type d'animal</h2>
            <p className="text-gray-600 mt-3 text-lg">Trouvez les conseils adaptés à votre compagnon</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 stagger-container">
            {CATEGORIES.map((cat) => {
              const imgSrc = catPhotos[cat.id];
              const IconComponent = cat.icon;

              return (
                <Link
                  key={cat.id}
                  href={`/blog/${cat.id}`}
                  className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[3/4] block shadow-md hover:shadow-xl transition-shadow duration-300 focus-ring stagger-child ${!imgSrc ? cat.color : 'bg-gray-200'}`}
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
                    <IconComponent size={40} className="text-white opacity-90 mb-2 rotate-icon" strokeWidth={1.5} />
                    <span className="text-white font-bold text-sm drop-shadow-md">{cat.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── OUTILS ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white reveal-color">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 fade-up">
            <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">Gratuit</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Outils pratiques</h2>
            <p className="text-gray-500 mt-3 text-base">Calculez, testez et trouvez en quelques secondes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-container">
            {[
              { href: '/outils/nutrition', icon: UtensilsCrossed, iconBg: 'bg-teal-100',   iconColor: 'text-teal-600',   label: 'Ration journalière',    desc: "Croquettes ou pâtée selon le poids et l'activité." },
              { href: '/outils/age',       icon: Calculator,      iconBg: 'bg-orange-100', iconColor: 'text-orange-600', label: "Calculateur d'âge",      desc: "Âge animal en équivalent humain. Chien, chat, oiseau, rongeur, reptile." },
              { href: '/outils/quiz',      icon: HelpCircle,      iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   label: 'Quel animal pour moi ?', desc: "6 questions pour trouver l'animal idéal selon votre mode de vie." },
              { href: '/outils/prenom',    icon: Sparkles,        iconBg: 'bg-purple-100', iconColor: 'text-purple-600', label: 'Générateur de prénom',   desc: 'Des centaines de suggestions pour votre nouvel animal.' },
              { href: '/guides',           icon: BookOpen,        iconBg: 'bg-green-100',  iconColor: 'text-green-600',  label: 'Guides PDF gratuits',    desc: 'Checklists adoption, alimentation, soins et sécurité.' },
              { href: '/races',            icon: ClipboardList,   iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  label: 'Fiches races',           desc: "Caractère, santé et entretien de chaque race." },
            ].map(({ href, icon: Icon, iconBg, iconColor, label, desc }) => (
              <Link key={href} href={href} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 transition-all group flip-card stagger-child">
                <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 rotate-icon`}>
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

      {/* ── GRILLE MYSTÈRE ────────────────────────────────────────────────── */}
      <div className="reveal-color">
        <GrilleSection />
      </div>
      
      {/* ── ADOPTION ──────────────────────────────────────────────────────── */}
      <div className="reveal-color">
        <AdoptionPreviewSection />
      </div>
      
      {/* ── PARTENAIRES ───────────────────────────────────────────────────── */}
      <div className="reveal-color">
        <PartenairesSection />
      </div>
      
      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section id="newsletter" className="py-20 px-6 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 reveal-color">
        <div className="max-w-2xl mx-auto text-center bounce-in">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white/20 rounded-full">
              <PawPrint size={40} className="text-white rotate-icon" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 glow-text">
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
      <div className="bg-gray-900 px-6 reveal-color">
        <div className="max-w-4xl mx-auto">
          <AdBanner slot="2276363485" />
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-6 border-b border-gray-800">
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
                <a href="https://www.instagram.com/mespoilusofficiel" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Instagram</a>
                <a href="https://www.facebook.com/profile.php?id=61589487954538" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Facebook</a>
                <a href="https://www.pinterest.com/mespoilus_officiel/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Pinterest</a>
              </div>
            </div>

            <div>
              <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Navigation</h3>
              <ul className="space-y-2">
                {[
                  { href: '/blog', label: 'Blog' },
                  { href: '/boutique', label: 'Boutique' },
                  { href: '/races', label: 'Races' },
                  { href: '/outils', label: 'Outils' },
                  { href: '/grille', label: 'Grille Mystère' },
                  { href: '/soutenir', label: 'Soutenir Mes Poilus' },
                  { href: '/adoption', label: 'Adoption' },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="text-sm hover:text-orange-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Catégories</h3>
              <ul className="space-y-2">
                {[
                  { href: '/blog/chiens', label: 'Chiens' },
                  { href: '/blog/chats', label: 'Chats' },
                  { href: '/blog/oiseaux', label: 'Oiseaux' },
                  { href: '/blog/rongeurs', label: 'Rongeurs' },
                  { href: '/blog/reptiles', label: 'Reptiles' },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="text-sm hover:text-orange-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Légal</h3>
              <ul className="space-y-2">
                {[
                  { href: '/mentions-legales', label: 'Mentions légales' },
                  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
                  { href: '/cgu', label: "Conditions d'utilisation" },
                  { href: '/cookies', label: 'Cookies' },
                  { href: '/presse', label: 'Presse & partenaires' },
                  { href: '/a-propos', label: 'À propos' },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="text-sm hover:text-orange-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4">
            <p className="text-xs text-gray-500">© 2026 Mes Poilus. Tous droits réservés.</p>
            <p className="text-xs text-gray-600 mt-1">En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats remplissant les conditions requises.</p>
          </div>
        </div>
      </footer>
      
      <ClientWrapper />
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const imgSrc = article.image_url ?? null;
  const date = article.published_at
    ? format(new Date(article.published_at), 'd MMM yyyy', { locale: fr })
    : '';

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-200 transition-smooth focus-ring glow-on-hover"
      aria-label={`Lire l'article: ${article.title}`}
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 image-reveal">
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