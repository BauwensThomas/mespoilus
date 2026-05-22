import type { Metadata } from 'next';
import { CategoryPageContent, CATEGORY_META } from '../_category-page';

const meta = CATEGORY_META.chiens;

export const metadata: Metadata = {
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

export const revalidate = 3600;

export default async function ChiensPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <CategoryPageContent category="chiens" search={q?.trim()} />;
}
