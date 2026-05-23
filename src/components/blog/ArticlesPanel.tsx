'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Search, X } from 'lucide-react';
import DeleteArticleButton from './DeleteArticleButton';

export type ArticleItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  published_at: string | null;
  status: string;
  reading_time: number | null;
  image_url: string | null;
};

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'chiens', label: 'Chiens' },
  { value: 'chats', label: 'Chats' },
  { value: 'oiseaux', label: 'Oiseaux' },
  { value: 'rongeurs', label: 'Rongeurs' },
  { value: 'reptiles', label: 'Reptiles' },
  { value: 'general', label: 'Général' },
];

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  articles: ArticleItem[];
  deleteAction: (formData: FormData) => Promise<void>;
}

export default function ArticlesPanel({ articles, deleteAction }: Props) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');

  const filtered = articles.filter(a => {
    const matchCat = !cat || a.category === cat;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.slug.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="space-y-3">
        {/* Recherche */}
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtre catégorie + count */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map(c => {
            const count = c.value === '' ? null : articles.filter(a => a.category === c.value).length;
            return (
              <button
                key={c.value}
                onClick={() => setCat(c.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  cat === c.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.label}
                {count !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    cat === c.value ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{filtered.length} article{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm">Aucun article trouvé.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              {/* Thumbnail */}
              <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {a.image_url ? (
                  <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">
                    {a.category}
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <a
                  href={`/blog/${a.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-orange-600 truncate block transition-colors"
                >
                  {a.title}
                </a>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(a.published_at)}
                  {a.reading_time ? ` · ${a.reading_time} min` : ''}
                  {' · '}
                  <span className="capitalize">{a.category}</span>
                </p>
              </div>

              {/* Statut */}
              {a.status !== 'published' && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                  {a.status}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Link
                  href={`/blog-admin/${a.slug}/edit`}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-600 rounded-lg transition-colors"
                >
                  <Pencil size={12} strokeWidth={1.5} /> Modifier
                </Link>
                <DeleteArticleButton slug={a.slug} title={a.title} action={deleteAction} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
