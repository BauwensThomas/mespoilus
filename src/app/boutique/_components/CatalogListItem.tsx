'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Package, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import FavoriteButton from './FavoriteButton';

const COUNTRY_FLAGS: Record<string, string> = {
  fr: 'fr', be: 'be', ca: 'ca', us: 'us', gb: 'gb', de: 'de', nl: 'nl',
};

const CATEGORY_LABELS: Record<string, string> = {
  chiens: 'Chiens', chats: 'Chats', oiseaux: 'Oiseaux',
  rongeurs: 'Rongeurs', reptiles: 'Reptiles', livres: 'Livres', general: 'General',
};

function formatWeight(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg`;
  return `${g} g`;
}

const EUR_RATES: Record<string, number> = { USD: 0.92, CAD: 0.68, GBP: 1.17 };
function toEUR(price: number, currency: string): number | null {
  const rate = EUR_RATES[currency];
  return rate ? Math.round(price * rate) : null;
}

interface CatalogListItemProps {
  catalogId: string;
  name: string;
  nameFr?: string | null;
  imageUrl: string | null;
  brand: string | null;
  weightG: number | null;
  category: string;
  price: number;
  currency: string;
  merchantName: string;
  country: string | null;
  affiliateUrl: string;
  offerCount: number;
}

export default function CatalogListItem({
  catalogId, name, nameFr, imageUrl, brand, weightG, category, price, currency, merchantName, country, affiliateUrl, offerCount,
}: CatalogListItemProps) {
  const flag = country ? COUNTRY_FLAGS[country] : null;
  const eurPrice = toEUR(price, currency);
  const extraOffers = offerCount - 1;
  const meta = [brand, weightG ? formatWeight(weightG) : null, CATEGORY_LABELS[category] ?? category].filter(Boolean);

  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    const favs: string[] = JSON.parse(localStorage.getItem('mp_favorites') ?? '[]');
    setIsFav(favs.includes(catalogId));
    const onFavChange = (e: Event) => {
      const { catalogId: id, isFav: val } = (e as CustomEvent).detail;
      if (id === catalogId) setIsFav(val);
    };
    window.addEventListener('mp:favorites', onFavChange);
    return () => window.removeEventListener('mp:favorites', onFavChange);
  }, [catalogId]);

  return (
    <div className={`relative border rounded-xl flex items-center gap-4 p-4 hover:shadow-md transition-all duration-200 group ${
      isFav
        ? 'bg-orange-50 border-orange-300 hover:border-orange-400'
        : 'bg-white border-gray-300 hover:border-orange-300'
    }`}>
      <Link href={`/boutique/${catalogId}`} className="absolute inset-0 z-0" aria-label={`Voir le produit : ${nameFr ?? name}`} />
      <div className="pointer-events-none relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            className="object-contain p-1.5"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={28} className="text-gray-200" strokeWidth={1} />
          </div>
        )}
      </div>

      <div className="pointer-events-none flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
          {nameFr ?? name}
        </h3>
        {nameFr && (
          <p className="text-sm text-gray-400 line-clamp-1">{name}</p>
        )}
        {meta.length > 0 && (
          <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{meta.join(' · ')}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {flag && (
            <img src={`https://flagcdn.com/16x12/${flag}.png`} alt={country!} className="w-4 h-3 rounded-sm" />
          )}
          <span className="text-sm text-gray-500">{merchantName}</span>
          {extraOffers > 0 && (
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
              +{extraOffers} offre{extraOffers > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 shrink-0 flex flex-col items-end gap-1.5">
        <div className="pointer-events-none flex items-center gap-1.5 flex-wrap justify-end">
          <Star size={13} className="text-orange-500 fill-orange-500" />
          <span className="text-lg font-bold text-orange-600">
            {price.toFixed(2)}{' '}
            <span className="text-sm font-semibold text-gray-600">{currency}</span>
          </span>
          {eurPrice !== null && (
            <span className="text-base text-gray-700">(≈{eurPrice} €)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton catalogId={catalogId} />
          <Link
            href={`/boutique/${catalogId}`}
            className="relative z-10 pointer-events-auto text-sm font-semibold px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
            aria-label={`Voir le produit : ${name}`}
          >
            Voir <ExternalLink size={13} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
