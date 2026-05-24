import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Package, Star } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

const COUNTRY_FLAGS: Record<string, string> = {
  fr: 'fr', be: 'be', ca: 'ca', us: 'us', gb: 'gb', de: 'de', nl: 'nl',
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

interface CatalogCardProps {
  catalogId: string;
  name: string;
  nameFr?: string | null;
  imageUrl: string | null;
  brand: string | null;
  weightG: number | null;
  price: number;
  currency: string;
  merchantName: string;
  country: string | null;
  affiliateUrl: string;
  offerCount: number;
}

export default function CatalogCard({
  catalogId, name, nameFr, imageUrl, brand, weightG, price, currency, merchantName, country, affiliateUrl, offerCount,
}: CatalogCardProps) {
  const flag = country ? COUNTRY_FLAGS[country] : null;
  const extraOffers = offerCount - 1;
  const eurPrice = toEUR(price, currency);

  return (
    <div className="relative h-full bg-white border border-gray-300 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:border-orange-300 transition-all duration-300 shadow-sm group">
      {/* Lien couvrant toute la carte */}
      <Link href={`/boutique/${catalogId}`} className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset rounded-2xl" aria-label={`Voir le produit : ${nameFr ?? name}`} />

      <div className="pointer-events-none relative h-56 bg-gradient-to-br from-orange-50 to-gray-50 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-200" strokeWidth={1} />
          </div>
        )}
        <span className="absolute top-2 left-2 relative z-10 pointer-events-auto">
          <FavoriteButton catalogId={catalogId} />
        </span>
        {flag && (
          <span className="absolute top-2 right-2">
            <img
              src={`https://flagcdn.com/16x12/${flag}.png`}
              alt={country!}
              width={20}
              height={16}
              className="w-5 h-4 rounded-sm shadow-sm"
            />
          </span>
        )}
      </div>

      <div className="pointer-events-none relative z-10 p-4 flex flex-col flex-1">

        <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-orange-600 transition-colors">
          {nameFr ?? name}
        </h3>


        <div className="flex-1" />

        <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
          {/* Prix */}
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-orange-500 fill-orange-500 shrink-0" />
            <span className="text-base font-bold text-orange-600 whitespace-nowrap">
              {price.toFixed(2)}{' '}
              <span className="text-sm font-semibold text-gray-500">{currency}</span>
            </span>
            {eurPrice !== null && (
              <span className="text-xs text-gray-400 whitespace-nowrap">(≈{eurPrice} €)</span>
            )}
          </div>
          {/* Bouton visuel - la navigation est assurée par le <Link> overlay */}
          <div className="w-full text-sm font-semibold py-2 rounded-lg bg-orange-600 group-hover:bg-orange-500 text-white transition-colors flex items-center justify-center gap-1.5">
            Voir <ExternalLink size={13} strokeWidth={1.5} />
          </div>
          {/* Marchand + badge offres - hauteur fixe pour aligner toutes les cartes */}
          <div className="flex items-center gap-2 min-h-[1.25rem]">
            <p className="text-xs text-gray-500 truncate flex-1 min-w-0">{merchantName}</p>
            {extraOffers > 0 && (
              <span className="shrink-0 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full font-medium">
                +{extraOffers} offre{extraOffers > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
