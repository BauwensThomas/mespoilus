'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';

interface Subscriber {
  email: string;
  newsletterId: string;
  newsletter: boolean;
  grille: boolean;
  adoption: boolean;
  commentaire: boolean;
  source: string;
  created_at: string;
}

type Action = 'newsletter' | 'grille' | 'adoption' | 'commentaire';

const COLS: { key: Exclude<keyof Subscriber, 'email' | 'newsletterId' | 'source' | 'created_at'>; label: string; color: string; bg: string }[] = [
  { key: 'newsletter',  label: 'Newsletter',    color: 'text-green-600',  bg: 'bg-green-100' },
  { key: 'grille',      label: 'Grille',        color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'adoption',    label: 'Adoption',      color: 'text-blue-600',   bg: 'bg-blue-100' },
  { key: 'commentaire', label: 'Commentaires',  color: 'text-purple-600', bg: 'bg-purple-100' },
];

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

  const LABELS: Record<Action, string> = {
    newsletter: 'Désabonner de la newsletter',
    grille: 'Anonymiser les données grille (RGPD)',
    adoption: 'Anonymiser l\'email des annonces adoption (RGPD)',
    commentaire: 'Anonymiser l\'email des commentaires (RGPD)',
  };

  async function handleDelete(sub: Subscriber, action: Action) {
    const confirmMsg = action === 'newsletter'
      ? `Désabonner "${sub.email}" de la newsletter ?`
      : `Anonymiser "${sub.email}" dans ${action} ? (l'enregistrement est conservé, l'email est effacé)`;
    if (!confirm(confirmMsg)) return;

    const key = sub.email + '-' + action;
    setDeleting(key);
    try {
      await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'newsletter'
            ? { action, id: sub.newsletterId }
            : { action, email: sub.email }
        ),
      });
      // Met à jour la ligne ; retire la ligne si plus aucune source
      setSubscribers(prev =>
        prev.map(s => {
          if (s.email !== sub.email) return s;
          const updated = { ...s, [action]: false };
          if (action === 'newsletter') updated.newsletterId = '';
          return updated;
        }).filter(s => s.newsletter || s.grille || s.adoption || s.commentaire)
      );
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  }

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.trim().toLowerCase())
  );

  const counts = {
    newsletter: subscribers.filter(s => s.newsletter).length,
    grille: subscribers.filter(s => s.grille).length,
    adoption: subscribers.filter(s => s.adoption).length,
    commentaire: subscribers.filter(s => s.commentaire).length,
  };

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Emails du site</h1>
          <p className="text-gray-500 text-base mt-1">
            <span className="font-medium text-green-600">{counts.newsletter}</span> newsletter ·{' '}
            <span className="font-medium text-orange-600">{counts.grille}</span> grille ·{' '}
            <span className="font-medium text-blue-600">{counts.adoption}</span> adoption ·{' '}
            <span className="font-medium text-purple-600">{counts.commentaire}</span> commentaires
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un email…"
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-64"
          />
        </div>
      </div>

      {/* Légende */}
      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 leading-relaxed">
        Chaque source est <strong>indépendante</strong>. La <Trash2 size={11} className="inline text-red-500" /> rouge sous chaque ✓ retire l'email de cette source uniquement : la newsletter est supprimée, les autres (grille, adoption, commentaires) sont <strong>anonymisées</strong> (l'enregistrement reste, l'email est effacé — RGPD).
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} strokeWidth={1.5} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{search ? 'Aucun résultat' : 'Aucun email enregistré'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Email</th>
                {COLS.map(c => (
                  <th key={c.key} className="text-center px-4 py-3 text-xs font-semibold text-gray-500">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s, i) => (
                <tr key={s.email + i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.email}</td>
                  {COLS.map(c => {
                    const active = s[c.key];
                    const canDelete = active && (c.key !== 'newsletter' || s.newsletterId);
                    const key = s.email + '-' + c.key;
                    return (
                      <td key={c.key} className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {active
                            ? <span className={clsx('inline-block w-5 h-5 rounded-full text-xs font-bold leading-5', c.bg, c.color)}>✓</span>
                            : <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs font-bold leading-5">—</span>}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(s, c.key as Action)}
                              disabled={deleting === key}
                              title={LABELS[c.key as Action]}
                              className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              {deleting === key
                                ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                                : <Trash2 size={12} strokeWidth={1.5} />}
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
