'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function CommentForm({ slug }: { slug: string }) {
  const [name, setName]       = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/comments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_slug: slug, author_name: name, content }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      setDone(true);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="font-semibold text-green-800 text-sm">Commentaire envoyé !</p>
        <p className="text-green-700 text-xs mt-1">Il sera visible après modération.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={16} strokeWidth={1.5} className="text-orange-600" />
        <span className="font-semibold text-gray-900 text-sm">Laisser un commentaire</span>
      </div>
      <input
        type="text"
        required
        placeholder="Votre prénom *"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={50}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      />
      <textarea
        required
        placeholder="Votre commentaire *"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        maxLength={1000}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Votre commentaire sera visible après modération.</p>
        <div className="flex items-center gap-3">
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Envoi…' : 'Publier'}
          </button>
        </div>
      </div>
    </form>
  );
}
