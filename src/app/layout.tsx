import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/layout/LayoutShell';
import CookieBanner from '@/components/ui/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AdSense from '@/components/analytics/AdSense';
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
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com'),
    title: {
      default: 'Mes Poilus - Conseils & guides animaux de compagnie',
      template: '%s | Mes Poilus',
    },
    description: "Blog de conseils, guides pratiques et boutique d'accessoires pour vos animaux de compagnie.",
    robots: { index: false, follow: false },
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
    <html lang="fr">
      <head>
        <meta name="p:domain_verify" content="20cb928a2f8bfbb6bd7651b7cafde7de" />
        {/* Pinterest Tag */}
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(e){if(!window.pintrk){window.pintrk = function () {
                window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
                n=window.pintrk;n.queue=[],n.version="3.0";var
                t=document.createElement("script");t.async=!0;t.src=e;var
                r=document.getElementsByTagName("script")[0];
                r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
                pintrk('load', '2614006217840', {em: ''}); // Renseignez l'email utilisateur ou son hash SHA256 ici
                pintrk('page');
                pintrk('track', 'pagevisit', { event_id: 'eventId0001' });`
            }}
          />
        <noscript>
          <img height="1" width="1" style={{display:'none'}} alt=""
            src="https://ct.pinterest.com/v3/?event=init&tid=2614006217840&pd[em]=&noscript=1" />
        </noscript>
        {/* end Pinterest Tag */}
      </head>
      <body className="min-h-screen">
        <LayoutShell pendingCount={pendingCount}>{children}</LayoutShell>
        <CookieBanner />
        <GoogleAnalytics />
        <AdSense />
      </body>
    </html>
  );
}
