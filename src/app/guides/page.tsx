import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import GuidesGrid from '@/components/guides/GuidesGrid';
import type { PdfGuide } from '@/lib/guides';
import ClientWrapper from '@/components/animations/ClientWrapper';
import { getMetaOverride } from '@/lib/seo-overrides';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: 'Guides PDF gratuits pour animaux - À télécharger maintenant',
    description:
      'Chien, chat, rongeur, oiseau ou reptile : téléchargez gratuitement nos guides pratiques en PDF. Alimentation, soins, éducation — tout ce qu\'il faut savoir en un fichier.',
    robots: { index: true, follow: true },
    alternates: { canonical: '/guides' },
    openGraph: {
      title: 'Guides PDF gratuits pour animaux - À télécharger maintenant',
      description:
        'Chien, chat, rongeur, oiseau ou reptile : téléchargez gratuitement nos guides pratiques en PDF. Alimentation, soins, éducation.',
      type: 'website',
      url: '/guides',
      siteName: 'Mes Poilus',
      locale: 'fr_FR',
    },
  };
  const override = await getMetaOverride('/guides');
  return {
    ...base,
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.description ? { description: override.description } : {}),
  };
}

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
    <div className="min-h-screen px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header avec animations */}
        <div className="mb-10 text-center fade-up">
          <span className="inline-block text-xs text-orange-600 font-semibold uppercase tracking-widest mb-3 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 animate-pulse">
            Ressources gratuites
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3 glow-text">
            Guides &amp; Checklists gratuits
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Téléchargez nos guides PDF gratuits - entrez simplement votre email
          </p>
          <h2 className="sr-only">Tous nos guides par catégorie</h2>
        </div>

        {guides.length === 0 ? (
          <div className="text-center py-20 bg-orange-50 rounded-3xl border border-orange-100 fade-up">
            <p className="text-gray-600 font-medium text-lg">
              Les premiers guides arrivent bientôt !
            </p>
          </div>
        ) : (
          <GuidesGrid guides={guides} />
        )}
        
        <ClientWrapper />
      </div>
    </div>
  );
}