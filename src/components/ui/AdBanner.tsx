'use client';

import { useEffect, useRef } from 'react';

const PUB_ID = 'ca-pub-3549294158319032';
const CONSENT_KEY = 'mespoilus_cookie_consent';

interface Props {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
}

export default function AdBanner({ slot, format = 'auto', className = '' }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) !== 'accepted') return;
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  if (typeof window !== 'undefined' && localStorage.getItem(CONSENT_KEY) !== 'accepted') {
    return null;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
