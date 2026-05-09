'use client';

import { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface GuideDownloadModalProps {
  guide: { id: string; title: string; slug: string };
  onClose: () => void;
}

export default function GuideDownloadModal({ guide, onClose }: GuideDownloadModalProps) {
  const [email, setEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/guides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          guide_id: guide.id,
          newsletter_consent: newsletterConsent,
        }),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Une erreur est survenue.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Une erreur est survenue. Veuillez réessayer.');
      setStatus('error');
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
          aria-label="Fermer"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {status === 'sent' ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-600" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Vérifiez votre boîte mail — le lien de téléchargement est valable{' '}
              <span className="font-semibold text-gray-800">24h</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
            >
              Fermer
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Download size={16} strokeWidth={1.5} className="text-orange-600" />
                </div>
                <span className="text-xs text-orange-600 font-semibold uppercase tracking-widest">Guide PDF gratuit</span>
              </div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900 leading-tight">
                {guide.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Entrez votre email pour recevoir le guide par mail.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email input */}
              <div>
                <label htmlFor="guide-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="guide-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Newsletter consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors leading-relaxed">
                  J&apos;accepte de recevoir la newsletter Mes Poilus{' '}
                  <span className="text-gray-400">(optionnel)</span>
                </span>
              </label>

              {/* RGPD notice */}
              <p className="text-xs text-gray-400 leading-relaxed">
                Votre email est utilisé uniquement pour vous envoyer ce guide.{' '}
                <a
                  href="/politique-confidentialite"
                  className="underline hover:text-orange-600 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir notre politique de confidentialité.
                </a>
              </p>

              {/* Error message */}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Mail size={16} strokeWidth={2} />
                    Recevoir le guide par email
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
