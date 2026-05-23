'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TYPES = [
  { value: 'nourriture',  label: 'Alimentation' },
  { value: 'jouets',      label: 'Jouets' },
  { value: 'hygiene',     label: 'Soin & Hygiène' },
  { value: 'sante',       label: 'Santé' },
  { value: 'habitat',     label: 'Habitat' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'livres',      label: 'Livres' },
];

const TYPE_COLORS: Record<string, string> = {
  nourriture:  'bg-orange-50 text-orange-700 border-orange-200',
  jouets:      'bg-blue-50 text-blue-700 border-blue-200',
  hygiene:     'bg-purple-50 text-purple-700 border-purple-200',
  sante:       'bg-green-50 text-green-700 border-green-200',
  habitat:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  accessoires: 'bg-gray-100 text-gray-600 border-gray-200',
  livres:      'bg-teal-50 text-teal-700 border-teal-200',
};

interface ProductTypeCellProps {
  catalogId: string;
  productType: string | null;
}

export default function ProductTypeCell({ catalogId, productType }: ProductTypeCellProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(productType);
  const [saving, setSaving] = useState(false);

  async function handleChange(newType: string | null) {
    setSaving(true);
    try {
      await fetch('/api/admin/catalog/product-type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogId, productType: newType }),
      });
      setCurrent(newType);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const colorClass = current ? (TYPE_COLORS[current] ?? 'bg-gray-100 text-gray-600 border-gray-200') : 'bg-red-50 text-red-400 border-red-100';
  const label = current ? (TYPES.find(t => t.value === current)?.label ?? current) : 'Aucun';

  return (
    <div className="relative group">
      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium cursor-pointer select-none ${colorClass} ${saving ? 'opacity-50' : ''}`}>
        {label}
      </span>
      <select
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        value={current ?? ''}
        disabled={saving}
        onChange={e => handleChange(e.target.value || null)}
      >
        <option value="">Aucun</option>
        {TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}
