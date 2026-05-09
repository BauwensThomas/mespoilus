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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-black/20 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Icon */}
        <div className="flex-shrink-0 p-3 bg-orange-100 rounded-xl">
          <Cookie size={24} className="text-orange-600" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-base mb-2">Nous respectons votre confidentialité</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Nous utilisons des cookies essentiels (fonctionnement du site) et, avec votre accord, des cookies analytiques (Google Analytics) pour améliorer votre expérience.{' '}
            <Link href="/cookies" className="text-orange-600 font-medium hover:text-orange-700 underline">
              En savoir plus
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={refuse}
            className="flex-1 md:flex-initial px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            aria-label="Refuser les cookies"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="flex-1 md:flex-initial px-6 py-2.5 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 flex items-center justify-center gap-2"
            aria-label="Accepter les cookies"
          >
            <CheckCircle2 size={16} strokeWidth={1.5} />
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
