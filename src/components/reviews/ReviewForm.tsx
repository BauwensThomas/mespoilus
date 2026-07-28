'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StarRatingInput from './StarRatingInput';

export default function ReviewForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("Merci d'indiquer votre prénom.");
      return;
    }
    if (rating < 1) {
      setError('Merci de choisir une note.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur, réessayez plus tard.');
        setSending(false);
        return;
      }
      setSent(true);
      setTimeout(() => router.push('/?avis=merci'), 1200);
    } catch {
      setError('Erreur réseau, réessayez plus tard.');
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-green-700 font-medium">Merci pour votre avis ! Il sera visible après validation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-3">
      <h2 className="text-base font-bold text-gray-900">Laisser un avis</h2>

      <div>
        <label htmlFor="review-name" className="block text-sm font-medium text-gray-700 mb-0.5">Prénom</label>
        <input
          id="review-name"
          name="name"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          required
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-0.5">Note</p>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-0.5">
          Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <textarea
          id="review-comment"
          name="comment"
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 150))}
          maxLength={150}
          rows={2}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <p className="text-xs text-gray-400 mt-0.5 text-right">{comment.length}/150</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="w-full sm:w-auto px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {sending ? 'Envoi...' : 'Envoyer mon avis'}
      </button>
    </form>
  );
}
