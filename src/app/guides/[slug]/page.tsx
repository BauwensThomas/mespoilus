import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Dog, Cat, Rat, Bird, Shell, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';
import GuideDownloadButton from '@/components/guides/GuideDownloadButton';

interface Props {
  params: { slug: string };
}

interface PdfGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  pages_count: number;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; gradient: string; badge: string; icon: typeof Dog }
> = {
  chiens:   { label: 'Chiens',   gradient: 'from-orange-500 to-orange-700', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: Dog      },
  chats:    { label: 'Chats',    gradient: 'from-pink-500 to-pink-700',     badge: 'bg-pink-100 text-pink-700 border-pink-200',       icon: Cat      },
  rongeurs: { label: 'Rongeurs', gradient: 'from-green-500 to-green-700',   badge: 'bg-green-100 text-green-700 border-green-200',    icon: Rat      },
  oiseaux:  { label: 'Oiseaux',  gradient: 'from-blue-500 to-blue-700',     badge: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Bird     },
  reptiles: { label: 'Reptiles', gradient: 'from-teal-500 to-teal-700',     badge: 'bg-teal-100 text-teal-700 border-teal-200',       icon: Shell    },
  general:  { label: 'Général',  gradient: 'from-purple-500 to-purple-700', badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileText },
};

async function getGuide(slug: string): Promise<PdfGuide | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('pdf_guides')
      .select('id, slug, title, description, category, file_path, pages_count')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();
    return data as PdfGuide | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await getGuide(params.slug);
  if (!guide) return { title: 'Guide introuvable' };

  return {
    title: `${guide.title} — Guide PDF gratuit — Mes Poilus`,
    description: guide.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: `${guide.title} — Guide PDF gratuit`,
      description: guide.description,
      type: 'website',
      url: `/guides/${guide.slug}`,
      siteName: 'Mes Poilus',
      locale: 'fr_FR',
    },
  };
}

/** Extract 3 benefit sentences from the description */
function extractBenefits(description: string): string[] {
  const parts = description
    .split(/[:;,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (parts.length >= 3) return parts.slice(0, 3);

  // Fallback: split into roughly 3 chunks
  const words = description.split(' ');
  const chunk = Math.ceil(words.length / 3);
  return [
    words.slice(0, chunk).join(' '),
    words.slice(chunk, chunk * 2).join(' '),
    words.slice(chunk * 2).join(' '),
  ].filter(Boolean).slice(0, 3);
}

export default async function GuidePage({ params }: Props) {
  const guide = await getGuide(params.slug);
  if (!guide) notFound();

  const cfg = CATEGORY_CONFIG[guide.category] ?? CATEGORY_CONFIG['general'];
  const Icon = cfg.icon;
  const benefits = extractBenefits(guide.description);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-orange-600 transition-colors">Accueil</Link>
          <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
          <Link href="/guides" className="hover:text-orange-600 transition-colors">Guides</Link>
          <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{guide.title}</span>
        </nav>
      </div>

      {/* Hero section */}
      <div className={`bg-gradient-to-br ${cfg.gradient} mt-6 mx-4 md:mx-6 rounded-2xl overflow-hidden`}>
        <div className="max-w-6xl mx-auto px-8 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30">
              <Icon size={13} strokeWidth={2} />
              {cfg.label}
            </span>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30">
              Guide PDF gratuit
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4 max-w-2xl">
            {guide.title}
          </h1>
          <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl mb-8">
            {guide.description}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <GuideDownloadButton
              guide={{ id: guide.id, title: guide.title, slug: guide.slug }}
              className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-semibold px-6 py-3 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-600 shadow-lg"
              label="Télécharger gratuitement"
            />
            <span className="text-white/70 text-sm">
              {guide.pages_count} page{guide.pages_count > 1 ? 's' : ''} · PDF · Gratuit
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="max-w-2xl">
          {/* Benefits */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Ce que vous trouverez dans ce guide</h2>
            <ul className="space-y-3">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} strokeWidth={1.5} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA card */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Prêt à télécharger ?</p>
              <p className="text-sm text-gray-500">
                Entrez votre email pour recevoir ce guide gratuit instantanément.
              </p>
            </div>
            <GuideDownloadButton
              guide={{ id: guide.id, title: guide.title, slug: guide.slug }}
              label="Télécharger gratuitement"
            />
          </div>

          {/* Back link */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <Link
              href="/guides"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors font-medium"
            >
              ← Voir tous les guides
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
