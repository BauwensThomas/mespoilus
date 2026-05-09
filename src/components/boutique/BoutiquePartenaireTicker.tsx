'use client';
import type { Partenaire } from '@/lib/partenaires';

export default function BoutiquePartenaireTicker({ partenaires }: { partenaires: Partenaire[] }) {
  if (!partenaires.length) return null;

  const items = [...partenaires, ...partenaires];

  return (
    <div className="sticky top-20 z-20 bg-white/95 backdrop-blur border-b border-gray-100 h-8 overflow-hidden flex items-center">
      <div className="ticker-track flex items-center gap-12 whitespace-nowrap px-6">
        {items.map((p, i) => (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-2 shrink-0 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
            <span className="text-xs font-medium">{p.nom}</span>
            {p.tag && <span className="text-[10px] text-orange-400/70">{p.tag}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}
