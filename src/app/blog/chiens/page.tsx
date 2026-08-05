import type { Metadata } from 'next';
import { CategoryPageContent, CATEGORY_META } from '../_category-page';
import { getMetaOverride } from '@/lib/seo-overrides';

const meta = CATEGORY_META.chiens;

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: meta.title,
    description: meta.description,
    robots: { index: true, follow: true },
    alternates: { canonical: '/blog/chiens' },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      url: '/blog/chiens',
      siteName: 'Mes Poilus',
      locale: 'fr_FR',
    },
    twitter: { card: 'summary', title: meta.title, description: meta.description },
  };
  const override = await getMetaOverride('/blog/chiens');
  return {
    ...base,
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.description ? { description: override.description } : {}),
  };
}

export const revalidate = 3600;

export default async function ChiensPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <CategoryPageContent category="chiens" search={q?.trim()} />;
}
