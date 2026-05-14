import Image from 'next/image';
import { ExternalLink, Package } from 'lucide-react';
import type { AwinProduct } from '@/types';

export default function ProductCard({ product }: { product: AwinProduct }) {
  const outOfStock = !product.in_stock;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 shadow-md group focus-within:ring-2 focus-within:ring-orange-300 ${
      outOfStock ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-orange-300'
    }`}>
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-blue-50 overflow-hidden">
        {outOfStock && (
          <div className="absolute top-2 left-2 z-10 bg-gray-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Indisponible
          </div>
        )}
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            unoptimized
            className={`object-contain p-4 transition-smooth ${outOfStock ? '' : 'group-hover:scale-105'}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          {(() => {
            const suffix = product.merchant_name.match(/\b([A-Z]{2})$/)?.[1]?.toLowerCase() ?? null;
            const countryCode = suffix ?? (product.currency === 'USD' ? 'us' : product.currency === 'CAD' ? 'ca' : product.currency === 'GBP' ? 'gb' : null);
            if (!countryCode) return null;
            const label = countryCode.toUpperCase();
            return <img src={`https://flagcdn.com/16x12/${countryCode}.png`} alt={label} className="w-4 h-3" />;
          })()}
          {product.merchant_name}
        </p>
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span className={`font-bold text-lg ${outOfStock ? 'text-gray-400' : 'text-orange-600'}`}>
            {product.price.toFixed(2)} <span className="text-sm text-gray-500">{product.currency}</span>
          </span>
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 ${
              outOfStock
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
            aria-label={`${outOfStock ? 'Vérifier disponibilité' : 'Voir le produit'}: ${product.name}`}
          >
            {outOfStock ? 'Vérifier' : 'Voir'}
            <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}
