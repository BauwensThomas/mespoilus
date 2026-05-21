'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminHideToggle({
  catalogId, name, status,
}: {
  catalogId: string;
  name: string;
  status: 'active' | 'hidden';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isHidden = status === 'hidden';

  async function toggle() {
    const action = isHidden ? 'show' : 'hide';
    const label = isHidden
      ? `Remettre "${name}" dans le catalogue ?`
      : `Masquer "${name}" du catalogue ?`;
    if (!confirm(label)) return;
    setLoading(true);
    await fetch('/api/boutique/hide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalog_id: catalogId, action }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isHidden ? 'Remettre dans le catalogue' : 'Masquer du catalogue'}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
        isHidden
          ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300'
          : 'bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 border-gray-200 hover:border-red-300'
      }`}
    >
      {isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
      {isHidden ? 'Afficher' : 'Masquer'}
    </button>
  );
}
