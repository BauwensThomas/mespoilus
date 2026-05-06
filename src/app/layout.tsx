import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/layout/LayoutShell';
import CookieBanner from '@/components/ui/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AdSense from '@/components/analytics/AdSense';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com'),
  title: {
    default: 'Mes Poilus - Conseils & guides animaux de compagnie',
    template: '%s | Mes Poilus',
  },
  description: "Blog de conseils, guides pratiques et boutique d'accessoires pour vos animaux de compagnie.",
  robots: { index: false, follow: false },
  other: { 'google-adsense-account': 'ca-pub-3549294158319032' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <LayoutShell>{children}</LayoutShell>
        <CookieBanner />
        <GoogleAnalytics />
        <AdSense />
      </body>
    </html>
  );
}
