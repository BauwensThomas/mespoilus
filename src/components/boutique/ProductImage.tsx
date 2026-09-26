'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, type LucideIcon } from 'lucide-react';

// Les images produit sont hotlinkées depuis Awin/les marchands (pas stockées chez nous) :
// certaines finissent par disparaître (produit retiré du feed, CDN marchand qui bouge) et
// cassent silencieusement. On bascule sur l'icône de repli au lieu de l'icône "image cassée"
// du navigateur.
export default function ProductImage({
  src, alt, className, sizes,
  icon: Icon = Package, iconSize = 48, iconClassName = 'text-gray-200',
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  icon?: LucideIcon;
  iconSize?: number;
  iconClassName?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Icon size={iconSize} className={iconClassName} strokeWidth={1} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      className={className}
      sizes={sizes}
      onError={() => setBroken(true)}
    />
  );
}
