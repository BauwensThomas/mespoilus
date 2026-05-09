import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { Dog, Cat, Rat, Bird, Shell, FileText } from 'lucide-react';
import GuidesGrid from '@/components/guides/GuidesGrid';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Guides & Checklists gratuits — Mes Poilus',
  description:
    'Téléchargez nos guides PDF gratuits sur les animaux de compagnie : chiens, chats, rongeurs, oiseaux, reptiles. Entrez simplement votre email.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Guides & Checklists PDF gratuits — Mes Poilus',
    description:
      'Guides pratiques en PDF pour bien s\'occuper de votre animal : adoption, alimentation, soins, sécurité.',
    type: 'website',
    url: '/guides',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
};

export interface PdfGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  pages_count: number;
}

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; badge: string; icon: typeof Dog }
> = {
  chiens:   { label: 'Chiens',   color: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700 border-orange-200',  icon: Dog      },
  chats:    { label: 'Chats',    color: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700 border-pink-200',        icon: Cat      },
  rongeurs: { label: 'Rongeurs', color: 'text-green-600',   badge: 'bg-green-100 text-green-700 border-green-200',     icon: Rat      },
  oiseaux:  { label: 'Oiseaux',  color: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700 border-blue-200',        icon: Bird     },
  reptiles: { label: 'Reptiles', color: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700 border-teal-200',        icon: Shell    },
  general:  { label: 'Général',  color: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700 border-purple-200',  icon: FileText },
};

async function getGuides(): Promise<PdfGuide[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('pdf_guides')
      .select('id, slug, title, description, category, file_path, pages_count')
      .eq('active', true)
      .order('created_at', { ascending: false });
    return (data as PdfGuide[]) ?? [];
  } catch {
    return [];
  }
}

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-block text-xs text-orange-600 font-semibold uppercase tracking-widest mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            Ressources gratuites
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Guides &amp; Checklists gratuits
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Téléchargez nos guides PDF gratuits — entrez simplement votre email
          </p>
        </div>

        {guides.length === 0 ? (
          <div className="text-center py-20 bg-orange-50 rounded-3xl border border-orange-100">
            <p className="text-gray-600 font-medium text-lg">
              Les premiers guides arrivent bientôt !
            </p>
          </div>
        ) : (
          <GuidesGrid guides={guides} />
        )}
      </div>
    </div>
  );
}
