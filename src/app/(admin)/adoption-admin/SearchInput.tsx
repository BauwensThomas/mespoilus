'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface Props {
  defaultValue: string;
  status: string;
  animal: string;
  reason: string;
}

export default function ModerationSearchInput({ defaultValue, status, animal, reason }: Props) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ status, animal });
      if (status === 'deleted') p.set('reason', reason);
      if (value) p.set('q', value);
      router.replace(`/adoption-admin?${p}`);
    }, 350);
    return () => clearTimeout(t);
  }, [value, status, animal, reason, router]);

  return (
    <div className="relative max-w-xs">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Rechercher une annonce..."
        className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
