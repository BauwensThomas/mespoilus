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
      <Link href={`/boutique/${catalogId}`} className="absolute inset-0 z-0" aria-label={`Voir le produit : ${nameFr ?? name}`} />

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
        <span className="absolute top-2 left-2">
          <FavoriteButton catalogId={catalogId} />
        </span>
        {flag && (
          <span className="absolute top-2 right-2">
            <img
              src={`https://flagcdn.com/16x12/${flag}.png`}
              alt={country!}
              className="w-5 h-4 rounded-sm shadow-sm"
            />
          </span>
        )}
      </div>

      <div className="pointer-events-none relative z-10 p-4 flex flex-col flex-1">
        {(brand || weightG) && (
          <p className="text-sm text-gray-400 uppercase tracking-widest font-medium line-clamp-1 mb-2">
            {[brand, weightG ? formatWeight(weightG) : null].filter(Boolean).join(' · ')}
          </p>
        )}

        <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-orange-600 transition-colors">
          {nameFr ?? name}
        </h3>
        {nameFr && (
          <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{name}</p>
        )}

        <div className="flex-1" />

        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Star size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-lg font-bold text-orange-600">
                  {price.toFixed(2)}{' '}
                  <span className="text-sm font-semibold text-gray-600">{currency}</span>
                </span>
                {eurPrice !== null && (
                  <span className="text-base text-gray-700">(≈{eurPrice} €)</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {merchantName}
                {extraOffers > 0 && (
                  <span className="ml-1.5 text-orange-500 font-semibold">
                    +{extraOffers} offre{extraOffers > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <Link
              href={`/boutique/${catalogId}`}
              className="pointer-events-auto relative z-10 shrink-0 text-sm font-semibold px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
              aria-label={`Voir le produit : ${name}`}
            >
              Voir
              <ExternalLink size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
