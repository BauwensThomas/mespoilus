import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/layout/LayoutShell';
import CookieBanner from '@/components/ui/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AdSense from '@/components/analytics/AdSense';
import PinterestTag from '@/components/analytics/PinterestTag';
import { createAdminClient } from '@/lib/supabase/server';

async function getPendingCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from('adoption_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    return count ?? 0;
  } catch { return 0; }
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL('https://www.mespoilus.com'),
    title: {
      default: 'Mes Poilus - Conseils & guides animaux de compagnie',
      template: '%s | Mes Poilus',
    },
    description: "Conseils vétérinaires, guides pratiques, adoption animaux et boutique pour chiens, chats, oiseaux, rongeurs et reptiles. Communauté francophone.",
    robots: { index: true, follow: true },
    openGraph: {
      siteName: 'Mes Poilus',
      locale: 'fr_FR',
      type: 'website',
    },
    other: {
      'google-adsense-account': 'ca-pub-3549294158319032',
      'google-site-verification': 'RjHr4b1Sf6FfVs0bvOXjkteGNw7xDIHyqxKJZSb0dJ8',
      'msvalidate.01': '8ABCB6EDE93FF1A2E1C99FA1281F33E7',
      ...Sentry.getTraceData(),
    },
  };
}


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pendingCount = await getPendingCount();

  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="p:domain_verify" content="20cb928a2f8bfbb6bd7651b7cafde7de" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://www.mespoilus.com/#organization',
                name: 'Mes Poilus',
                url: 'https://www.mespoilus.com',
                logo: { '@type': 'ImageObject', url: 'https://www.mespoilus.com/icon.svg' },
                sameAs: ['https://www.instagram.com/mespoilusofficiel', 'https://www.facebook.com/mespoilusofficiel'],
              },
              {
                '@type': 'WebSite',
                '@id': 'https://www.mespoilus.com/#website',
                url: 'https://www.mespoilus.com',
                name: 'Mes Poilus',
                description: 'Conseils vétérinaires, guides pratiques, adoption animaux et boutique pour chiens, chats, oiseaux, rongeurs et reptiles.',
                publisher: { '@id': 'https://www.mespoilus.com/#organization' },
                inLanguage: 'fr',
              },
            ],
          })}}
        />
      </head>
      <body className="min-h-screen">
        <LayoutShell pendingCount={pendingCount}>{children}</LayoutShell>
        <CookieBanner />
        <GoogleAnalytics />
        <AdSense />
        <PinterestTag />
      </body>
    </html>
  );
}
