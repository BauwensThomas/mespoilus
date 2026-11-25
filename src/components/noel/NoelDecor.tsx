'use client';

import Link from 'next/link';
import { ChevronRight, Gift, Heart } from 'lucide-react';
import { useNoel } from './NoelProvider';

/**
 * Bonnet centré sur le haut d'un logo, plus large que lui : le bord blanc en couvre tout le dessus.
 * Le parent doit être en position relative. Purement décoratif.
 */
export function NoelHat({ className = '' }: { className?: string }) {
  const { decor } = useNoel();
  if (!decor) return null;
  return (
    <svg viewBox="0 0 48 28" className={`absolute left-1/2 -translate-x-1/2 pointer-events-none ${className}`} aria-hidden="true">
      <path d="M5 20C8 8 16 1 26 1c10 0 16 5 17.5 11-3.5-2-6.5-2-9-.5 3.500 2 5.500 5 6.500 8.500z" fill="#dc2626" />
      <path d="M5 20C8 8 16 1 26 1 19 6 16 12 16 20z" fill="#b91c1c" opacity=".4" />
      <rect x="1" y="18" width="46" height="9" rx="4.5" fill="#fff" stroke="#d1d5db" />
      <circle cx="43" cy="13" r="4.200" fill="#fff" stroke="#d1d5db" />
    </svg>
  );
}

const BULBS = ['#dc2626', '#f59e0b', '#16a34a', '#2563eb'];

/** Guirlande fixe, sans clignotement, sous la bannière partenaire (sous le menu sur mobile). */
export function NoelGarland() {
  const { decor } = useNoel();
  if (!decor) return null;
  return (
    <div className="sticky top-20 md:top-[117px] z-20 h-0 pointer-events-none" aria-hidden="true">
    <svg className="absolute left-0 top-0 w-full h-4">
      <defs>
        <pattern id="noel-guirlande" width="112" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 0.5Q28 9 56 0.5Q84 9 112 0.5" fill="none" stroke="#166534" strokeWidth="1.4" />
          {BULBS.map((color, i) => {
            const x = 14 + i * 28;
            return (
              <g key={color}>
                <rect x={x - 1.5} y="3" width="3" height="3" rx="1" fill="#14532d" />
                <ellipse cx={x} cy="9" rx="2.8" ry="4" fill={color} />
              </g>
            );
          })}
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#noel-guirlande)" />
    </svg>
    </div>
  );
}

/** Lien vers les produits de Noël de la boutique, jusqu'au 25 décembre. */
export function NoelGifts({ className = '' }: { className?: string }) {
  const { gifts } = useNoel();
  if (!gifts) return null;
  return (
    <Link
      href="/boutique?search=noel"
      className={`flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-green-50 px-4 py-3 hover:border-red-400 transition-colors focus-ring group ${className}`}
    >
      <span className="shrink-0 w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
        <Gift size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900 leading-tight">Idées cadeaux de Noël</span>
        <span className="block text-xs text-gray-600 leading-tight mt-0.5">Jouets, friandises et calendriers de l&apos;Avent pour vos animaux.</span>
      </span>
      <ChevronRight size={18} className="text-red-500 shrink-0" aria-hidden="true" />
    </Link>
  );
}

export function NoelAdoptionMessage() {
  const { decor } = useNoel();
  if (!decor) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <Heart size={18} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-gray-700 leading-relaxed">
        <span className="font-semibold text-gray-900">Un animal n&apos;est pas un cadeau surprise.</span>{' '}
        Adopter, c&apos;est s&apos;engager pour des années : prenez le temps d&apos;y réfléchir avec toute la famille, en dehors de l&apos;agitation des fêtes.
      </p>
    </div>
  );
}
