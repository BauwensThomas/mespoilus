import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import GuidesGrid from '@/components/guides/GuidesGrid';
import type { PdfGuide } from '@/lib/guides';

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
