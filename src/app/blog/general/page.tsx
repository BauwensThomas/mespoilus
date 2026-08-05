import type { Metadata } from 'next';
import { CategoryPageContent, CATEGORY_META } from '../_category-page';
import { getMetaOverride } from '@/lib/seo-overrides';

const meta = CATEGORY_META.general;

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: meta.title,
    description: meta.description,
    robots: { index: true, follow: true },
    alternates: { canonical: '/blog/general' },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      url: '/blog/general',
      siteName: 'Mes Poilus',
      locale: 'fr_FR',
    },
    twitter: { card: 'summary', title: meta.title, description: meta.description },
  };
  const override = await getMetaOverride('/blog/general');
  return {
    ...base,
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.description ? { description: override.description } : {}),
  };
}

export const revalidate = 3600;

export default async function GeneralPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <CategoryPageContent category="general" search={q?.trim()} />;
}
