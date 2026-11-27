'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Pas de statistiques sur les pages d'administration (mêmes règles que AnalyticsPublic)
const ADMIN_PATH = /^\/(?:dashboard|agents|orchestrate|login)(?:\/|$)|^\/[a-z-]+-admin(?:\/|$)/;

const GA_ID = 'G-QE9XSS18YQ';
const CONSENT_KEY = 'mespoilus_cookie_consent';

export default function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
  const check = () => {
    setConsented(localStorage.getItem(CONSENT_KEY) === 'accepted');
  };
  check();

  // Écoute un événement custom depuis CookieBanner
  window.addEventListener('cookie-consent-updated', check);
  window.addEventListener('storage', check);
  return () => {
    window.removeEventListener('cookie-consent-updated', check);
    window.removeEventListener('storage', check);
  };
}, []);

  if (!consented || ADMIN_PATH.test(pathname ?? '')) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
