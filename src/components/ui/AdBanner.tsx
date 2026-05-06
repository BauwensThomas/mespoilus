'use client';

import { useEffect, useRef, useState } from 'react';

const PUB_ID = 'ca-pub-3549294158319032';
const CONSENT_KEY = 'mespoilus_cookie_consent';

interface Props {
  slot: string;
  variant?: 'display' | 'in-article';
  className?: string;
}

export default function AdBanner({ slot, variant = 'display', className = '' }: Props) {
  const pushed = useRef(false);
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

  useEffect(() => {
    if (!consented || pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, [consented]);

  if (!consented) return null;

  if (variant === 'in-article') {
    return (
      <div className={className}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={PUB_ID}
          data-ad-slot={slot}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
