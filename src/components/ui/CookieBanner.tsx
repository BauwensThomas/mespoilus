'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, CheckCircle2 } from 'lucide-react';

const CONSENT_KEY = 'mespoilus_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    window.dispatchEvent(new Event('cookie-consent-updated'));
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem(CONSENT_KEY, 'refused');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 md:p-6 bg-black/20 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">

        {/* Icon - caché sur mobile */}
        <div className="hidden md:flex flex-shrink-0 p-3 bg-orange-100 rounded-xl">
          <Cookie size={24} className="text-orange-600" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-sm md:text-base mb-1">Nous respectons votre confidentialité</h3>
          <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
            Nous utilisons des cookies essentiels et, avec votre accord, des cookies analytiques.{' '}
            <Link href="/cookies" className="text-orange-600 font-medium hover:text-orange-700 underline">
              En savoir plus
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={refuse}
            className="flex-1 md:flex-initial px-4 py-2 text-xs md:text-sm font-medium text-gray-700 border border-gray-300 rounded-xl transition-all"
            aria-label="Refuser les cookies"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="flex-1 md:flex-initial px-5 py-2 text-xs md:text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all flex items-center justify-center gap-1.5"
            aria-label="Accepter les cookies"
          >
            <CheckCircle2 size={14} strokeWidth={1.5} />
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
