'use client';

import { Trash2 } from 'lucide-react';

export default function DeletePostButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} className="flex-1">
      <button
        type="submit"
        onClick={e => { if (!confirm('Supprimer définitivement cette annonce ?')) e.preventDefault(); }}
        className="w-full px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
      >
        <Trash2 size={13} strokeWidth={1.5} />
        Supprimer
      </button>
    </form>
  );
}
