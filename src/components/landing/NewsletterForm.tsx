'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_page' }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
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

  if (status === 'success') {
    return (
      <div className="text-center py-6 px-6 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
        <CheckCircle2 size={40} className="text-white mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-white font-semibold text-lg">Merci pour votre inscription !</p>
        <p className="text-white/80 text-sm mt-2">Vous recevrez nos prochains conseils dans votre boîte mail.</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="flex-1 relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          <input
            id="newsletter-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="votre@email.com"
            aria-label="Adresse email pour la newsletter"
            className="w-full bg-white/20 border border-white/50 rounded-xl pl-12 pr-4 py-3.5 text-white
                       placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/25 focus:ring-2 focus:ring-white/30
                       transition-all duration-200 text-sm font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          aria-label="S'inscrire à la newsletter"
          className="bg-white text-orange-600 font-semibold px-8 py-3.5 rounded-xl text-sm
                     hover:bg-orange-50 active:bg-orange-100 transition-colors duration-200
                     disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap shadow-lg hover:shadow-xl
                     focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-500"
        >
          {status === 'loading' ? 'Inscription…' : "Je m'inscris"}
        </button>
      </form>
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-200 text-xs text-center mt-3 px-4 py-2 bg-red-500/20 rounded-lg border border-red-300/30 mx-auto max-w-md">
          <AlertCircle size={16} className="flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
