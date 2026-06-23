import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes favoris',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.mespoilus.com/favoris' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
