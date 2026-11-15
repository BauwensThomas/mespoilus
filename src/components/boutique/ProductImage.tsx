'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, PawPrint } from 'lucide-react';

// Un composant (fonction) ne peut pas être passé en prop d'un Server Component vers ce
// Client Component (RSC boundary) -> on accepte une clé string, résolue ici localement.
const ICONS = { package: Package, pawprint: PawPrint } as const;

// Les images produit sont hotlinkées depuis Awin/les marchands (pas stockées chez nous) :
// certaines finissent par disparaître (produit retiré du feed, CDN marchand qui bouge) et
// cassent silencieusement. On bascule sur l'icône de repli au lieu de l'icône "image cassée"
// du navigateur.
//
// Les images Awin passent par leur proxy images2.productserve.com, bloqué par la plupart des
// bloqueurs de pub et filtres DNS (domaine d'affiliation) : l'image apparaît alors cassée.
// Avant l'icône de repli, on tente donc l'image d'origine du marchand, encodée dans le
// paramètre url= du proxy ("ssl:media.zooplus.com/..." -> "https://media.zooplus.com/...").
export function directImageUrl(src: string): string | null {
  try {
    const u = new URL(src);
    if (!u.hostname.endsWith('productserve.com')) return null;
    const raw = u.searchParams.get('url');
    if (!raw) return null;
    const direct = raw.replace(/^ssl:/i, 'https://').replace(/^nossl:/i, 'http://');
    return /^https?:\/\//i.test(direct) ? direct : `https://${direct}`;
  } catch {
    return null;
  }
}

export default function ProductImage({
  src, alt, className, sizes,
  icon = 'package', iconSize = 48, iconClassName = 'text-gray-200',
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  icon?: keyof typeof ICONS;
  iconSize?: number;
  iconClassName?: string;
}) {
  const Icon = ICONS[icon];
  // 0 = image fournie, 1 = image directe du marchand, 2 = icône de repli
  const [attempt, setAttempt] = useState(0);
  const fallback = src ? directImageUrl(src) : null;
  const current = attempt === 0 ? src : attempt === 1 ? fallback : null;

  if (!current) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Icon size={iconSize} className={iconClassName} strokeWidth={1} />
      </div>
    );
  }

  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      fill
      unoptimized
      className={className}
      sizes={sizes}
      onError={() => setAttempt(a => (a === 0 && fallback ? 1 : 2))}
    />
  );
}
