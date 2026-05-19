'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';

const CONSENT_KEY = 'mespoilus_cookie_consent';

export default function PinterestTag() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => setConsented(localStorage.getItem(CONSENT_KEY) === 'accepted');
    check();
    window.addEventListener('cookie-consent-updated', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('cookie-consent-updated', check);
      window.removeEventListener('storage', check);
    };
  }, []);

  if (!consented) return null;

  return (
    <Script
      id="pinterest-tag"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `!function(e){if(!window.pintrk){window.pintrk = function () {
          window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
          n=window.pintrk;n.queue=[],n.version="3.0";var
          t=document.createElement("script");t.async=!0;t.src=e;var
          r=document.getElementsByTagName("script")[0];
          r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
          pintrk('load', '2614006217840', {em: ''});
          pintrk('page');
          pintrk('track', 'pagevisit', { event_id: 'eventId0001' });`,
      }}
    />
  );
}
