import type { Metadata } from 'next';
import { CategoryPageContent, CATEGORY_META } from '../_category-page';

const meta = CATEGORY_META.rongeurs;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  robots: { index: true, follow: true },
  alternates: { canonical: '/blog/rongeurs' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: 'website',
    url: '/blog/rongeurs',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
  twitter: { card: 'summary', title: meta.title, description: meta.description },
};

export const revalidate = 60;

export default function RongeursPage({ searchParams }: { searchParams: { q?: string } }) {
  return <CategoryPageContent category="rongeurs" search={searchParams.q?.trim()} />;
}
