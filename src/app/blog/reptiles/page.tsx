import type { Metadata } from 'next';
import { CategoryPageContent, CATEGORY_META } from '../_category-page';

const meta = CATEGORY_META.reptiles;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  robots: { index: true, follow: true },
  alternates: { canonical: '/blog/reptiles' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: 'website',
    url: '/blog/reptiles',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
  twitter: { card: 'summary', title: meta.title, description: meta.description },
};

export const revalidate = 60;

export default function ReptilesPage() {
  return <CategoryPageContent category="reptiles" />;
}
