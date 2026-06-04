'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Subscriber {
  id: string;
  email: string;
  first_name: string;
  status: string;
  source: string;
  created_at: string;
  newsletter: boolean;
  grille: boolean;
}

export default function AbonnesAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/subscribers');
      const data = await r.json();
      setSubscribers(data.subscribers ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(sub: Subscriber) {
    if (!sub.id) return;
    if (!confirm(`Supprimer l'abonné "${sub.email}" de la newsletter ?`)) return;
    setDeleting(sub.id);
    try {
      await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id }),
      });
      setSubscribers(prev => prev.filter(s => s.id !== sub.id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  }

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.trim().toLowerCase()) ||
    s.first_name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const nbNewsletter = subscribers.filter(s => s.newsletter).length;
  const nbGrille = subscribers.filter(s => s.grille).length;

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Abonnés</h1>
          <p className="text-gray-500 text-base mt-1">
            {nbNewsletter} newsletter · {nbGrille} grille
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher email ou prénom…"
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-64"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} strokeWidth={1.5} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{search ? 'Aucun résultat' : 'Aucun abonné'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Prénom</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Newsletter</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Grille</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s, i) => (
                <tr key={s.id || s.email + i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.first_name || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {s.newsletter
                      ? <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold leading-5">✓</span>
                      : <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs font-bold leading-5">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.grille
                      ? <span className="inline-block w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold leading-5">✓</span>
                      : <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs font-bold leading-5">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.source
                      ? <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                          s.source === 'grille' ? 'bg-orange-50 text-orange-600' :
                          s.source === 'newsletter' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        )}>{s.source}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {s.created_at ? format(new Date(s.created_at), 'd MMM yyyy', { locale: fr }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.newsletter && s.id && (
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={deleting === s.id}
                        title="Supprimer de la newsletter"
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleting === s.id
                          ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 size={14} strokeWidth={1.5} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        La suppression retire l'abonné de la newsletter. Les acheteurs de la grille (sans newsletter) apparaissent en lecture seule.
      </p>
    </div>
  );
}
