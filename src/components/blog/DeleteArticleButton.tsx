'use client';

import { Trash2 } from 'lucide-react';

interface Props {
  slug: string;
  title: string;
  action: (formData: FormData) => Promise<void>;
}

export default function DeleteArticleButton({ slug, title, action }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        onClick={e => { if (!confirm(`Supprimer "${title}" ?`)) e.preventDefault(); }}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 rounded-lg transition-colors"
      >
        <Trash2 size={12} strokeWidth={1.5} /> Supprimer
      </button>
    </form>
  );
}
