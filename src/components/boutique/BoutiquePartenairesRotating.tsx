'use client';
import { useState, useEffect } from 'react';
import type { Partenaire } from '@/lib/partenaires';
import { getFlagUrl } from '@/lib/partenaires';

const SHOW = 3;

export default function BoutiquePartenairesRotating({ partenaires }: { partenaires: Partenaire[] }) {
  const [start, setStart] = useState(0);

  useEffect(() => {
    if (partenaires.length <= SHOW) return;
    const t = setInterval(() => setStart(i => (i + 1) % partenaires.length), 4000);
    return () => clearInterval(t);
  }, [partenaires.length]);

  const visible = Array.from({ length: Math.min(SHOW, partenaires.length) }, (_, i) =>
    partenaires[(start + i) % partenaires.length]
  );

  if (!visible.length) return null;

  return (
    <div className="flex gap-2 shrink-0">
      {visible.map((p, i) => (
        <a
          key={`${p.id}-${start}-${i}`}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-3 py-2 hover:border-amber-400/50 hover:shadow-sm transition-all whitespace-nowrap"
        >
          <span className="text-base">{p.emoji}</span>
          <span className="text-xs font-semibold text-gray-900">{p.nom}</span>
          {(p.pays ?? []).map(code => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={code} src={getFlagUrl(code)} alt={code} className="w-3.5 h-auto" />
          ))}
          <span className="text-amber-500 text-xs font-bold ml-0.5">→</span>
        </a>
      ))}
    </div>
  );
}
