'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';

const PUB_ID = 'ca-pub-3549294158319032';
const CONSENT_KEY = 'mespoilus_cookie_consent';

export default function AdSense() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => setConsented(localStorage.getItem(CONSENT_KEY) === 'accepted');
    check();
    window.addEventListener('storage', check);
    window.addEventListener('cookie-consent-updated', check);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('cookie-consent-updated', check);
    };
  }, []);

  if (!consented) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
