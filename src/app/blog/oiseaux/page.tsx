import type { Metadata } from 'next';
import { CategoryPageContent, CATEGORY_META } from '../_category-page';

const meta = CATEGORY_META.oiseaux;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  robots: { index: true, follow: true },
  alternates: { canonical: '/blog/oiseaux' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: 'website',
    url: '/blog/oiseaux',
    siteName: 'Mes Poilus',
    locale: 'fr_FR',
  },
  twitter: { card: 'summary', title: meta.title, description: meta.description },
};

export const revalidate = 60;

export default function OiseauxPage() {
  return <CategoryPageContent category="oiseaux" />;
}
