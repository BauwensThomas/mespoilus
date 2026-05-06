'use client';

import { useState } from 'react';

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
      <div className="text-center py-4">
        <div className="text-3xl mb-3">🎉</div>
        <p className="text-white font-semibold text-lg">Merci pour votre inscription !</p>
        <p className="text-amber-200/80 text-sm mt-1">Vous recevrez nos prochains conseils dans votre boîte mail.</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="votre@email.com"
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white
                     placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/15
                     transition-all duration-150 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-white text-amber-700 font-semibold px-6 py-3 rounded-xl text-sm
                     hover:bg-amber-50 active:bg-amber-100 transition-colors duration-150
                     disabled:opacity-70 whitespace-nowrap"
        >
          {status === 'loading' ? 'Inscription…' : "Je m'inscris"}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-300 text-xs text-center mt-2">{errorMsg}</p>
      )}
    </div>
  );
}
